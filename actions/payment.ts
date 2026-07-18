"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createAuditLog, createNotification } from "@/lib/foundation"
import { addCoins } from "@/lib/gamification"
import { getActiveSubscription } from "./subscription"

// Tax Layer: Dynamic VAT/GST Calculator
export async function calculateTax(amount: number, country?: string | null): Promise<number> {
  if (!country) return 0.0
  const normalizedCountry = country.toUpperCase().trim()
  switch (normalizedCountry) {
    case "SA": // Saudi Arabia 15% VAT
    case "SAUDI ARABIA":
      return parseFloat((amount * 0.15).toFixed(2))
    case "EG": // Egypt 14% VAT
    case "EGYPT":
      return parseFloat((amount * 0.14).toFixed(2))
    case "AU": // Australia 10% GST
    case "AUSTRALIA":
      return parseFloat((amount * 0.10).toFixed(2))
    default:
      return 0.0
  }
}

/**
 * Validate and apply a coupon code
 */
export async function applyCouponCode(code: string, orderAmount: number) {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() }
    })

    if (!coupon || !coupon.isActive) {
      return { success: false, error: "كود الخصم غير صالح أو غير نشط." }
    }

    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      return { success: false, error: "انتهت صلاحية كود الخصم." }
    }

    if (coupon.maxUses && coupon.useCount >= coupon.maxUses) {
      return { success: false, error: "كود الخصم استنفد عدد مرات الاستخدام المتاحة." }
    }

    let discountAmount = 0
    if (coupon.discountType === "PERCENT") {
      discountAmount = parseFloat(((orderAmount * coupon.discountValue) / 100).toFixed(2))
    } else {
      discountAmount = Math.min(coupon.discountValue, orderAmount)
    }

    return {
      success: true,
      couponId: coupon.id,
      discountAmount,
      discountValue: coupon.discountValue,
      discountType: coupon.discountType
    }
  } catch (error) {
    console.error("Error in applyCouponCode:", error)
    return { success: false, error: "حدث خطأ أثناء تطبيق كود الخصم." }
  }
}

/**
 * Check if a course has active site-wide discount promotions
 */
export async function getActivePromotion() {
  try {
    const now = new Date()
    const promotion = await prisma.promotion.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    })
    return promotion
  } catch (error) {
    console.error("Error in getActivePromotion:", error)
    return null
  }
}

/**
 * Create a Checkout session and process the payment (Stripe Sim, PayPal Sim, Coins, or Free)
 */
