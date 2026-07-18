"use server"

import prisma from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { guardAction } from "@/lib/action-guard"

export interface ValidationRule {
  type: "contains" | "regex" | "not_contains"
  target: string
  errorMessage?: string
}

export async function verifyChallenge(
  lessonId: string,
  code: string,
  rules: ValidationRule[]
) {
  try {
    // ── Security guard: auth + cooldown rate-limit ──────────────────────────
    const guard = await guardAction({ allowedRoles: ["STUDENT", "TEACHER", "ADMIN"], cooldownMs: 3_000 })
    if (!guard.ok) return { success: false, message: guard.error }
    const userId = guard.userId

    // Keep local supabase user reference for legacy compat
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: "يجب تسجيل الدخول أولاً للمشاركة في التحدي." }

    // Run rules validation
    for (const rule of rules) {
      if (rule.type === "contains") {
        if (!code.includes(rule.target)) {
          return {
            success: false,
            message: rule.errorMessage || `يجب أن يحتوي الكود على: ${rule.target}`,
          }
        }
      } else if (rule.type === "not_contains") {
        if (code.includes(rule.target)) {
          return {
            success: false,
            message: rule.errorMessage || `يجب ألا يحتوي الكود على: ${rule.target}`,
          }
        }
      } else if (rule.type === "regex") {
        const regex = new RegExp(rule.target)
        if (!regex.test(code)) {
          return {
            success: false,
            message: rule.errorMessage || "الكود لا يطابق النمط المطلوب.",
          }
        }
      }
    }

    // Check if user already completed this lesson to avoid double rewarding
    const existingProgress = await prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
    })

    const isAlreadyCompleted = existingProgress?.isCompleted || false

    const awardAmount = 50

    await prisma.$transaction(async (tx) => {
      // Upsert user progress
      await tx.userProgress.upsert({
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

      // If not already completed, award coins and record transaction
      if (!isAlreadyCompleted) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            craftCoins: { increment: awardAmount },
          },
        })

        await tx.transaction.create({
          data: {
            userId: user.id,
            amount: awardAmount,
            type: "EARN",
            description: `إكمال تحدي البرمجة للدرس: ${lessonId}`,
          },
        })
      }
    })

    revalidatePath("/dashboard/student")
    return {
      success: true,
      message: isAlreadyCompleted
        ? "تم التحقق من الكود بنجاح! (لقد حصلت بالفعل على جائزة هذا التحدي سابقاً)"
        : `أحسنت! تم التحقق من الحل بنجاح وحصلت على ${awardAmount} من عملات Craft.`,
    }
  } catch (error) {
    console.error("Error verifying challenge:", error)
    return { success: false, message: "حدث خطأ غير متوقع أثناء التحقق من التحدي." }
  }
}

export async function purchaseHint(lessonId: string, hintText: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "يجب تسجيل الدخول أولاً لشراء التلميح." }
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { craftCoins: true },
    })

    if (!dbUser) {
      return { success: false, error: "المستخدم غير موجود." }
    }

    const hintCost = 20

    if (dbUser.craftCoins < hintCost) {
      return { success: false, error: `رصيدك غير كافٍ. تكلفة التلميح ${hintCost} عملة ورصيدك الحالي ${dbUser.craftCoins}.` }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          craftCoins: { decrement: hintCost },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          amount: hintCost,
          type: "SPEND",
          description: `شراء تلميح للدرس: ${lessonId}`,
        },
      }),
    ])

    revalidatePath("/dashboard/student")
    return { success: true, hint: hintText }
  } catch (error) {
    console.error("Error purchasing hint:", error)
    return { success: false, error: "حدث خطأ أثناء شراء التلميح." }
  }
}
