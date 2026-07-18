"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createAuditLog, createNotification } from "@/lib/foundation"
import { evaluateAccess } from "@/lib/identity-governance"

/**
 * Fetch a teacher's financial wallet details
 */
export async function getTeacherWallet(teacherId: string) {
  try {
    let wallet = await prisma.teacherWallet.findUnique({
      where: { teacherId }
    })

    if (!wallet) {
      wallet = await prisma.teacherWallet.create({
        data: {
          teacherId,
          currentBalance: 0.0,
          pendingBalance: 0.0,
          confirmedEarnings: 0.0
        }
      })
    }

    // Dynamic wallet recalculation (14 days clearance window)
    const updatedWallet = await recalculateTeacherWallet(teacherId)
    if (updatedWallet) {
      wallet = updatedWallet
    }

    const payouts = await prisma.teacherPayout.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, wallet, payouts }
  } catch (error) {
    console.error("Error in getTeacherWallet:", error)
    return { success: false, error: "فشل جلب بيانات المحفظة المالية." }
  }
}

/**
 * Teacher requests a payout withdrawal
 */
export async function requestPayout(amount: number, method: string, details: string) {
  try {
    const session = await getServerSession()
    if (!session || session.role !== "TEACHER") {
      return { success: false, error: "غير مصرح لك بطلب السحب." }
    }

    if (amount <= 0) {
      return { success: false, error: "يجب إدخال مبلغ صحيح للسحب." }
    }

    const walletRes = await getTeacherWallet(session.id)
    if (!walletRes.success || !walletRes.wallet) {
      return { success: false, error: "المحفظة المالية غير موجودة." }
    }

    const wallet = walletRes.wallet
    if (wallet.currentBalance < amount) {
      return { success: false, error: "رصيدك الحالي غير كافٍ لإجراء عملية السحب." }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create payout record
      return await tx.teacherPayout.create({
        data: {
          teacherId: session.id,
          amount,
          paymentMethod: method,
          paymentDetails: details,
          status: "PENDING"
        }
      })
    })

    // Dynamic recalculation adjusts the withdrawable currentBalance instantly
    await recalculateTeacherWallet(session.id)

    await createAuditLog(
      session.id,
      "Payout Requested",
      null,
      null,
      `Requested payout of $${amount} via ${method}`
    )

    await createNotification(
      session.id,
      "💸 تم استلام طلب السحب الخاص بك",
      `تم تسجيل طلب سحب مبلغ $${amount} وهو الآن قيد المراجعة والتدقيق الإداري.`,
      "SYSTEM"
    )

    revalidatePath("/dashboard/teacher/earnings")
    return { success: true, payout: result }
  } catch (error) {
    console.error("Error in requestPayout:", error)
    return { success: false, error: "حدث خطأ أثناء إرسال طلب السحب." }
  }
}

/**
 * Admin reviews payout request
 */
export async function reviewPayout(payoutId: string, status: "APPROVED" | "REJECTED", notes?: string) {
  try {
    const session = await getServerSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return { success: false, error: "صلاحيات غير كافية لمراجعة طلبات السحب." }
    }

    const payout = await prisma.teacherPayout.findUnique({
      where: { id: payoutId }
    })

    if (!payout || payout.status !== "PENDING") {
      return { success: false, error: "طلب السحب غير موجود أو تمت معالجته بالفعل." }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedPayout = await tx.teacherPayout.update({
        where: { id: payoutId },
        data: {
          status,
          adminNotes: notes || null
        }
      })
      return updatedPayout
    })

    // Dynamic recalculation updates currentBalance and confirmedEarnings based on payout status
    await recalculateTeacherWallet(payout.teacherId)

    await createAuditLog(
      payout.teacherId,
      `Payout ${status}`,
      null,
      null,
      `Payout request ${payoutId} of $${payout.amount} was ${status} by admin.`
    )

    await createNotification(
      payout.teacherId,
      status === "APPROVED" ? "✅ تمت الموافقة على طلب السحب!" : "❌ تم رفض طلب السحب الخاص بك",
      status === "APPROVED" 
        ? `تمت الموافقة على تحويل مبلغ $${payout.amount} إلى حسابك، وتم التحويل بالفعل.` 
        : `تم رفض طلب سحب مبلغ $${payout.amount} وإعادة الرصيد إلى محفظتك. ملاحظات الإدارة: ${notes || "لا توجد"}`,
      "SYSTEM"
    )

    revalidatePath("/dashboard/admin/financials")
    revalidatePath("/dashboard/teacher/earnings")
    return { success: true, payout: result }
  } catch (error) {
    console.error("Error in reviewPayout:", error)
    return { success: false, error: "حدث خطأ أثناء معالجة طلب السحب." }
  }
}