export async function createCheckoutSession(
  items: { type: "COURSE" | "SUBSCRIPTION"; id: string }[],
  couponCode?: string,
  paymentMethod: "STRIPE" | "PAYPAL" | "COINS" | "FREE" = "STRIPE",
  affiliateCode?: string,
  coinsSpentToDiscount?: number
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: "يجب تسجيل الدخول لإتمام عملية الدفع." }
    }

    // Fetch exchange rate from system settings
    let coinsPerUsd = 100
    try {
      const rateSetting = await prisma.systemSetting.findUnique({
        where: { key: "COINS_PER_USD" }
      })
      if (rateSetting) {
        coinsPerUsd = Number(rateSetting.value) || 100
      }
    } catch (err) {
      console.error("Error reading COINS_PER_USD setting:", err)
    }

    let subtotal = 0
    let totalCoins = 0
    let planToSubscribe: any = null
    let coursesToPurchase: any[] = []

    const promotion = await getActivePromotion()

    // 1. Process Items
    for (const item of items) {
      if (item.type === "SUBSCRIPTION") {
        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: item.id } })
        if (!plan) return { success: false, error: "خطة الاشتراك غير موجودة." }
        planToSubscribe = plan
        subtotal += plan.price
      } else if (item.type === "COURSE") {
        const course = await prisma.course.findUnique({
          where: { id: item.id },
          include: { teacher: true }
        })
        if (!course) return { success: false, error: "الدورة التدريبية غير موجودة." }

        // Check if student is already enrolled
        const enrolled = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: session.id, courseId: course.id } }
        })
        if (enrolled) return { success: false, error: `أنت مشترك بالفعل في دورة: ${course.title}` }

        // Apply Promotion if active
        let coursePrice = course.price
        if (promotion) {
          if (promotion.discountType === "PERCENT") {
            coursePrice = parseFloat((coursePrice * (1 - promotion.discountValue / 100)).toFixed(2))
          } else {
            coursePrice = Math.max(0, coursePrice - promotion.discountValue)
          }
        }

        coursesToPurchase.push({ ...course, finalPrice: coursePrice })
        subtotal += coursePrice
        totalCoins += course.priceInCoins
      }
    }

    // 2. Apply Coupon Code if provided
    let discount = 0
    let couponId = undefined
    if (couponCode && subtotal > 0) {
      const couponRes = await applyCouponCode(couponCode, subtotal)
      if (couponRes.success) {
        discount = couponRes.discountAmount ?? 0;
        couponId = couponRes.couponId
      } else {
        return { success: false, error: couponRes.error }
      }
    }

    // 2b. Calculate Coin discount if provided
    let coinsSpent = 0
    let coinDiscount = 0
    if (coinsSpentToDiscount && coinsSpentToDiscount > 0 && paymentMethod !== "COINS") {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { craftCoins: true }
      })
      const userCoins = user?.craftCoins ?? 0
      coinsSpent = Math.min(coinsSpentToDiscount, userCoins)
      coinDiscount = parseFloat((coinsSpent / coinsPerUsd).toFixed(2))
    }

    const priceAfterDiscount = Math.max(0, subtotal - discount - coinDiscount)
    const tax = await calculateTax(priceAfterDiscount, session.country)
    const totalCashAmount = parseFloat((priceAfterDiscount + tax).toFixed(2))

    // 3. Process Checkout by Payment Method
    if (paymentMethod === "COINS") {
      if (planToSubscribe) {
        return { success: false, error: "لا يمكن شراء الاشتراكات المباشرة بالعملات الافتراضية." }
      }

      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { craftCoins: true }
      })

      if (!user || user.craftCoins < totalCoins) {
        return { success: false, error: "رصيد عملات كرافت الخاص بك غير كافٍ لشراء المحتوى." }
      }

      // Execute coin payment
      const paymentResult = await prisma.$transaction(async (tx) => {
        // Deduct Coins
        await tx.user.update({
          where: { id: session.id },
          data: { craftCoins: { decrement: totalCoins } }
        })

        // Log Coin Transaction
        await tx.transaction.create({
          data: {
            userId: session.id,
            amount: totalCoins,
            type: "SPEND",
            description: `شراء دورات تعليمية بالعملات (${coursesToPurchase.map(c => c.title).join(", ")})`
          }
        })

        // Record Purchase and enroll
        const purchaseRecords = []
        for (const course of coursesToPurchase) {
          const purchase = await tx.purchase.create({
            data: {
              userId: session.id,
              courseId: course.id,
              pricePaid: 0.0,
              coinsSpent: course.priceInCoins
            }
          })

          // Enroll user in course
          await tx.enrollment.create({
            data: {
              userId: session.id,
              courseId: course.id,
              progress: 0
            }
          })

          purchaseRecords.push(purchase)
        }

        // Create mock payment record
        const paymentRecord = await tx.payment.create({
          data: {
            userId: session.id,
            amount: 0.0,
            currency: "USD",
            provider: "COINS",
            providerPaymentId: `COIN-PAY-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
            status: "PAID"
          }
        })

        return { paymentRecord, purchaseRecords }
      })

      await createAuditLog(session.id, "Purchase with Coins", null, null, `Bought courses via Coins. Total Coins: ${totalCoins}`)
      await createNotification(
        session.id,
        "📚 تم تفعيل دوراتك بنجاح!",
        `تهانينا! تم تفعيل اشتراكك بالدورات التالية بنجاح باستخدام عملاتك: ${coursesToPurchase.map(c => c.title).join(", ")}`,
        "COURSE"
      )

      revalidatePath("/dashboard/student/courses")
      return { success: true, paymentId: paymentResult.paymentRecord.id }
    }

    // Cash Checkout (Stripe, PayPal, Free)
    // Execute Cash transaction
    const paymentResult = await prisma.$transaction(async (tx) => {
      // 1. If discount coupon applied, increment coupon usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { useCount: { increment: 1 } }
        })
      }

      // 1b. If coins discount applied, deduct coins
      if (coinsSpent > 0) {
        await tx.user.update({
          where: { id: session.id },
          data: { craftCoins: { decrement: coinsSpent } }
        })

        await tx.transaction.create({
          data: {
            userId: session.id,
            amount: coinsSpent,
            type: "SPEND",
            description: `خصم عملات لشراء دورات (${coursesToPurchase.map(c => c.title).join(", ")})`
          }
        })
      }

      // 2. Create Payment Record
      const providerPaymentId = `${paymentMethod}-MOCK-${Math.random().toString(36).substring(2, 11).toUpperCase()}`
      const paymentRecord = await tx.payment.create({
        data: {
          userId: session.id,
          amount: totalCashAmount,
          currency: "USD",
          provider: paymentMethod,
          providerPaymentId,
          status: totalCashAmount === 0 ? "PAID" : "PENDING",
          couponId: couponId || null,
          taxAmount: tax
        }
      })

      // 3. Generate Purchase/Subscription Records & handle instant activations
      if (totalCashAmount === 0 || paymentMethod === "STRIPE" || paymentMethod === "PAYPAL") {
        // If subscription item
        if (planToSubscribe) {
          const sub = await tx.subscription.create({
            data: {
              userId: session.id,
              planId: planToSubscribe.id,
              status: "ACTIVE",
              startDate: new Date(),
              endDate: new Date(Date.now() + planToSubscribe.durationDays * 24 * 60 * 60 * 1000)
            }
          })

          // Link subscription to payment
          await tx.payment.update({
            where: { id: paymentRecord.id },
            data: { status: "PAID", subscriptionId: sub.id }
          })

          // Award plan Coins
          let coinsBonus = planToSubscribe.name === "PREMIUM" ? 500 : planToSubscribe.name === "PRO" ? 200 : 0
          if (coinsBonus > 0) {
            await tx.user.update({
              where: { id: session.id },
              data: { craftCoins: { increment: coinsBonus } }
            })
            await tx.transaction.create({
              data: {
                userId: session.id,
                amount: coinsBonus,
                type: "EARN",
                description: `عملات هدية الاشتراك الشهري (${planToSubscribe.name})`
              }
            })
          }
        }

        // If courses items
        const count = coursesToPurchase.length
        for (const course of coursesToPurchase) {
          const splitPrice = count > 0 ? parseFloat((course.finalPrice - (coinDiscount / count)).toFixed(2)) : course.finalPrice
          const splitCoins = count > 0 ? Math.round(coinsSpent / count) : 0

          const purchase = await tx.purchase.create({
            data: {
              userId: session.id,
              courseId: course.id,
              pricePaid: Math.max(0, splitPrice),
              coinsSpent: splitCoins,
              affiliateCode: affiliateCode || null
            }
          })

          // Enroll student
          await tx.enrollment.create({
            data: {
              userId: session.id,
              courseId: course.id,
              progress: 0
            }
          })

          // Split earnings to Teacher Wallet: 80% to teacher, 20% platform commission
          const teacherEarning = parseFloat((Math.max(0, splitPrice) * 0.8).toFixed(2))

          await tx.teacherWallet.upsert({
            where: { teacherId: course.teacherId },
            update: {
              pendingBalance: { increment: teacherEarning }
            },
            create: {
              teacherId: course.teacherId,
              pendingBalance: teacherEarning,
              currentBalance: 0,
              confirmedEarnings: 0
            }
          })

          // Handle Affiliate Commission (10% of pricePaid) if affiliate link used
          if (affiliateCode) {
            const referrer = await tx.user.findUnique({
              where: { referralCode: affiliateCode }
            })

            if (referrer && referrer.id !== session.id) {
              const commissionAmount = parseFloat((Math.max(0, splitPrice) * 0.1).toFixed(2))
              await tx.affiliateCommission.create({
                data: {
                  affiliateUserId: referrer.id,
                  purchaseId: purchase.id,
                  amount: commissionAmount,
                  status: "PENDING"
                }
              })

              await tx.notification.create({
                data: {
                  userId: referrer.id,
                  title: "💰 عمولة تسويق جديدة!",
                  message: `لقد حصلت على عمولة بقيمة $${commissionAmount} من إحالة شراء لدورة "${course.title}".`,
                  type: "SYSTEM"
                }
              })
            }
          }

          // Link purchase to payment
          await tx.payment.update({
            where: { id: paymentRecord.id },
            data: { status: "PAID", purchaseId: purchase.id }
          })
        }

        // Create Invoice
        const invoiceNumber = `CCC-INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        await tx.invoice.create({
          data: {
            invoiceNumber,
            userId: session.id,
            paymentId: paymentRecord.id,
            amount: subtotal,
            tax,
            discount: discount + coinDiscount,
            total: totalCashAmount,
            billingDetails: { name: session.name || "", email: session.email }
          }
        })
      }

      return paymentRecord
    })

    await createAuditLog(
      session.id,
      "Purchase Cash",
      null,
      null,
      `Paid $${totalCashAmount} via ${paymentMethod} for ${items.length} items.`
    )

    await createNotification(
      session.id,
      "💳 تم إكمال عملية الشراء!",
      `تم استلام دفعتك بقيمة $${totalCashAmount} بنجاح وتفعيل مشترياتك. تم توليد الفاتورة المالية في لوحة تحكمك.`,
      "SYSTEM"
    )

    revalidatePath("/dashboard/student/courses")
    revalidatePath("/dashboard/student/subscription")
    return { success: true, paymentId: paymentResult.id }
  } catch (error) {
    console.error("Error in createCheckoutSession:", error)
    return { success: false, error: "حدث خطأ غير متوقع أثناء إعداد الدفع." }
  }
}

