"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { guardAction } from "@/lib/action-guard"
import { DifficultyLevel } from "@prisma/client"

// Create Quiz
export async function createQuiz(
  moduleId: string | null,
  lessonId: string | null,
  title: string
) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    if (!moduleId && !lessonId) {
      return { success: false, error: "يجب ربط الاختبار بوحدة أو درس." }
    }

    // Determine ownership from module or lesson
    let courseTeacherId = ""
    if (moduleId) {
      const mod = await prisma.module.findUnique({
        where: { id: moduleId },
        include: { course: { select: { teacherId: true } } }
      })
      courseTeacherId = mod?.course.teacherId || ""
    } else if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId! },
        include: { module: { include: { course: { select: { teacherId: true } } } } }
      })
      courseTeacherId = lesson?.module.course.teacherId || ""
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (courseTeacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بإضافة اختبار إلى هذه الدورة." }
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        moduleId,
        lessonId
      }
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true, quizId: quiz.id }
  } catch (error) {
    console.error("Error in createQuiz:", error)
    return { success: false, error: "فشل إنشاء الاختبار." }
  }
}

// Update Quiz
export async function updateQuiz(quizId: string, title: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: { include: { course: { select: { teacherId: true } } } },
        lesson: { include: { module: { include: { course: { select: { teacherId: true } } } } } }
      }
    })

    if (!quiz) return { success: false, error: "الاختبار غير موجود." }

    const teacherId = quiz.module?.course.teacherId || quiz.lesson?.module.course.teacherId || ""
    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بتعديل هذا الاختبار." }
    }

    await prisma.quiz.update({
      where: { id: quizId },
      data: { title }
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Error in updateQuiz:", error)
    return { success: false, error: "فشل تحديث الاختبار." }
  }
}

// Delete Quiz
export async function deleteQuiz(quizId: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: { include: { course: { select: { teacherId: true } } } },
        lesson: { include: { module: { include: { course: { select: { teacherId: true } } } } } }
      }
    })

    if (!quiz) return { success: false, error: "الاختبار غير موجود." }

    const teacherId = quiz.module?.course.teacherId || quiz.lesson?.module.course.teacherId || ""
    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بحذف هذا الاختبار." }
    }

    await prisma.quiz.delete({
      where: { id: quizId }
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteQuiz:", error)
    return { success: false, error: "فشل حذف الاختبار." }
  }
}

// Question CRUD
export async function addQuestionToQuiz(
  quizId: string,
  data: {
    questionText: string
    questionType: string
    difficulty: DifficultyLevel
    options: string[]
    correctAnswer: string
    points: number
  }
) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: { include: { course: { select: { teacherId: true } } } },
        lesson: { include: { module: { include: { course: { select: { teacherId: true } } } } } }
      }
    })

    if (!quiz) return { success: false, error: "الاختبار غير موجود." }

    const teacherId = quiz.module?.course.teacherId || quiz.lesson?.module.course.teacherId || ""
    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بإضافة أسئلة لهذا الاختبار." }
    }

    // Support MULTIPLE_SELECT: store correctAnswer as JSON array string
    let correctAnswer = data.correctAnswer
    if (data.questionType === "MULTIPLE_SELECT") {
      // If correctAnswer is already a JSON array string, keep it; otherwise wrap in array
      try {
        JSON.parse(correctAnswer)
      } catch {
        correctAnswer = JSON.stringify(correctAnswer.split(",").map(a => a.trim()).filter(a => a.length > 0))
      }
    }

    const question = await prisma.question.create({
      data: {
        quizId,
        questionText: data.questionText,
        questionType: data.questionType,
        difficulty: data.difficulty,
        options: data.options,
        correctAnswer,
        points: Number(data.points) || 1
      }
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true, questionId: question.id }
  } catch (error) {
    console.error("Error in addQuestionToQuiz:", error)
    return { success: false, error: "فشل إضافة السؤال." }
  }
}

export async function updateQuizQuestion(
  questionId: string,
  data: {
    questionText: string
    questionType: string
    difficulty: DifficultyLevel
    options: string[]
    correctAnswer: string
    points: number
  }
) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
          include: {
            module: { include: { course: { select: { teacherId: true } } } },
            lesson: { include: { module: { include: { course: { select: { teacherId: true } } } } } }
          }
        }
      }
    })

    if (!question) return { success: false, error: "السؤال غير موجود." }

    const teacherId = question.quiz.module?.course.teacherId || question.quiz.lesson?.module.course.teacherId || ""
    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بتعديل هذا السؤال." }
    }

    // Support MULTIPLE_SELECT: store correctAnswer as JSON array string
    let correctAnswer = data.correctAnswer
    if (data.questionType === "MULTIPLE_SELECT") {
      try {
        JSON.parse(correctAnswer)
      } catch {
        correctAnswer = JSON.stringify(correctAnswer.split(",").map(a => a.trim()).filter(a => a.length > 0))
      }
    }

    await prisma.question.update({
      where: { id: questionId },
      data: {
        questionText: data.questionText,
        questionType: data.questionType,
        difficulty: data.difficulty,
        options: data.options,
        correctAnswer,
        points: Number(data.points) || 1
      }
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Error in updateQuizQuestion:", error)
    return { success: false, error: "فشل تحديث السؤال." }
  }
}

