// app/cart/page.tsx
import React from "react"
import { getCartItems, removeFromCart, clearCart } from "@/actions/cart"
import { applyCouponCode, calculateTax, getActivePromotion } from "@/actions/payment"
import { getServerSession } from "@/lib/auth"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import { Trash2, ShoppingBag, ArrowRight, ShoppingCart, Percent, Tag, Coins } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const dynamic = "force-dynamic"

export default async function CartPage(props: {
  searchParams: Promise<{ coupon?: string; error?: string }>
}) {
  const searchParams = await props.searchParams
  const couponQuery = searchParams.coupon
  const errorMsg = searchParams.error

  const session = await getServerSession()
  const cartRes = await getCartItems()
  const items = cartRes.items || []

  const promotion = await getActivePromotion()

  // Calculate totals
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
    return { ...item, finalPrice }
  })

  let discount = 0
  let couponDetails: any = null

  if (couponQuery && subtotal > 0) {
    const couponRes = await applyCouponCode(couponQuery, subtotal)
    if (couponRes.success && couponRes.discountAmount) {
      discount = couponRes.discountAmount
      couponDetails = couponRes
    }
  }

  const priceAfterDiscount = Math.max(0, subtotal - discount)
  const tax = await calculateTax(priceAfterDiscount, session?.country)
  const total = parseFloat((priceAfterDiscount + tax).toFixed(2))

  // Server actions for cart operations
  async function handleRemove(formData: FormData) {
    "use server"
    const courseId = formData.get("courseId") as string
    if (courseId) {
      await removeFromCart(courseId)
      revalidatePath("/cart")
    }
  }

  async function handleClear() {
    "use server"
    await clearCart()
    revalidatePath("/cart")
  }

  async function handleApplyCoupon(formData: FormData) {
    "use server"
    const code = formData.get("couponCode") as string
    if (code) {
      revalidatePath(`/cart?coupon=${code.toUpperCase()}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* <Navbar /> */}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-indigo-600" />
          سلة المشتريات
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/60 dark:border-slate-800/60 p-8 max-w-lg mx-auto">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 dark:text-slate-600 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">سلتك فارغة حالياً</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
              لم تقم بإضافة أي دورات إلى السلة بعد. تصفح سوق الدورات للعثور على المحتوى المناسب لك.
            </p>
            <Link
              href="/courses/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-2xl shadow-md transition-all"
            >
              تصفح سوق الدورات
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-500">
                  عدد العناصر: {items.length}
                </span>
                <form action={handleClear}>
                  <button
                    type="submit"
                    className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    إفراغ السلة بالكامل
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                {itemsWithPrices.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-3xl border border-gray-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 text-right w-full sm:w-auto">
                      <div className="h-16 w-24 rounded-2xl bg-indigo-950 flex items-center justify-center text-white shrink-0 overflow-hidden">
                        {item.coverImage ? (
                          <img src={item.coverImage} alt={item.title} className="object-cover w-full h-full" />
                        ) : (
                          <ShoppingCart className="h-6 w-6 text-indigo-500" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          {item.level === "BEGINNER" ? "مبتدئ" : item.level === "INTERMEDIATE" ? "متوسط" : "متقدم"}
                        </span>
                        <h3 className="font-extrabold text-sm text-gray-950 dark:text-white mt-1 leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">المدرب: {item.teacher.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800 pt-4 sm:pt-0">
                      {/* Price info */}
                      <div className="text-left sm:text-right">
                        {item.price > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                              ${item.finalPrice}
                            </span>
                            {promotion && (
                              <span className="text-[10px] text-gray-400 line-through font-medium">
                                ${item.price}
                              </span>
                            )}
                          </div>
                        ) : item.priceInCoins > 0 ? (
                          <span className="text-xs font-extrabold text-amber-500 flex items-center gap-1">
                            <Coins className="h-4 w-4" />
                            {item.priceInCoins} عملة
                          </span>
                        ) : (
                          <span className="text-xs font-extrabold text-indigo-500">مجاني</span>
                        )}
                      </div>

                      {/* Remove form */}
                      <form action={handleRemove}>
                        <input type="hidden" name="courseId" value={item.id} />
                        <button
                          type="submit"
                          className="p-2.5 rounded-xl border border-gray-100 hover:border-red-200 dark:border-slate-800 dark:hover:border-red-900 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="إزالة من السلة"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Panel */}
            <div className="space-y-6">
              <div className="p-6 rounded-3xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">ملخص الطلب</h2>

                {/* Coupon form */}
                <form action={handleApplyCoupon} className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400">كوبون الخصم</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="couponCode"
                      defaultValue={couponQuery || ""}
                      placeholder="أدخل كود الخصم..."
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shrink-0 cursor-pointer"
                    >
                      تطبيق
                    </button>
                  </div>
                  {couponDetails && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
                      <Percent className="w-3.5 h-3.5" />
                      تم تطبيق خصم بقيمة {couponDetails.discountValue}{couponDetails.discountType === "PERCENT" ? "%" : "$"}
                    </p>
                  )}
                </form>

                {/* Pricing summary */}
                <div className="space-y-3 border-t border-gray-100 dark:border-slate-800/80 pt-4 text-sm font-semibold">
                  <div className="flex justify-between text-gray-500">
                    <span>المجموع الفرعي</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>الخصم</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  {session && (
                    <div className="flex justify-between text-gray-550 dark:text-slate-400">
                      <span>الضرائب ({session.country === "SA" ? "15% VAT" : session.country === "EG" ? "14% VAT" : session.country === "AU" ? "10% GST" : "0%"})</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-gray-900 dark:text-white border-t border-gray-100 dark:border-slate-800 pt-3">
                    <span>المجموع الكلي</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  {totalCoins > 0 && (
                    <div className="flex justify-between text-xs font-bold text-amber-500 pt-1">
                      <span>أو بالعملات الكلية</span>
                      <span>{totalCoins} عملة 🪙</span>
                    </div>
                  )}
                </div>

                {/* Checkout CTA */}
                <Link
                  href={session ? `/checkout?coupon=${couponQuery || ""}` : "/login?redirect=/cart"}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-2xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all text-center"
                >
                  إجراء عملية الدفع
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </Link>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-150/40 text-indigo-800 dark:text-indigo-400 text-xs font-medium leading-relaxed flex gap-2">
                <Tag className="h-5 w-5 shrink-0 text-indigo-600" />
                <p>يمكنك الدفع إما بالبطاقة الإئتمانية أو عبر الخصم المباشر من رصيد عملات كرافت الخاص بك في الخطوة التالية.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* <Footer /> */}
    </div>
  )
}
