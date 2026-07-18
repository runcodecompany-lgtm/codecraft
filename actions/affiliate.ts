"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"

/**
 * Generate a unique affiliate code
 */
async function generateUniqueAffiliateCode(): Promise<string> {
  let code = ""
  let isUnique = false
  while (!isUnique) {
    const hex = randomBytes(3).toString("hex").toUpperCase()
    code = `AFF-${hex}`
    const existing = await prisma.affiliateLink.findUnique({
      where: { code }
    })
    if (!existing) isUnique = true
  }
  return code
}

/**
 * Create or fetch an affiliate link for a user (and optionally a specific course)
 */
export async function getOrCreateAffiliateLink(courseId?: string) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: "يجب تسجيل الدخول للحصول على رابط الإحالة." }
    }

    // Check existing
    const existing = await prisma.affiliateLink.findFirst({
      where: {
        userId: session.id,
        courseId: courseId || null
      }
    })

    if (existing) {
      return { success: true, affiliateLink: existing }
    }

    const code = await generateUniqueAffiliateCode()

    const newLink = await prisma.affiliateLink.create({
      data: {
        userId: session.id,
        courseId: courseId || null,
        code
      }
    })

    return { success: true, affiliateLink: newLink }
  } catch (error) {
    console.error("Error in getOrCreateAffiliateLink:", error)
    return { success: false, error: "فشل إنشاء رابط التسويق بالعمولة." }
  }
}

/**
 * Increment click count on an affiliate link
 */
export async function trackAffiliateClick(code: string) {
  try {
    const link = await prisma.affiliateLink.findUnique({
      where: { code }
    })

    if (!link) {
      return { success: false, error: "رابط الإحالة غير موجود." }
    }

    await prisma.affiliateLink.update({
      where: { code },
      data: { clicks: { increment: 1 } }
    })

    return { success: true }
  } catch (error) {
    console.error("Error in trackAffiliateClick:", error)
    return { success: false, error: "فشل تتبع رابط الإحالة." }
  }
}

/**
 * Get the current user's affiliate commissions and dashboard stats
 */
export async function getMyAffiliateEarnings() {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: "يجب تسجيل الدخول لاسترجاع الأرباح." }
    }

    // Dynamic commission check and clearance
    await recalculateAffiliateCommissions(session.id)

    const commissions = await prisma.affiliateCommission.findMany({
      where: { affiliateUserId: session.id },
      include: {
        purchase: {
          include: {
            course: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    const links = await prisma.affiliateLink.findMany({
      where: { userId: session.id }
    })

    const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0)
    const confirmedCommissions = commissions
      .filter(c => c.status === "PAID")
      .reduce((sum, c) => sum + c.amount, 0)
    const pendingCommissions = commissions
      .filter(c => c.status === "PENDING")
      .reduce((sum, c) => sum + c.amount, 0)

    return {
      success: true,
      stats: {
        totalClicks,
        confirmedCommissions: parseFloat(confirmedCommissions.toFixed(2)),
        pendingCommissions: parseFloat(pendingCommissions.toFixed(2)),
        salesCount: commissions.length
      },
      commissions
    }
  } catch (error) {
    console.error("Error in getMyAffiliateEarnings:", error)
    return { success: false, error: "فشل جلب أرباح الإحالة." }
  }
}

/**
 * Dynamically updates pending affiliate commissions (checks 14-day window and refund status)
 */
export async function recalculateAffiliateCommissions(userId: string) {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

    // Find all pending commissions for this user
    const pendingCommissions = await prisma.affiliateCommission.findMany({
      where: {
        affiliateUserId: userId,
        status: "PENDING"
      },
      include: {
        purchase: {
          include: {
            payments: {
              select: { status: true }
            }
          }
        }
      }
    })

    for (const comm of pendingCommissions) {
      if (!comm.purchase) continue

      // Check if the payment was refunded
      const isRefunded = comm.purchase.payments.some(pay => pay.status === "REFUNDED")
      if (isRefunded) {
        await prisma.affiliateCommission.update({
          where: { id: comm.id },
          data: { status: "CANCELLED" }
        })
        continue
      }

      // Check if 14 days passed
      if (comm.createdAt < fourteenDaysAgo) {
        await prisma.affiliateCommission.update({
          where: { id: comm.id },
          data: { status: "PAID" }
        })
      }
    }
  } catch (error) {
    console.error("Error in recalculateAffiliateCommissions:", error)
  }
}
