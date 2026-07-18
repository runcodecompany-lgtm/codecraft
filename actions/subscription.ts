"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createAuditLog, createNotification } from "@/lib/foundation"
import { addCoins } from "@/lib/gamification"

/**
 * Fetch all available subscription plans
 */
export async function getSubscriptionPlans() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: "asc" }
    })
    return { success: true, plans }
  } catch (error) {
    console.error("Error in getSubscriptionPlans:", error)
    return { success: false, error: "فشل جلب خطط الاشتراك." }
  }
}

/**
 * Fetch the active subscription for the current user
 */
export async function getActiveSubscription(userId: string) {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIAL"] },
        endDate: { gte: new Date() }
      },
      include: {
        plan: true
      }
    })
    return subscription
  } catch (error) {
    console.error("Error in getActiveSubscription:", error)
    return null
  }
}

/**
 * Subscribe a user to a subscription plan
 */
export async function subscribeToPlan(planId: string, isTrial: boolean = false) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: "يجب تسجيل الدخول أولاً." }
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return { success: false, error: "خطة الاشتراك المحددة غير موجودة." }
    }

    // Check if user already has an active subscription
    const activeSub = await getActiveSubscription(session.id)
    if (activeSub && activeSub.planId === planId) {
      return { success: false, error: "لديك اشتراك نشط بالفعل في هذه الخطة." }
    }

    if (isTrial) {
      // Prevent trial abuse: check if user had a trial subscription in the past
      const hadTrial = await prisma.subscription.findFirst({
        where: {
          userId: session.id,
          trialStart: { not: null }
        }
      })
      if (hadTrial) {
        return { success: false, error: "لقد استفدت بالفعل من فترة تجريبية مجانية من قبل." }
      }
    }

    const now = new Date()
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

    const result = await prisma.$transaction(async (tx) => {
      // Deactivate previous active subscriptions
      if (activeSub) {
        await tx.subscription.updateMany({
          where: { userId: session.id, status: { in: ["ACTIVE", "TRIAL"] } },
          data: { status: "CANCELLED" }
        })
      }

      // Create new subscription
      const newSub = await tx.subscription.create({
        data: {
          userId: session.id,
          planId,
          status: isTrial ? "TRIAL" : "ACTIVE",
          startDate: now,
          endDate: isTrial ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : endDate,
          trialStart: isTrial ? now : null,
          trialEnd: isTrial ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : null
        }
      })

      // Record mock payment transaction
      const payment = await tx.payment.create({
        data: {
          userId: session.id,
          subscriptionId: newSub.id,
          amount: isTrial ? 0.0 : plan.price,
          currency: "USD",
          provider: isTrial ? "FREE" : "STRIPE",
          providerPaymentId: `SUB-MOCK-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          status: "PAID"
        }
      })

      // Generate invoice
      const invoiceNumber = `CCC-INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      await tx.invoice.create({
        data: {
          invoiceNumber,
          userId: session.id,
          paymentId: payment.id,
          amount: plan.price,
          tax: 0.0,
          discount: 0.0,
          total: isTrial ? 0.0 : plan.price,
          billingDetails: { name: session.name || "", email: session.email }
        }
      })

      // If Premium or Pro plan, award monthly coins bonus
      if (!isTrial) {
        let coinBonus = 0
        if (plan.name === "PREMIUM") coinBonus = 500
        else if (plan.name === "PRO") coinBonus = 200

        if (coinBonus > 0) {
          await tx.user.update({
            where: { id: session.id },
            data: { craftCoins: { increment: coinBonus } }
          })

          await tx.transaction.create({
            data: {
              userId: session.id,
              amount: coinBonus,
              type: "EARN",
              description: `مكافأة عملات الاشتراك الشهري لخطّة ${plan.name}`
            }
          })
        }
      }

      return newSub
    })

    await createAuditLog(
      session.id,
      "Subscribe Success",
      null,
      null,
      `Subscribed to plan: ${plan.name} (${isTrial ? "Trial" : "Paid"})`
    )

    await createNotification(
      session.id,
      `🎉 تم تفعيل اشتراك ${plan.name} بنجاح!`,
      `مرحباً بك! تم تفعيل اشتراك خطتك بنجاح، يمكنك الآن الاستمتاع بجميع ميزات وصلاحيات الخطة.`,
      "SYSTEM"
    )

    revalidatePath("/dashboard/student/subscription")
    revalidatePath("/dashboard/student")
    revalidatePath("/")

    return { success: true, subscription: result }
  } catch (error) {
    console.error("Error in subscribeToPlan:", error)
    return { success: false, error: "حدث خطأ غير متوقع أثناء تفعيل الاشتراك." }
  }
}

/**
 * Cancel auto-renewal of subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: "يجب تسجيل الدخول أولاً." }
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    })

    if (!subscription || subscription.userId !== session.id) {
      return { success: false, error: "الاشتراك غير موجود أو لا تملكه." }
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
        status: "CANCELLED"
      }
    })

    await createAuditLog(
      session.id,
      "Cancel Subscription",
      null,
      null,
      `Cancelled subscription auto-renewal for: ${subscription.plan.name}`
    )

    await createNotification(
      session.id,
      `⚠️ تم إلغاء تجديد الاشتراك تلقائياً`,
      `تم إلغاء التجديد التلقائي لاشتراكك بنجاح. سيبقى الاشتراك فعالاً وصلاحياتك مستمرة حتى تاريخ انتهاء الفترة في ${subscription.endDate.toLocaleDateString("ar-EG")}.`,
      "SYSTEM"
    )

    revalidatePath("/dashboard/student/subscription")
    return { success: true }
  } catch (error) {
    console.error("Error in cancelSubscription:", error)
    return { success: false, error: "فشل إلغاء تجديد الاشتراك." }
  }
}

/**
 * Upgrade user subscription plan
 */
export async function upgradeSubscription(subscriptionId: string, newPlanId: string) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: "يجب تسجيل الدخول أولاً." }
    }

    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: newPlanId }
    })

    if (!newPlan) {
      return { success: false, error: "الخطة المطلوبة غير موجودة." }
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    })

    if (!subscription || subscription.userId !== session.id) {
      return { success: false, error: "الاشتراك الحالي غير موجود." }
    }

    if (newPlan.price <= subscription.plan.price) {
      return { success: false, error: "ترقية الاشتراك تتطلب اختيار خطة أعلى سعراً." }
    }

    // Process upgrade payment
    const upgradeCost = Math.max(0, newPlan.price - subscription.plan.price)

    const now = new Date()
    const endDate = new Date(now.getTime() + newPlan.durationDays * 24 * 60 * 60 * 1000)

    const result = await prisma.$transaction(async (tx) => {
      // Deactivate current
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: { status: "EXPIRED", cancelAtPeriodEnd: true }
      })

      // Create new active subscription
      const newSub = await tx.subscription.create({
        data: {
          userId: session.id,
          planId: newPlanId,
          status: "ACTIVE",
          startDate: now,
          endDate
        }
      })

      // Payment record
      const payment = await tx.payment.create({
        data: {
          userId: session.id,
          subscriptionId: newSub.id,
          amount: upgradeCost,
          currency: "USD",
          provider: "STRIPE",
          providerPaymentId: `SUB-UPGRADE-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          status: "PAID"
        }
      })

      // Invoice
      const invoiceNumber = `CCC-INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      await tx.invoice.create({
        data: {
          invoiceNumber,
          userId: session.id,
          paymentId: payment.id,
          amount: upgradeCost,
          tax: 0.0,
          discount: 0.0,
          total: upgradeCost,
          billingDetails: { name: session.name || "", email: session.email }
        }
      })

      return newSub
    })

    await createAuditLog(
      session.id,
      "Upgrade Subscription",
      null,
      null,
      `Upgraded subscription from ${subscription.plan.name} to ${newPlan.name}. Paid: $${upgradeCost}`
    )

    await createNotification(
      session.id,
      `🚀 تم ترقية اشتراكك إلى خطّة ${newPlan.name}`,
      `تهانينا! تم ترقية اشتراكك بنجاح، صلاحياتك الجديدة مفعلة الآن بالكامل.`,
      "SYSTEM"
    )

    revalidatePath("/dashboard/student/subscription")
    return { success: true, subscription: result }
  } catch (error) {
    console.error("Error in upgradeSubscription:", error)
    return { success: false, error: "حدث خطأ أثناء ترقية الاشتراك." }
  }
}
