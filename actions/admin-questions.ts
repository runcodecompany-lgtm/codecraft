// actions/admin-questions.ts
"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"

// Input validation schema for question
const questionSchema = z.object({
  questionText: z.string().min(5, "نص السؤال يجب أن لا يقل عن 5 أحرف"),
  questionType: z.string().default("MULTIPLE_CHOICE"),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  options: z.array(z.string().min(1, "الخيار لا يمكن أن يكون فارغاً")).min(2, "يجب تحديد خيارين على الأقل"),
  correctAnswer: z.string().min(1, "يجب تحديد الإجابة الصحيحة"),
  points: z.number().int().min(1, "النقاط يجب أن تكون 1 على الأقل").default(1),
  category: z.string().min(2, "التصنيف يجب أن لا يقل عن حرفين").nullable().optional(),
})

// Security check helper
async function requireAdmin() {
  const session = await getServerSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    throw new Error("غير مصرح لك بالقيام بهذا الإجراء.")
  }
  return session
}

/**
 * Get all questions from the global question bank (where category is set)
 */
export async function getGlobalQuestionsAction(category?: string, difficulty?: string) {
  try {
    await requireAdmin()

    const where: any = {}
    
    // Only return questions that belong to the global bank (category is not null)
    where.category = { not: null }

    if (category && category !== "all") {
      where.category = category
    }
    if (difficulty && difficulty !== "all") {
      where.difficulty = difficulty
    }

    const questions = await prisma.placementQuestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return { success: true, questions }
  } catch (error: any) {
    console.error("Error fetching global questions:", error)
    return { success: false, error: error.message || "حدث خطأ أثناء جلب الأسئلة." }
  }
}

/**
 * Create a new question in the global bank
 */
export async function createGlobalQuestionAction(data: unknown) {
  try {
    await requireAdmin()

    const validated = questionSchema.safeParse(data)
    if (!validated.success) {
      const firstError = validated.error.errors[0]?.message || "البيانات المدخلة غير صالحة."
      return { success: false, error: firstError }
    }

    const question = await prisma.placementQuestion.create({
      data: {
        questionText: validated.data.questionText,
        questionType: validated.data.questionType,
        difficulty: validated.data.difficulty,
        options: validated.data.options,
        correctAnswer: validated.data.correctAnswer,
        points: validated.data.points,
        category: validated.data.category || null,
      },
    })

    revalidatePath("/dashboard/admin/tracks/questions")
    return { success: true, question }
  } catch (error: any) {
    console.error("Error creating global question:", error)
    return { success: false, error: error.message || "حدث خطأ أثناء إضافة السؤال." }
  }
}

/**
 * Update a question in the bank
 */
export async function updateGlobalQuestionAction(id: string, data: unknown) {
  try {
    await requireAdmin()

    if (!id) {
      return { success: false, error: "معرف السؤال غير صالح." }
    }

    const validated = questionSchema.safeParse(data)
    if (!validated.success) {
      const firstError = validated.error.errors[0]?.message || "البيانات المدخلة غير صالحة."
      return { success: false, error: firstError }
    }

    const updated = await prisma.placementQuestion.update({
      where: { id },
      data: {
        questionText: validated.data.questionText,
        questionType: validated.data.questionType,
        difficulty: validated.data.difficulty,
        options: validated.data.options,
        correctAnswer: validated.data.correctAnswer,
        points: validated.data.points,
        category: validated.data.category || null,
      },
    })

    revalidatePath("/dashboard/admin/tracks/questions")
    return { success: true, question: updated }
  } catch (error: any) {
    console.error("Error updating global question:", error)
    return { success: false, error: error.message || "حدث خطأ أثناء تعديل السؤال." }
  }
}

/**
 * Delete a question from the bank
 */
export async function deleteGlobalQuestionAction(id: string) {
  try {
    await requireAdmin()

    if (!id) {
      return { success: false, error: "معرف السؤال غير صالح." }
    }

    await prisma.placementQuestion.delete({
      where: { id },
    })

    revalidatePath("/dashboard/admin/tracks/questions")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting global question:", error)
    return { success: false, error: error.message || "حدث خطأ أثناء حذف السؤال." }
  }
}
