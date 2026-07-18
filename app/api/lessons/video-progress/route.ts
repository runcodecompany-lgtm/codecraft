// app/api/lessons/video-progress/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { addCoins, addXp, checkAndAwardAchievement } from "@/lib/gamification"
import { updateCourseProgress } from "@/actions/enrollment"
import { createNotification } from "@/lib/foundation"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lessonId, seconds, duration } = await req.json()
    if (!lessonId || seconds === undefined || !duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const pct = Math.min(100, Math.max(0, (seconds / duration) * 100))

    // 1. Fetch current progress
    const currentProgress = await prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId,
        },
      },
      select: { isCompleted: true, videoCompletion: true },
    })

    const wasCompleted = currentProgress?.isCompleted || false
    // Complete lesson if watch progress is >= 90%
    const isCompletedNow = wasCompleted || pct >= 90

    // 2. Fetch lesson details to get course connection
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        title: true,
        module: {
          select: {
            courseId: true,
            course: { select: { title: true } },
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 44 })
    }

    // 3. Upsert progress
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId,
        },
      },
      create: {
        userId: session.id,
        lessonId,
        lastWatchedSeconds: seconds,
        videoCompletion: pct,
        isCompleted: isCompletedNow,
      },
      update: {
        lastWatchedSeconds: seconds,
        videoCompletion: Math.max(currentProgress?.videoCompletion || 0, pct),
        isCompleted: isCompletedNow,
      },
    })

    // 4. Award rewards if newly completed
    if (isCompletedNow && !wasCompleted) {
      const COINS_PER_LESSON = 10
      const XP_PER_LESSON = 15

      // Add rewards
      await addCoins(session.id, COINS_PER_LESSON, `إكمال درس فيديو: ${lesson.title}`)
      await addXp(session.id, XP_PER_LESSON, `إكمال درس فيديو: ${lesson.title}`)

      // Send completion notification
      await createNotification(
        session.id,
        `✅ أتممت دراسة الدرس: ${lesson.title}`,
        `لقد أنهيت مشاهدة درس "${lesson.title}" بنجاح وحصلت على +${XP_PER_LESSON} XP و +${COINS_PER_LESSON} عملة.`,
        "COURSE"
      )

      // Check for first lesson achievement
      await checkAndAwardAchievement(session.id, "FIRST_LESSON")

      // Update course progress
      await updateCourseProgress(session.id, lesson.module.courseId)

      // Trigger referral verification
      const { verifyAndRewardReferral } = await import("@/actions/referrals")
      await verifyAndRewardReferral(session.id)
    }

    return NextResponse.json({
      success: true,
      videoCompletion: progress.videoCompletion,
      isCompleted: progress.isCompleted,
    })
  } catch (error) {
    console.error("Video progress API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
