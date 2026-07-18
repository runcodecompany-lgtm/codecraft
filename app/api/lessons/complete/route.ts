// app/api/lessons/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { addCoins, addXp, checkAndAwardAchievement } from '@/lib/gamification'
import { updateCourseProgress } from '@/actions/enrollment'
import { createNotification } from '@/lib/foundation'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId } = await req.json()
    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId required' }, { status: 400 })
    }

    // Check if already completed
    const existing = await prisma.userProgress.findUnique({
      where: { userId_lessonId: { userId: session.id, lessonId } },
      select: { isCompleted: true },
    })

    const wasCompleted = existing?.isCompleted || false

    // Fetch lesson details to get course ID
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
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Upsert progress
    await prisma.userProgress.upsert({
      where: { userId_lessonId: { userId: session.id, lessonId } },
      create: { userId: session.id, lessonId, isCompleted: true },
      update: { isCompleted: true },
    })

    if (!wasCompleted) {
      const COINS_PER_LESSON = 10
      const XP_PER_LESSON = 15

      // Award coins and XP
      await addCoins(session.id, COINS_PER_LESSON, `إكمال درس: ${lesson.title}`)
      await addXp(session.id, XP_PER_LESSON, `إكمال درس: ${lesson.title}`)

      // Send notification
      await createNotification(
        session.id,
        `✅ أتممت دراسة الدرس: ${lesson.title}`,
        `لقد أنهيت درس "${lesson.title}" بنجاح وحصلت على +${XP_PER_LESSON} XP و +${COINS_PER_LESSON} عملة.`,
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

    return NextResponse.json({ success: true, coinsEarned: 10 })
  } catch (error) {
    console.error('Mark lesson complete error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