/**
 * Webhook simulator to update payment status externally
 */
export async function simulateWebhook(paymentId: string, status: "PAID" | "FAILED" | "REFUNDED") {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true }
    })

    if (!payment) return { success: false, error: "عملية الدفع غير موجودة." }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status }
    })

    await createAuditLog(
      payment.userId,
      `Payment Webhook: ${status}`,
      null,
      null,
      `Payment ID: ${paymentId} updated to ${status}`
    )

    return { success: true }
  } catch (error) {
    console.error("Error in simulateWebhook:", error)
    return { success: false, error: "فشل تحديث بوابة الدفع." }
  }
}

/**
 * Create a new discount coupon
 */
export async function createCoupon(data: {
  code: string
  discountType: "PERCENT" | "FIXED"
  discountValue: number
  expiryDate?: string
  maxUses?: number
}) {
  try {
    const session = await getServerSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return { success: false, error: "غير مصرح لك بإنشاء كوبونات." }
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase().trim(),
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        maxUses: data.maxUses ? Number(data.maxUses) : null,
        isActive: true
      }
    })

    revalidatePath("/dashboard/admin/financials")
    return { success: true, coupon }
  } catch (error) {
    console.error("Error in createCoupon:", error)
    return { success: false, error: "فشل إنشاء كوبون الخصم." }
  }
}

/**
 * Create a new promotional campaign
 */
export async function createPromotion(data: {
  name: string
  description?: string
  discountType: "PERCENT" | "FIXED"
  discountValue: number
  startDate: string
  endDate: string
}) {
  try {
    const session = await getServerSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return { success: false, error: "غير مصرح لك بإنشاء حملات ترويجية." }
    }

    const promotion = await prisma.promotion.create({
      data: {
        name: data.name,
        description: data.description || null,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: true
      }
    })

    revalidatePath("/dashboard/admin/financials")
    return { success: true, promotion }
  } catch (error) {
    console.error("Error in createPromotion:", error)
    return { success: false, error: "فشل إنشاء الحملة الترويجية." }
  }
}

