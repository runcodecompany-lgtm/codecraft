"use server"

import prisma from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import { DifficultyLevel } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { guardAction } from "@/lib/action-guard"

export interface QuizQuestion {
  id: string
  questionText: string
  options: string[]
  difficulty: DifficultyLevel
  correctAnswer: string // Hidden in client view, only used on server side
  isMock?: boolean
}

// Mock question bank for fallback / demo
const MOCK_QUESTIONS: QuizQuestion[] = [
  // BEGINNER
  {
    id: "mock-b1",
    questionText: "ما هو الوسم الصحيح لإنشاء عنوان رئيسي كبير جداً في HTML؟",
    options: ["<h6>", "<heading>", "<h1>", "<head>"],
    correctAnswer: "<h1>",
    difficulty: "BEGINNER",
    isMock: true,
  },
  {
    id: "mock-b2",
    questionText: "كيف نقوم بتعريف متغير غير قابل لتعديل قيمته في JavaScript؟",
    options: ["var x = 5", "let x = 5", "const x = 5", "set x = 5"],
    correctAnswer: "const x = 5",
    difficulty: "BEGINNER",
    isMock: true,
  },
  // INTERMEDIATE
  {
    id: "mock-i1",
    questionText: "ما هي نتيجة التعبير JavaScript التالي: typeof [] ؟",
    options: ["'array'", "'object'", "'null'", "'list'"],
    correctAnswer: "'object'",
    difficulty: "INTERMEDIATE",
    isMock: true,
  },
  {
    id: "mock-i2",
    questionText: "أي خاصية CSS تستخدم للتحكم في ترتيب العناصر داخل حاوية Flexbox؟",
    options: ["flex-order", "order", "align-self", "z-index"],
    correctAnswer: "order",
    difficulty: "INTERMEDIATE",
    isMock: true,
  },
  // ADVANCED
  {
    id: "mock-a1",
    questionText: "ما هو الفرق الرئيسي لـ Promise.race() مقارنة بـ Promise.all()؟",
    options: [
      "تنتظر جميع الوعود لتنتهي بنجاح",
      "تعيد أول وعد يكتمل سواءً بالنجاح أو الفشل",
      "تنفذ الوعود بالتوالي وليس بالتوازي",
      "تلغي تنفيذ الوعود البطيئة تلقائياً",
    ],
    correctAnswer: "تعيد أول وعد يكتمل سواءً بالنجاح أو الفشل",
    difficulty: "ADVANCED",
    isMock: true,
  },
  {
    id: "mock-a2",
    questionText: "ما هي الفائدة الأساسية من استخدام خطاف (hook) useCallback في React؟",
    options: [
      "تخزين وتحديث حالة المكون محلياً",
      "حفظ مرجع مستقر للدوال لتفادي إعادة رسم المكونات الفرعية غير الضرورية",
      "جلب البيانات من خادم خارجي بشكل غير متزامن",
      "محاكاة دورة حياة المكون بالكامل",
    ],
    correctAnswer: "حفظ مرجع مستقر للدوال لتفادي إعادة رسم المكونات الفرعية غير الضرورية",
    difficulty: "ADVANCED",
    isMock: true,
  },
]

/**
 * Get a question based on current difficulty, excluding already answered questions
 */