/**
 * Student requests a refund for a course purchase
 */
export async function requestRefund(paymentId: string, reason: string) {
  try {
    const session = await getServerSession()
    if (!session) return { success: false, error: "يجب تسجيل الدخول لإرسال طلب الاسترجاع." }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { purchase: true }
    })

    if (!payment || payment.userId !== session.id || !payment.purchaseId) {
      return { success: false, error: "عملية الشراء غير صالحة." }
    }

    if (payment.status !== "PAID") {
      return { success: false, error: "لا يمكن استرجاع المدفوعات غير المكتملة." }
    }

    // Verify 14 days limit
    const daysElapsed = (Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysElapsed > 14) {
      return { success: false, error: "تجاوزت فترة الاسترجاع المسموحة (14 يوماً من تاريخ الشراء)." }
    }

    // Verify course progress (must be less than 20%)
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.id,
          courseId: payment.purchase!.courseId
        }
      }
    })

    if (enrollment && enrollment.progress >= 20) {
      return { success: false, error: "لا يمكنك استرجاع دورة تجاوزت نسبة التقدم فيها 20%." }
    }

    // Create refund dispute record
    const refund = await prisma.refund.create({
      data: {
        paymentId,
        userId: session.id,
        amount: payment.amount,
        reason,
        status: "PENDING"
      }
    })

    await createAuditLog(session.id, "Refund Requested", null, null, `Requested refund for payment: ${paymentId}`)
    await createNotification(
      session.id,
      "💸 تم تسجيل طلب الاسترجاع",
      "طلب الاسترجاع الخاص بك قيد التدقيق الإداري والمراجعة وسيتم الرد قريباً.",
      "SYSTEM"
    )

    revalidatePath("/dashboard/student/subscription")
    return { success: true, refund }
  } catch (error) {
    console.error("Error in requestRefund:", error)
    return { success: false, error: "فشل تقديم طلب الاسترجاع." }
  }
}

/**
 * Admin reviews refund dispute
 */
export async function reviewRefund(refundId: string, status: "APPROVED" | "REJECTED", notes?: string) {
  try {
    const session = await getServerSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return { success: false, error: "صلاحيات غير كافية لمراجعة طلبات الاسترجاع." }
    }

    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        payment: {
          include: {
            purchase: {
              include: {
                course: true
              }
            }
          }
        }
      }
    })

    if (!refund || refund.status !== "PENDING") {
      return { success: false, error: "طلب الاسترجاع غير موجود أو تمت معالجته." }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRefund = await tx.refund.update({
        where: { id: refundId },
        data: {
          status,
          adminNotes: notes || null
        }
      })

      if (status === "APPROVED") {
        // Mark payment as refunded
        await tx.payment.update({
          where: { id: refund.paymentId },
          data: { status: "REFUNDED" }
        })

        const purchase = refund.payment.purchase
        if (purchase) {
          // Revoke course enrollment
          await tx.enrollment.delete({
            where: {
              userId_courseId: {
                userId: refund.userId,
                courseId: purchase.courseId
              }
            }
          })
        }
      }

      return updatedRefund
    })

    if (status === "APPROVED" && refund.payment.purchase) {
      // Dynamic recalculation automatically excludes this refunded purchase
      await recalculateTeacherWallet(refund.payment.purchase.course.teacherId)
    }

    await createAuditLog(
      refund.userId,
      `Refund ${status}`,
      null,
      null,
      `Refund request ${refundId} was ${status} by admin.`
    )

    await createNotification(
      refund.userId,
      status === "APPROVED" ? "✅ تمت الموافقة على الاسترجاع" : "❌ تم رفض طلب الاسترجاع",
      status === "APPROVED" 
        ? `تمت الموافقة على إعادة مبلغ $${refund.amount} لحسابك الأصلي وإلغاء تسجيلك في الدورة.` 
        : `تم رفض طلب استرجاع مبلغ $${refund.amount}. ملاحظات الإدارة: ${notes || "لا توجد"}`,
      "SYSTEM"
    )

    revalidatePath("/dashboard/admin/financials")
    revalidatePath("/dashboard/student/subscription")
    return { success: true, refund: result }
  } catch (error) {
    console.error("Error in reviewRefund:", error)
    return { success: false, error: "حدث خطأ أثناء معالجة طلب الاسترجاع." }
  }
}

