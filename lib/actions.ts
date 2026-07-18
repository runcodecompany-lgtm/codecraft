"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { UserRole } from "@prisma/client"
import { randomBytes } from "crypto"

function generateReferralCode(): string {
  return randomBytes(5).toString("hex").toUpperCase()
}

// --------------------------------------------------------
// Auth / User Actions
// --------------------------------------------------------

/**
 * Syncs a Supabase authenticated user into the local Prisma DB.
 * Call this after login/register to ensure the user record exists.
 */
export async function syncUserToDatabase() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) return { error: "المستخدم غير مصادق عليه" }

    const existingUser = await prisma.user.findUnique({
      where: { id: authUser.id },
    })

    if (!existingUser) {
      const email = authUser.email || ""
      const name = authUser.user_metadata?.name || email.split("@")[0] || "مستخدم جديد"
      const roleRaw = authUser.user_metadata?.role as string | undefined
      const role: UserRole =
        roleRaw && Object.values(UserRole).includes(roleRaw as UserRole)
          ? (roleRaw as UserRole)
          : UserRole.STUDENT

      await prisma.user.create({
        data: {
          id: authUser.id,
          email,
          name,
          role,
          referralCode: generateReferralCode(),
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error syncing user to database:", error)
    return { error: "حدث خطأ أثناء مزامنة بيانات المستخدم" }
  }
}

// --------------------------------------------------------
// Course Actions (Admin / Teacher)
// --------------------------------------------------------

export async function publishCourse(courseId: string) {
  try {
    await prisma.course.update({
      where: { id: courseId },
      data: { isPublished: true },
    })

    revalidatePath("/dashboard/teacher/courses")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error publishing course:", error)
    return { error: "حدث خطأ أثناء نشر الدورة" }
  }
}

export async function unpublishCourse(courseId: string) {
  try {
    await prisma.course.update({
      where: { id: courseId },
      data: { isPublished: false },
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Error unpublishing course:", error)
    return { error: "حدث خطأ أثناء إلغاء نشر الدورة" }
  }
}

// --------------------------------------------------------
// Progress Actions (Student)
// --------------------------------------------------------

export async function markLessonComplete(lessonId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "يجب تسجيل الدخول أولاً" }

    await prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
      create: {
        userId: user.id,
        lessonId,
        isCompleted: true,
      },
      update: {
        isCompleted: true,
      },
    })

    revalidatePath("/dashboard/student")
    return { success: true }
  } catch (error) {
    console.error("Error marking lesson complete:", error)
    return { error: "حدث خطأ أثناء تحديث تقدّمك" }
  }
}

// --------------------------------------------------------
// Transaction Actions (Economy)
// --------------------------------------------------------

export async function awardCoins(userId: string, amount: number, description: string) {
  try {
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId,
          amount,
          type: "EARN",
          description,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          craftCoins: { increment: amount },
        },
      }),
    ])

    revalidatePath("/dashboard/student")
    return { success: true }
  } catch (error) {
    console.error("Error awarding coins:", error)
    return { error: "حدث خطأ أثناء منح العملات" }
  }
}
