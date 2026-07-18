// actions/placement.ts
"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { createAuditLog, createNotification } from "@/lib/foundation"
import { addXp, addCoins } from "@/lib/gamification"
import { revalidatePath } from "next/cache"
import {
  getDifficultyLabelWithEnglish,
  getPlacementBank,
  getPlacementQuestionsForTrack,
} from "@/lib/learning"
import { aiGenerateJSON } from "@/lib/ai-config"

/**
 * Get placement test questions (stripping correct answers for security)
 */
export async function getPlacementQuestions(trackId?: string) {
  const session = await getServerSession()
  if (!session) {
    throw new Error("يجب تسجيل الدخول لإجراء الاختبار.")
  }

  if (!trackId) {
    throw new Error("يجب تحديد المسار التعليمي لإجراء الاختبار.")
  }

  const track = await prisma.learningTrack.findUnique({
    where: { id: trackId },
    select: { id: true, name: true },
  })

  if (!track) {
    throw new Error("المسار التعليمي المطلوب غير موجود.")
  }

  // Load placement test settings and static questions from DB
  const placementTest = await prisma.placementTest.findUnique({
    where: { trackId },
    include: {
      testQuestions: {
        include: {
          question: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  })

  let staticQuestions: any[] = []
  let useAi = false
  let aiQuestionCount = 0

  if (placementTest) {
    useAi = placementTest.useAi
    aiQuestionCount = placementTest.aiQuestionCount
    staticQuestions = placementTest.testQuestions.map((tq) => ({
      id: tq.question.id,
      questionText: tq.question.questionText,
      options: tq.question.options as string[],
      correctAnswer: tq.question.correctAnswer,
      difficulty: tq.question.difficulty,
    }))
  }

  let finalQuestions: any[] = [...staticQuestions]

  // If AI is enabled, generate dynamic questions matching track topic
  if (useAi && aiQuestionCount > 0) {
    try {
      const prompt = `أنت خبير تعليمي ومطور برمجيات ذكي. قم بتوليد ${aiQuestionCount} أسئلة اختبار تحديد مستوى متعددة الخيارات (Multiple Choice) لمسار تعليمي يسمى "${track.name}".
يجب أن تكون الأسئلة باللغة العربية الفصحى وموجهة لقياس القدرات.
وزع مستويات الصعوبة بين (BEGINNER, INTERMEDIATE, ADVANCED) بناءً على طبيعة المسار.
كل سؤال يجب أن يحتوي على 4 اختيارات واختيار واحد فقط صحيح.

أعد النتيجة بصيغة JSON كالتالي:
{
  "questions": [
    {
      "id": "معرف عشوائي فريد مثلا ai_q1",
      "questionText": "نص السؤال هنا؟",
      "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
      "correctAnswer": "الخيار الثاني",
      "difficulty": "INTERMEDIATE"
    }
  ]
}`

      const aiResponse = await aiGenerateJSON<{ questions: any[] }>({
        messages: [
          { role: "system", content: "أنت مسؤول عن توليد أسئلة اختبارات ذكية ومحكمة لمنصة Code Craft Core." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      })

      if (aiResponse && aiResponse.questions && aiResponse.questions.length > 0) {
        finalQuestions = [...finalQuestions, ...aiResponse.questions]
      }
    } catch (err) {
      console.error("AI question generation failed, falling back to static questions:", err)
    }
  }

  // Fallback to legacy programmatic bank if no questions exist
  if (finalQuestions.length === 0) {
    const legacyQuestions = getPlacementQuestionsForTrack(track.name)
    finalQuestions = legacyQuestions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
    }))
  }

  // Save the full questions in PlacementAiSession for secure grading
  await prisma.placementAiSession.upsert({
    where: {
      userId_trackId: {
        userId: session.id,
        trackId,
      },
    },
    update: {
      questions: finalQuestions,
    },
    create: {
      userId: session.id,
      trackId,
      questions: finalQuestions,
    },
  })

  // Strip correct answers
  return finalQuestions.map(({ id, questionText, options, difficulty }) => ({
    id,
    questionText,
    options,
    difficulty,
  }))
}

/**
 * Submit answers, calculate score, place student in level, award points/XP, and return recommendations.
 */
export async function submitPlacementTest(answers: Record<string, string>, trackId: string) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: "يجب تسجيل الدخول أولاً." }
    }

    const track = await prisma.learningTrack.findUnique({
      where: { id: trackId },
      select: { id: true, name: true },
    })

    if (!track) {
      return { success: false, error: "المسار التعليمي غير موجود." }
    }

    // Retrieve the active session for the user and track
    const aiSession = await prisma.placementAiSession.findUnique({
      where: {
        userId_trackId: {
          userId: session.id,
          trackId,
        },
      },
    })

    let questions: any[] = []
    if (aiSession) {
      questions = aiSession.questions as any[]
    } else {
      // Fallback to legacy bank
      const bank = getPlacementBank(track.name)
      questions = bank.questions
    }

    // Double submission check
    const existingAttempt = await prisma.placementTestAttempt.findFirst({
      where: { userId: session.id, trackId },
    })

    if (existingAttempt) {
      return {
        success: false,
        error: "لقد أجريت اختبار تحديد المستوى مسبقاً ولا يمكن إعادته.",
      }
    }

    // Correction
    let correctCount = 0
    questions.forEach((q) => {
      const userAnswer = answers[q.id]
      if (userAnswer === q.correctAnswer) {
        correctCount++
      }
    })

    // Determine level based on percentage
    let level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" = "BEGINNER"
    const totalQuestions = questions.length || 1
    const scorePercentage = (correctCount / totalQuestions) * 100
    if (scorePercentage >= 80) {
      level = "ADVANCED"
    } else if (scorePercentage >= 50) {
      level = "INTERMEDIATE"
    }

    // Fetch recommended courses
    const recommendedCourses = await prisma.course.findMany({
      where: {
        isPublished: true,
        trackId,
        level:
          level === "BEGINNER"
            ? "BEGINNER"
            : level === "INTERMEDIATE"
            ? { in: ["BEGINNER", "INTERMEDIATE"] }
            : undefined,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        priceInCoins: true,
        level: true,
      },
      take: 3,
    })

    await prisma.$transaction(async (tx) => {
      // Clean up dynamic session
      await tx.placementAiSession.deleteMany({
        where: { userId: session.id, trackId },
      })

      await tx.placementTest.upsert({
        where: { trackId },
        update: {
          questionCount: questions.length,
        },
        create: {
          trackId,
          title: `اختبار تحديد مستوى ${track.name}`,
          questionCount: questions.length,
        },
      })

      await tx.placementTestAttempt.create({
        data: {
          userId: session.id,
          trackId,
          score: correctCount,
          level,
        },
      })

      await tx.userTrack.upsert({
        where: {
          userId_trackId: {
            userId: session.id,
            trackId,
          },
        },
        update: {
          level,
        },
        create: {
          userId: session.id,
          trackId,
          level,
          isPrimary: false,
        },
      })

      const primaryTrack = await tx.userTrack.findFirst({
        where: { userId: session.id, isPrimary: true },
        select: { trackId: true },
      })

      await tx.learningProfile.upsert({
        where: { userId: session.id },
        update: {
          primaryTrackId: primaryTrack?.trackId ?? trackId,
        },
        create: {
          userId: session.id,
          primaryTrackId: primaryTrack?.trackId ?? trackId,
          learningGoals: [],
        },
      })

      await tx.trackRecommendation.deleteMany({
        where: { userId: session.id, trackId },
      })

      if (recommendedCourses.length > 0) {
        await tx.trackRecommendation.createMany({
          data: recommendedCourses.map((course) => ({
            userId: session.id,
            trackId,
            courseId: course.id,
            reason: `اقتراح مناسب لمستوى ${level} في مسار ${track.name}`,
          })),
        })
      }
    })

    const arLevel = getDifficultyLabelWithEnglish(level)

    // Award welcome XP & Coins based on placement success
    const coinsAward = 150
    const xpAward = 100

    await addCoins(session.id, coinsAward, `مكافأة إتمام اختبار تحديد المستوى لمسار ${track.name} (${correctCount}/${questions.length})`)
    await addXp(session.id, xpAward, `إتمام اختبار تحديد المستوى لمسار ${track.name}`)

    // Send notifications
    await createNotification(
      session.id,
      `🎯 تم تحديد مستواك في مسار ${track.name}: ${arLevel}`,
      `لقد اجتزت اختبار تحديد المستوى الخاص بمسار ${track.name} بنجاح بمعدل ${correctCount}/${questions.length} إجابات صحيحة. مستواك المقترح هو ${arLevel}.`,
      "SYSTEM"
    )

    // Write audit log
    await createAuditLog(
      session.id,
      "Placement Test Completed",
      null,
      null,
      `Track: ${track.name}. Score: ${correctCount}/${questions.length}. Assigned Level: ${level}`
    )

    revalidatePath("/dashboard/student")
    revalidatePath("/dashboard/student/placement")
    revalidatePath("/dashboard/student/profile")
    return {
      success: true,
      track,
      score: correctCount,
      level,
      arLevel,
      coinsAward,
      xpAward,
      recommendedCourses,
    }
  } catch (error) {
    console.error("Error submitting placement test:", error)
    return { success: false, error: "حدث خطأ غير متوقع أثناء تصحيح الاختبار." }
  }
}