/**
 * Retrieve administrative financial statistics & graphs
 */
export async function getFinancialReports(timeframe: "daily" | "weekly" | "monthly" | "yearly" = "monthly") {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: "PAID" },
      orderBy: { createdAt: "asc" }
    })

    const subscriptions = await prisma.subscription.findMany({
      include: { plan: true }
    })

    const refunds = await prisma.refund.findMany()

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
    const totalRefunded = refunds.filter(r => r.status === "APPROVED").reduce((sum, r) => sum + r.amount, 0)
    const netRevenue = totalRevenue - totalRefunded

    const activeSubscriptionsCount = subscriptions.filter(s => s.status === "ACTIVE").length

    return {
      success: true,
      stats: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalRefunded: parseFloat(totalRefunded.toFixed(2)),
        netRevenue: parseFloat(netRevenue.toFixed(2)),
        activeSubscriptionsCount,
        allPaymentsCount: payments.length
      },
      payments: payments.slice(-10), // return last 10 transactions
      refunds: refunds.slice(-10)
    }
  } catch (error) {
    console.error("Error in getFinancialReports:", error)
    return { success: false, error: "فشل توليد التقارير المالية." }
  }
}

/**
 * Re-calculate teacher wallet dynamically from raw purchase and payout records
 * Clears pending balance to current balance after 14 days
 */
export async function recalculateTeacherWallet(teacherId: string) {
  try {
    // 1. Get all courses owned by teacher
    const courses = await prisma.course.findMany({
      where: { teacherId },
      select: { id: true }
    })
    const courseIds = courses.map(c => c.id)

    // 2. Get all purchases for these courses
    const purchases = await prisma.purchase.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        payments: {
          select: { status: true }
        }
      }
    })

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

    let pendingEarning = 0
    let clearedEarning = 0

    for (const p of purchases) {
      // Find if there is a PAID payment
      const isPaid = p.payments.some(pay => pay.status === "PAID")
      if (!isPaid) continue // Skip refunded or failed/pending payments

      const teacherShare = parseFloat((p.pricePaid * 0.8).toFixed(2))
      if (p.createdAt > fourteenDaysAgo) {
        pendingEarning += teacherShare
      } else {
        clearedEarning += teacherShare
      }
    }

    // 3. Fetch payouts
    const payouts = await prisma.teacherPayout.findMany({
      where: { teacherId }
    })

    const pendingPayoutsSum = payouts
      .filter(p => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0)

    const approvedPayoutsSum = payouts
      .filter(p => p.status === "APPROVED")
      .reduce((sum, p) => sum + p.amount, 0)

    // clearedEarning - approved payouts - pending payouts
    const currentBalance = Math.max(0, parseFloat((clearedEarning - approvedPayoutsSum - pendingPayoutsSum).toFixed(2)))

    // Update wallet
    const wallet = await prisma.teacherWallet.upsert({
      where: { teacherId },
      update: {
        pendingBalance: parseFloat(pendingEarning.toFixed(2)),
        currentBalance: currentBalance,
        confirmedEarnings: parseFloat(approvedPayoutsSum.toFixed(2))
      },
      create: {
        teacherId,
        pendingBalance: parseFloat(pendingEarning.toFixed(2)),
        currentBalance: currentBalance,
        confirmedEarnings: parseFloat(approvedPayoutsSum.toFixed(2))
      }
    })

    return wallet
  } catch (error) {
    console.error("Error in recalculateTeacherWallet:", error)
    return null
  }
}