export async function deleteQuizQuestion(questionId: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
          include: {
            module: { include: { course: { select: { teacherId: true } } } },
            lesson: { include: { module: { include: { course: { select: { teacherId: true } } } } } }
          }
        }
      }
    })

    if (!question) return { success: false, error: "السؤال غير موجود." }

    const teacherId = question.quiz.module?.course.teacherId || question.quiz.lesson?.module.course.teacherId || ""
    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بحذف هذا السؤال." }
    }

    await prisma.question.delete({
      where: { id: questionId }
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteQuizQuestion:", error)
    return { success: false, error: "فشل حذف السؤال." }
  }
}

// Question Bank management
export async function saveToQuestionBank(data: {
  questionText: string
  questionType: string
  difficulty: DifficultyLevel
  options: string[]
  correctAnswer: string
  category?: string
  points: number
}) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    // Support MULTIPLE_SELECT: store correctAnswer as JSON array string
    let correctAnswer = data.correctAnswer
    if (data.questionType === "MULTIPLE_SELECT") {
      try {
        JSON.parse(correctAnswer)
      } catch {
        correctAnswer = JSON.stringify(correctAnswer.split(",").map(a => a.trim()).filter(a => a.length > 0))
      }
    }

    const question = await prisma.questionBank.create({
      data: {
        teacherId: guard.userId,
        questionText: data.questionText,
        questionType: data.questionType,
        difficulty: data.difficulty,
        options: data.options,
        correctAnswer,
        category: data.category || null,
        points: Number(data.points) || 1
      }
    })

    revalidatePath("/dashboard/teacher/question-bank")
    return { success: true, questionId: question.id }
  } catch (error) {
    console.error("Error in saveToQuestionBank:", error)
    return { success: false, error: "فشل حفظ السؤال في البنك." }
  }
}

export async function getQuestionBank() {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const questions = await prisma.questionBank.findMany({
      where: { teacherId: guard.userId },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, questions }
  } catch (error) {
    console.error("Error in getQuestionBank:", error)
    return { success: false, error: "فشل جلب بنك الأسئلة." }
  }
}

export async function deleteFromQuestionBank(questionId: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const question = await prisma.questionBank.findUnique({
      where: { id: questionId }
    })

    if (!question) return { success: false, error: "السؤال غير موجود." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (question.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بحذف هذا السؤال." }
    }

    await prisma.questionBank.delete({
      where: { id: questionId }
    })

    revalidatePath("/dashboard/teacher/question-bank")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteFromQuestionBank:", error)
    return { success: false, error: "فشل حذف السؤال من البنك." }
  }
}

// Import questions from bank to a quiz
export async function importFromQuestionBank(quizId: string, bankQuestionIds: string[]) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: { include: { course: { select: { teacherId: true } } } },
        lesson: { include: { module: { include: { course: { select: { teacherId: true } } } } } }
      }
    })

    if (!quiz) return { success: false, error: "الاختبار غير موجود." }

    const teacherId = quiz.module?.course.teacherId || quiz.lesson?.module.course.teacherId || ""
    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بالتعديل على هذا الاختبار." }
    }

    const bankQuestions = await prisma.questionBank.findMany({
      where: {
        id: { in: bankQuestionIds },
        teacherId: guard.userId
      }
    })

    if (bankQuestions.length === 0) {
      return { success: false, error: "لم يتم العثور على الأسئلة في بنك الأسئلة الخاص بك." }
    }

    // Insert into quiz
    await prisma.$transaction(
      bankQuestions.map((bq) =>
        prisma.question.create({
          data: {
            quizId,
            questionText: bq.questionText,
            questionType: bq.questionType,
            difficulty: bq.difficulty,
            options: bq.options || [],
            correctAnswer: bq.correctAnswer,
            points: bq.points
          }
        })
      )
    )

    revalidatePath("/dashboard/teacher/courses")
    return { success: true, count: bankQuestions.length }
  } catch (error) {
    console.error("Error in importFromQuestionBank:", error)
    return { success: false, error: "فشل استيراد الأسئلة من البنك." }
  }
}
