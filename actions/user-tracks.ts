"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { DifficultyLevel } from "@prisma/client"

function normalizeTrackSelection(primaryTrackId: string, secondaryTrackIds: string[]) {
  const uniqueSecondaryTrackIds = Array.from(
    new Set(
      secondaryTrackIds
        .filter(Boolean)
        .filter((trackId) => trackId !== primaryTrackId),
    ),
  )

  return {
    primaryTrackId,
    secondaryTrackIds: uniqueSecondaryTrackIds,
    allTrackIds: [primaryTrackId, ...uniqueSecondaryTrackIds],
  }
}

export async function updateUserTracks(
  selectedTrackIds: string[],
  learningGoals?: string[],
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: "يجب تسجيل الدخول أولاً." }
    }

    if (!selectedTrackIds || selectedTrackIds.length === 0) {
      return { success: false, error: "يجب اختيار مسار تعليمي واحد على الأقل." }
    }

    const uniqueTrackIds = Array.from(new Set(selectedTrackIds.filter(Boolean)))

    // 1. Validate tracks exist
    const validTracks = await prisma.learningTrack.findMany({
      where: { id: { in: uniqueTrackIds } },
    })

    if (validTracks.length !== uniqueTrackIds.length) {
      return { success: false, error: "بعض المسارات المحددة غير موجودة." }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Clean up old unique constraints on userId that might be lingering in DB
      try {
        await tx.$executeRawUnsafe('ALTER TABLE "UserTrack" DROP CONSTRAINT IF EXISTS "UserTrack_userId_key";')
        await tx.$executeRawUnsafe('DROP INDEX IF EXISTS "UserTrack_userId_key";')
        await tx.$executeRawUnsafe('DROP INDEX IF EXISTS "UserTrack_userId_idx";')
        await tx.$executeRawUnsafe('DROP INDEX IF EXISTS "UserTrack_userId_uniq";')
      } catch (err) {
        console.warn("Could not drop index in transaction:", err)
      }

      // 2. Set all existing tracks for this user to isPrimary = false first
      // to avoid violating the "UserTrack_one_primary_track_per_user_idx" unique index
      // when we upsert the new primary track.
      await tx.userTrack.updateMany({
        where: { userId: session.id },
        data: { isPrimary: false }
      })

      // Get existing tracks
      const existingTracks = await tx.userTrack.findMany({
        where: { userId: session.id }
      })

      const existingTrackIds = existingTracks.map(t => t.trackId)
      
      // Tracks to delete (not in selectedTrackIds)
      const tracksToDelete = existingTrackIds.filter(
        (id) => !uniqueTrackIds.includes(id),
      )
      if (tracksToDelete.length > 0) {
        await tx.userTrack.deleteMany({
          where: {
            userId: session.id,
            trackId: { in: tracksToDelete }
          }
        })
      }

      // Upsert selected tracks (first one is marked isPrimary: true, others isPrimary: false)
      for (let i = 0; i < uniqueTrackIds.length; i++) {
        const trackId = uniqueTrackIds[i]
        const isPrimary = i === 0

        await tx.userTrack.upsert({
          where: { userId_trackId: { userId: session.id, trackId } },
          update: { isPrimary },
          create: { userId: session.id, trackId, isPrimary }
        })
      }

      await tx.learningProfile.upsert({
        where: { userId: session.id },
        update: {
          primaryTrackId: uniqueTrackIds[0],
          learningGoals: learningGoals && learningGoals.length > 0 ? learningGoals : [],
        },
        create: {
          userId: session.id,
          primaryTrackId: uniqueTrackIds[0],
          learningGoals: learningGoals && learningGoals.length > 0 ? learningGoals : [],
        },
      })
    })

    revalidatePath("/dashboard/student")
    revalidatePath("/dashboard/student/profile")

    return { success: true }
  } catch (error) {
    console.error("Error updating user tracks:", error)
    return { success: false, error: "فشل تحديث المسارات التعليمية." }
  }
}

function sortTrackRole<T extends { isPrimary: boolean; createdAt?: Date }>(tracks: T[]) {
  return [...tracks].sort((a, b) => {
    if (a.isPrimary === b.isPrimary) {
      return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
    }

    return a.isPrimary ? -1 : 1
  })
}

export async function getCurrentUserLearningSetup() {
  const session = await getServerSession()
  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول أولاً." }
  }

  try {
    const learningProfile = await prisma.learningProfile.findUnique({
      where: { userId: session.id },
      select: {
        learningGoals: true,
      },
    })

    const userTracks = await prisma.userTrack.findMany({
      where: { userId: session.id },
      include: {
        track: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    })

    const attempts = await prisma.placementTestAttempt.findMany({
      where: { userId: session.id, trackId: { not: null } },
      orderBy: { createdAt: "desc" },
    })

    const recommendations = await prisma.trackRecommendation.findMany({
      where: { userId: session.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            level: true,
            priceInCoins: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const latestAttemptByTrack = new Map<string, (typeof attempts)[number]>()
    for (const attempt of attempts) {
      if (attempt.trackId && !latestAttemptByTrack.has(attempt.trackId)) {
        latestAttemptByTrack.set(attempt.trackId, attempt)
      }
    }

    const recommendationsByTrack = new Map<string, typeof recommendations>()
    for (const recommendation of recommendations) {
      const bucket = recommendationsByTrack.get(recommendation.trackId) || []
      bucket.push(recommendation)
      recommendationsByTrack.set(recommendation.trackId, bucket)
    }

    return {
      success: true,
      learningGoals: Array.isArray(learningProfile?.learningGoals)
        ? (learningProfile?.learningGoals as string[])
        : [],
      tracks: sortTrackRole(
        userTracks.map((userTrack) => {
          const latestAttempt = latestAttemptByTrack.get(userTrack.trackId)
          const trackRecommendations = recommendationsByTrack.get(userTrack.trackId) || []

          return {
            id: userTrack.id,
            trackId: userTrack.trackId,
            name: userTrack.track.name,
            description: userTrack.track.description,
            isPrimary: userTrack.isPrimary,
            level: userTrack.level as DifficultyLevel,
            progress: userTrack.progress,
            createdAt: userTrack.createdAt,
            latestAttempt: latestAttempt
              ? {
                  id: latestAttempt.id,
                  score: latestAttempt.score,
                  level: latestAttempt.level,
                  createdAt: latestAttempt.createdAt,
                }
              : null,
            recommendations: trackRecommendations.map((recommendation) => ({
              id: recommendation.id,
              reason: recommendation.reason,
              course: recommendation.course,
            })),
          }
        }),
      ),
    }
  } catch (error) {
    console.error("Error fetching current user learning setup:", error)
    return { success: false, error: "فشل جلب بيانات المسارات التعليمية." }
  }
}
