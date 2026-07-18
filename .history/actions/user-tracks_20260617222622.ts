"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

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
