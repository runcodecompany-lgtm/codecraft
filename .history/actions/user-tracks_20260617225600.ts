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
  primaryTrackId: string,
  secondaryTrackIds: string[],
  learningGoals?: string[],
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: "يجب تسجيل الدخول أولاً." }
    }

    if (!primaryTrackId) {
      return { success: false, error: "يجب اختيار المسار الرئيسي." }
    }

    const normalizedSelection = normalizeTrackSelection(primaryTrackId, secondaryTrackIds)

    // 1. Validate tracks exist
    const validTracks = await prisma.learningTrack.findMany({
      where: { id: { in: normalizedSelection.allTrackIds } },
    })

    if (validTracks.length !== normalizedSelection.allTrackIds.length) {
      return { success: false, error: "بعض المسارات المحددة غير موجودة." }
    }

    // 2. Begin transaction to update UserTrack records
    await prisma.$transaction(async (tx) => {
      // Get existing tracks
      const existingTracks = await tx.userTrack.findMany({
        where: { userId: session.id }
      })

      const existingTrackIds = existingTracks.map(t => t.trackId)
      
      // Tracks to delete (not in primary or secondary)
      const tracksToDelete = existingTrackIds.filter(
        (id) => !normalizedSelection.allTrackIds.includes(id),
      )
      if (tracksToDelete.length > 0) {
        await tx.userTrack.deleteMany({
          where: {
            userId: session.id,
            trackId: { in: tracksToDelete }
          }
        })
      }

      // Upsert primary track
      await tx.userTrack.upsert({
        where: { userId_trackId: { userId: session.id, trackId: normalizedSelection.primaryTrackId } },
        update: { isPrimary: true },
        create: { userId: session.id, trackId: normalizedSelection.primaryTrackId, isPrimary: true },
      })

      // Upsert secondary tracks
      for (const trackId of normalizedSelection.secondaryTrackIds) {
        await tx.userTrack.upsert({
          where: { userId_trackId: { userId: session.id, trackId } },
          update: { isPrimary: false },
          create: { userId: session.id, trackId, isPrimary: false }
        })
      }

      // Ensure the previous primary track is no longer marked as primary.
      await tx.userTrack.updateMany({
        where: {
          userId: session.id,
          trackId: { not: normalizedSelection.primaryTrackId },
          isPrimary: true,
        },
        data: { isPrimary: false },
      })

      await tx.learningProfile.upsert({
        where: { userId: session.id },
        update: {
          primaryTrackId: normalizedSelection.primaryTrackId,
          learningGoals: learningGoals && learningGoals.length > 0 ? learningGoals : [],
        },
        create: {
          userId: session.id,
          primaryTrackId: normalizedSelection.primaryTrackId,
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
