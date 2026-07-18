"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * referral anti-cheat background checker
 * rewards referrer only when student completes at least 3 lessons
 */
export async function verifyAndRewardReferral(studentId: string) {
  try {
    if (!studentId) {
      return { success: false, error: "معرف الطالب غير صحيح." }
    }

    // 1. Count completed lessons for this student
    const completedCount = await prisma.userProgress.count({
      where: {
        userId: studentId,
        isCompleted: true,
      },
    })

    if (completedCount < 3) {
      return {
        success: false,
        message: `لم يصل الطالب إلى الحد الأدنى للإحالة بعد (المنجز: ${completedCount}/3 دروس)`,
      }
    }

    // 2. Fetch the student details to find the referrer (referredById)
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        referredById: true,
        name: true,
      },
    })

    if (!student || !student.referredById) {
      return {
        success: false,
        message: "هذا الطالب لم يسجل عبر رابط إحالة أو لم يتم العثور على حسابه.",
      }
    }

    const referrerId = student.referredById
    const rewardAmount = 500
    const referralDescription = `مكافأة دعوة الطالب: [${student.name || "مستخدم جديد"}] معرف: ${studentId}`

    // 3. Check if the referrer has already received a referral bonus for this specific student
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        userId: referrerId,
        type: "EARN",
        description: {
          contains: studentId,
        },
      },
    })

    if (existingTransaction) {
      return {
        success: false,
        message: "لقد تم منح مكافأة الإحالة لهذه الدعوة مسبقاً لمنع التكرار.",
      }
    }

    // 4. Atomic Prisma Transaction to award coins and log transaction
    await prisma.$transaction(async (tx) => {
      // Double check referrer existence
      const referrer = await tx.user.findUnique({
        where: { id: referrerId },
        select: { id: true },
      })

      if (!referrer) {
        throw new Error("المحيل غير موجود في قاعدة البيانات.")
      }

      // Increment referrer's balance
      await tx.user.update({
        where: { id: referrerId },
        data: {
          craftCoins: { increment: rewardAmount },
        },
      })

      // Record transaction
      await tx.transaction.create({
        data: {
          userId: referrerId,
          amount: rewardAmount,
          type: "EARN",
          description: referralDescription,
        },
      })
    })

    revalidatePath("/dashboard/student")
    revalidatePath("/dashboard/admin")

    return {
      success: true,
      message: `تم التحقق بنجاح ومنح المحيل مكافأة بقيمة ${rewardAmount} عملة.`,
    }
  } catch (error) {
    console.error("Error verifying and rewarding referral:", error)
    return { success: false, error: "حدث خطأ غير متوقع أثناء معالجة مكافأة الإحالة." }
  }
}