export async function getQuizQuestion(
  quizId: string | null,
  difficulty: DifficultyLevel,
  answeredQuestionIds: string[]
): Promise<Omit<QuizQuestion, "correctAnswer"> & { id: string }> {
  try {
    let question: any = null

    if (quizId && quizId !== "demo-quiz") {
      // Filter out non-UUID IDs (like mock-*) to avoid DB casting errors
      const realAnsweredIds = answeredQuestionIds.filter(id => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      )

      // Try DB
      question = await prisma.question.findFirst({
        where: {
          quizId,
          difficulty,
          id: { notIn: realAnsweredIds },
        },
      })
    }

    if (!question) {
      // Fallback to Mock
      const availableMocks = MOCK_QUESTIONS.filter(
        (q) => q.difficulty === difficulty && !answeredQuestionIds.includes(q.id)
      )

      if (availableMocks.length > 0) {
        question = availableMocks[Math.floor(Math.random() * availableMocks.length)]
      } else {
        // If all of this difficulty are answered, try any other unanswered mock
        const anyUnanswered = MOCK_QUESTIONS.filter((q) => !answeredQuestionIds.includes(q.id))
        if (anyUnanswered.length > 0) {
          question = anyUnanswered[Math.floor(Math.random() * anyUnanswered.length)]
        } else {
          // Wrap around: select any mock of the target difficulty
          const targetMocks = MOCK_QUESTIONS.filter((q) => q.difficulty === difficulty)
          question = targetMocks[Math.floor(Math.random() * targetMocks.length)] || MOCK_QUESTIONS[0]
        }
      }
    }

    // Return without correctAnswer for client security
    return {
      id: question.id,
      questionText: question.questionText,
      options: Array.isArray(question.options)
        ? (question.options as string[])
        : JSON.parse(JSON.stringify(question.options)),
      difficulty: question.difficulty as DifficultyLevel,
      isMock: !!question.isMock,
    }
  } catch (error) {
    console.error("Error fetching question:", error)
    // Absolute fallback
    return {
      id: "mock-fallback",
      questionText: "ما هو الوسم المستخدم لإنشاء عنوان رئيسي كبير جداً في HTML؟",
      options: ["<h6>", "<heading>", "<h1>", "<head>"],
      difficulty: "BEGINNER",
      isMock: true,
    }
  }
}

/**
 * Submit answer, check correctness, and determine next difficulty or finish quiz
 */
