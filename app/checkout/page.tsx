// app/checkout/page.tsx
import React from "react"
import { getCartItems, clearCart } from "@/actions/cart"
import { calculateTax, createCheckoutSession, getActivePromotion } from "@/actions/payment"
import { getServerSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { CheckCircle, ShoppingBag, ShieldCheck, AlertCircle } from "lucide-react"
import CheckoutForm from "@/components/checkout-form"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ coupon?: string; success_payment?: string; error?: string }>
}

export default async function CheckoutPage(props: Props) {
  const searchParams = await props.searchParams
  const couponQuery = searchParams.coupon
  const successPayment = searchParams.success_payment

  const session = await getServerSession()
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border shadow-md max-w-sm">
          <p className="font-bold mb-4">يجب تسجيل الدخول لمتابعة الدفع.</p>
          <Link href="/login?redirect=/checkout" className="px-6 py-2.5 bg-[#2B4C7E] text-white rounded-2xl text-xs font-bold">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    )
  }

  const cartRes = await getCartItems()
  const items = cartRes.items || []

  // Load COINS_PER_USD exchange rate
  let coinsPerUsd = 100
  try {
    const rateSetting = await prisma.systemSetting.findUnique({
      where: { key: "COINS_PER_USD" }
    })
    if (rateSetting) {
      coinsPerUsd = Number(rateSetting.value) || 100
    }
  } catch (err) {
    console.error("Error reading COINS_PER_USD in page:", err)
  }

  // Promotion discount check
  const promotion = await getActivePromotion()

  let subtotal = 0
  let totalCoins = 0

  const itemsWithPrices = items.map(item => {
    let finalPrice = item.price
    if (promotion && finalPrice > 0) {
      if (promotion.discountType === "PERCENT") {
        finalPrice = parseFloat((finalPrice * (1 - promotion.discountValue / 100)).toFixed(2))
      } else {
        finalPrice = Math.max(0, finalPrice - promotion.discountValue)
      }
    }
    subtotal += finalPrice
    totalCoins += item.priceInCoins
    return { 
      id: item.id,
      title: item.title,
      finalPrice,
      priceInCoins: item.priceInCoins,
      teacher: { name: item.teacher?.name || "معلم" }
    }
  })

  // Get user coins balance directly from database
  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: { craftCoins: true }
  })
  const userCoins = dbUser?.craftCoins ?? 0

  const errorMsg = searchParams.error
  const tax = await calculateTax(subtotal, session.country)
  const total = parseFloat((subtotal + tax).toFixed(2))

  // Server Action to handle payment gateway confirmation
  async function handleConfirmPayment(gateway: "STRIPE" | "PAYPAL" | "COINS", coinsUsed: number) {
    "use server"
    const checkoutItems = items.map(i => ({ type: "COURSE" as const, id: i.id }))

    const res = await createCheckoutSession(
      checkoutItems,
      couponQuery || undefined,
      gateway,
      undefined,
      coinsUsed
    )

    if (res.success) {
      await clearCart()
      revalidatePath("/checkout")
      revalidatePath("/dashboard/student/courses")
      revalidatePath("/cart")
      redirect("/checkout?success_payment=true")
    } else {
      return { success: false, error: res.error || "فشلت عملية الدفع" }
    }
  }

  const isPaymentComplete = successPayment === "true"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
        {isPaymentComplete ? (
          /* Payment Success Card */
          <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-[#141C2F] rounded-3xl border border-gray-200/60 dark:border-slate-800 space-y-6 shadow-xl py-12 animate-fade-in">
            <CheckCircle className="h-16 w-16 mx-auto text-emerald-500 animate-bounce" />
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">تم الدفع والاشتراك بنجاح!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              لقد تم استلام دفعتك وتفعيل مشترياتك بنجاح. يمكنك الآن الانتقال لمشاهدة مقرراتك التعليمية مباشرة ومتابعة دراستك. تم إرسال فاتورة الشراء لبريدك الإلكتروني.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
              <Link
                href="/dashboard/student/courses"
                className="px-6 py-3 bg-[#2B4C7E] hover:bg-[#2B4C7E]/95 text-white text-xs font-bold rounded-2xl shadow-md transition-all"
              >
                انتقل إلى مقرراتي
              </Link>
              <Link
                href="/dashboard/student/wallet"
                className="px-6 py-3 border border-gray-200 dark:border-gray-850 text-gray-700 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-900 text-xs font-bold rounded-2xl transition-colors"
              >
                المحفظة الرقمية
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* Empty Items Checkout Error */
          <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-[#141C2F] rounded-3xl border border-gray-200/60 dark:border-slate-800 space-y-6">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 dark:text-slate-650 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">لا توجد عناصر للدفع</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              سلتك فارغة حالياً. لا يوجد أي عناصر بانتظار الدفع والاشتراك.
            </p>
            <Link
              href="/courses/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2B4C7E] text-white text-xs font-bold rounded-2xl shadow-md transition-all"
            >
              الذهاب للسوق
            </Link>
          </div>
        ) : (
          /* Interactive Checkout Client Component */
          <div className="space-y-6">
            <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">إكمال عملية الشراء والاشتراك</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">راجع طلبك واختر طريقة الفوترة والدفع المفضلة لديك.</p>
            </div>
            
            <CheckoutForm
              items={itemsWithPrices}
              userCoins={userCoins}
              coinsPerUsd={coinsPerUsd}
              sessionCountry={session.country}
              subtotal={subtotal}
              initialTax={tax}
              initialTotal={total}
              couponCode={couponQuery || undefined}
              confirmPaymentAction={handleConfirmPayment}
            />
          </div>
        )}
      </main>
    </div>
  )
}