export async function submitQuizAnswer({
  quizId,
  questionId,
  selectedAnswer,
  currentDifficulty,
  answeredQuestionIds,
  correctCount,
  totalAnswered,
  answersHistory,
}: {
  quizId: string | null
  questionId: string
  selectedAnswer: string
  currentDifficulty: DifficultyLevel
  answeredQuestionIds: string[]
  correctCount: number
  totalAnswered: number
  answersHistory?: { questionId: string; selectedAnswer: string }[]
}) {
  try {
    const isMock = questionId.startsWith("mock")
    let correctAnswer = ""

    if (isMock) {
      const mockQ = MOCK_QUESTIONS.find((q) => q.id === questionId)
      correctAnswer = mockQ ? mockQ.correctAnswer : ""
    } else {
      const dbQ = await prisma.question.findUnique({
        where: { id: questionId },
        select: { correctAnswer: true },
      })
      correctAnswer = dbQ ? dbQ.correctAnswer : ""
    }

    const isCorrect = selectedAnswer === correctAnswer
    const newCorrectCount = isCorrect ? correctCount + 1 : correctCount
    const newTotalAnswered = totalAnswered + 1
    const newAnsweredQuestionIds = [...answeredQuestionIds, questionId]

    // Determine next difficulty: Adaptive logic
    let nextDifficulty: DifficultyLevel = currentDifficulty

    if (isCorrect) {
      if (currentDifficulty === "BEGINNER") {
        nextDifficulty = "INTERMEDIATE"
      } else if (currentDifficulty === "INTERMEDIATE") {
        nextDifficulty = "ADVANCED"
      }
    } else {
      if (currentDifficulty === "ADVANCED") {
        nextDifficulty = "INTERMEDIATE"
      } else if (currentDifficulty === "INTERMEDIATE") {
        nextDifficulty = "BEGINNER"
      }
    }

    // We finish after 5 questions
    const maxQuestions = 5
    const isFinished = newTotalAnswered >= maxQuestions

    if (isFinished) {
      // Award rewards securely
      const coinsEarned = newCorrectCount * 10
      const xpGained = newCorrectCount * 25
      const accuracy = Math.round((newCorrectCount / maxQuestions) * 100)

      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // ── Security guard: auth + cooldown rate-limit (3 s) ───────────────
        const guard = await guardAction({ allowedRoles: ["STUDENT", "TEACHER", "ADMIN"], cooldownMs: 3_000 })
        if (!guard.ok) {
          // Rate-limited: still return results but skip coin reward
          return {
            isFinished: true,
            correct: isCorrect,
            correctAnswer,
            summary: { totalQuestions: maxQuestions, correctCount: newCorrectCount, accuracy, coinsEarned: 0, xpGained: 0 },
            rateLimited: true,
          }
        }

        const isPassed = accuracy >= 60 // 3/5 is pass (60%)
        const dbQuizId = (quizId && quizId !== "demo-quiz") ? quizId : null

        if (dbQuizId) {
          const history = answersHistory || []
          const fullHistory = [...history]
          if (!fullHistory.some((h) => h.questionId === questionId)) {
            fullHistory.push({ questionId, selectedAnswer })
          }

          const attemptAnswers: { questionId: string | null; selectedOption: string; isCorrect: boolean }[] = []
          for (const ans of fullHistory) {
            let qCorrect = ""
            let qIsCorrect = false
            if (ans.questionId.startsWith("mock")) {
              const mockQ = MOCK_QUESTIONS.find((q) => q.id === ans.questionId)
              qCorrect = mockQ ? mockQ.correctAnswer : ""
            } else {
              const dbQ = await prisma.question.findUnique({
                where: { id: ans.questionId },
                select: { correctAnswer: true },
              })
              qCorrect = dbQ ? dbQ.correctAnswer : ""
            }
            qIsCorrect = ans.selectedAnswer === qCorrect
            attemptAnswers.push({
              questionId: ans.questionId.startsWith("mock") ? null : ans.questionId,
              selectedOption: ans.selectedAnswer,
              isCorrect: qIsCorrect,
            })
          }

          await prisma.$transaction(async (tx) => {
            const attempt = await tx.quizAttempt.create({
              data: {
                userId: user.id,
                quizId: dbQuizId,
                score: newCorrectCount,
                total: maxQuestions,
                percentage: accuracy,
                isPassed,
              },
            })

            const realAnswers = attemptAnswers.filter((a) => a.questionId)
            if (realAnswers.length > 0) {
              await tx.quizAnswer.createMany({
                data: realAnswers.map((ra) => ({
                  attemptId: attempt.id,
                  questionId: ra.questionId!,
                  selectedOption: ra.selectedOption,
                  isCorrect: ra.isCorrect,
                })),
              })
            }
          })
        }

        // Award rewards via gamification library
        const { addCoins, addXp, checkAndAwardAchievement } = await import("@/lib/gamification")
        await addCoins(user.id, coinsEarned, `إكمال اختبار (${newCorrectCount}/${maxQuestions} إجابات صحيحة)`)
        await addXp(user.id, xpGained, `إكمال اختبار (${newCorrectCount}/${maxQuestions} إجابات صحيحة)`)

        // Trigger achievement check
        await checkAndAwardAchievement(user.id, "FIRST_QUIZ")
      }

      revalidatePath("/dashboard/student")

      return {
        isFinished: true,
        correct: isCorrect,
        correctAnswer,
        summary: {
          totalQuestions: maxQuestions,
          correctCount: newCorrectCount,
          accuracy,
          coinsEarned,
          xpGained,
        },
      }
    }

    // Get next question
    const nextQuestion = await getQuizQuestion(quizId, nextDifficulty, newAnsweredQuestionIds)

    return {
      isFinished: false,
      correct: isCorrect,
      correctAnswer,
      nextDifficulty,
      nextQuestion,
      updatedState: {
        answeredQuestionIds: newAnsweredQuestionIds,
        correctCount: newCorrectCount,
        totalAnswered: newTotalAnswered,
      },
    }
  } catch (error) {
    console.error("Error submitting quiz answer:", error)
    return { error: "حدث خطأ أثناء معالجة الإجابة." }
  }
}
