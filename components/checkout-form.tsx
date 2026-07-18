// components/checkout-form.tsx
"use client"

import React, { useState, startTransition, useTransition } from "react"
import { CreditCard, Coins, ShieldCheck, AlertCircle, Loader2, Sparkles, Ticket } from "lucide-react"

interface CartItem {
  id: string
  title: string
  finalPrice: number
  priceInCoins: number
  teacher: { name: string | null }
}

interface CheckoutFormProps {
  items: CartItem[]
  userCoins: number
  coinsPerUsd: number
  sessionCountry: string | null
  subtotal: number
  initialTax: number
  initialTotal: number
  couponCode?: string
  confirmPaymentAction: (gateway: "STRIPE" | "PAYPAL" | "COINS", coinsUsed: number) => Promise<any>
}

export default function CheckoutForm({
  items,
  userCoins,
  coinsPerUsd,
  sessionCountry,
  subtotal,
  initialTax,
  initialTotal,
  couponCode,
  confirmPaymentAction,
}: CheckoutFormProps) {
  const [gateway, setGateway] = useState<"STRIPE" | "PAYPAL" | "COINS">("STRIPE")
  const [useHybridCoins, setUseHybridCoins] = useState(false)
  const [coinsToSpend, setCoinsToSpend] = useState(0)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Total Coins cost if paying fully in Coins
  const totalCoinsCost = items.reduce((sum, item) => sum + item.priceInCoins, 0)
  const canPayFullyWithCoins = userCoins >= totalCoinsCost && totalCoinsCost > 0

  // Hybrid Coins details
  const maxCoinsForDiscount = Math.min(userCoins, totalCoinsCost)
  const appliedCoins = useHybridCoins ? coinsToSpend : 0
  const coinDiscountUsd = parseFloat((appliedCoins / coinsPerUsd).toFixed(2))

  // Re-calculate pricing live on client
  const priceAfterDiscount = Math.max(0, subtotal - coinDiscountUsd)
  
  // Tax calculations matching calculated tax function
  const taxPct = sessionCountry?.toUpperCase() === "SA" ? 0.15 : sessionCountry?.toUpperCase() === "EG" ? 0.14 : sessionCountry?.toUpperCase() === "AU" ? 0.10 : 0.0
  const taxAmount = parseFloat((priceAfterDiscount * taxPct).toFixed(2))
  const finalTotalUsd = parseFloat((priceAfterDiscount + taxAmount).toFixed(2))

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoinsToSpend(Number(e.target.value))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const selectedGateway = gateway
      const coinsUsed = selectedGateway === "COINS" ? totalCoinsCost : (useHybridCoins ? coinsToSpend : 0)
      
      const res = await confirmPaymentAction(selectedGateway, coinsUsed)
      if (res && !res.success) {
        setError(res.error || "فشلت عملية الدفع.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right" dir="rtl">
      {error && (
        <div className="lg:col-span-2 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-800 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-shake">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Right Column: Billing & Payment Selection */}
      <div className="space-y-6">
        {/* Payment Methods */}
        <div className="p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#141C2F] shadow-sm space-y-6">
          <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#2B4C7E]" />
            اختر طريقة الدفع والاشتراك
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {/* Direct USD via Credit Card */}
            <label className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${gateway === "STRIPE" ? "border-[#2B4C7E] bg-[#2B4C7E]/5 dark:bg-[#2B4C7E]/10" : "border-gray-200 dark:border-gray-800 bg-transparent hover:bg-gray-50/50 dark:hover:bg-gray-900/30"}`}>
              <input
                type="radio"
                name="gateway"
                value="STRIPE"
                checked={gateway === "STRIPE"}
                onChange={() => {
                  setGateway("STRIPE")
                  // Keep hybrid options
                }}
                className="accent-[#2B4C7E] h-4.5 w-4.5"
              />
              <CreditCard className="h-5 w-5 text-[#2B4C7E]" />
              <div className="flex-1">
                <p className="text-xs font-black text-gray-900 dark:text-white">البطاقة البنكية / الائتمانية</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">فيزا، ماستر كارد، أو بطاقة مدى مدى الحياة</p>
              </div>
            </label>

            {/* Direct USD via PayPal */}
            <label className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${gateway === "PAYPAL" ? "border-[#2B4C7E] bg-[#2B4C7E]/5 dark:bg-[#2B4C7E]/10" : "border-gray-200 dark:border-gray-800 bg-transparent hover:bg-gray-50/50 dark:hover:bg-gray-900/30"}`}>
              <input
                type="radio"
                name="gateway"
                value="PAYPAL"
                checked={gateway === "PAYPAL"}
                onChange={() => {
                  setGateway("PAYPAL")
                }}
                className="accent-[#2B4C7E] h-4.5 w-4.5"
              />
              <span className="text-xs font-black text-blue-600 dark:text-blue-400">PayPal</span>
              <div className="flex-1">
                <p className="text-xs font-black text-gray-900 dark:text-white">حساب PayPal</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">الدفع الآمن الفوري عبر رصيد باي بال</p>
              </div>
            </label>

            {/* Full Coins Purchase (if eligible) */}
            {canPayFullyWithCoins && (
              <label className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${gateway === "COINS" ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10" : "border-gray-200 dark:border-gray-800 bg-transparent hover:bg-gray-50/50 dark:hover:bg-gray-900/30"}`}>
                <input
                  type="radio"
                  name="gateway"
                  value="COINS"
                  checked={gateway === "COINS"}
                  onChange={() => {
                    setGateway("COINS")
                    setUseHybridCoins(false) // Disable hybrid when full coins is active
                  }}
                  className="accent-amber-500 h-4.5 w-4.5"
                />
                <Coins className="h-5 w-5 text-amber-500" />
                <div className="flex-1">
                  <p className="text-xs font-black text-gray-900 dark:text-white">الدفع بالكامل بعملات كرافت (CC)</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-450 mt-0.5">سيتم خصم {totalCoinsCost} CC من رصيدك المتاح ({userCoins} CC)</p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Hybrid Coin Discount Slider (Stripe/PayPal only) */}
        {gateway !== "COINS" && userCoins > 0 && totalCoinsCost > 0 && (
          <div className="p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#141C2F] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-800 dark:text-white flex items-center gap-2">
                <Coins className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                استخدام الكوينز للحصول على خصم
              </h3>
              <input
                type="checkbox"
                id="hybrid-toggle"
                checked={useHybridCoins}
                onChange={(e) => {
                  setUseHybridCoins(e.target.checked)
                  if (e.target.checked) setCoinsToSpend(Math.min(userCoins, totalCoinsCost))
                }}
                className="w-4 h-4 rounded text-[#2B4C7E] focus:ring-[#2B4C7E]"
              />
            </div>

            {useHybridCoins && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>العملات المستخدمة: <strong className="text-amber-500">{coinsToSpend} CC</strong></span>
                  <span>الخصم الممنوح: <strong className="text-emerald-600">${coinDiscountUsd.toFixed(2)}</strong></span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max={maxCoinsForDiscount}
                  value={coinsToSpend}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#2B4C7E]"
                />

                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>0 CC</span>
                  <span>الحد الأقصى للمشتريات: {maxCoinsForDiscount} CC</span>
                </div>

                <div className="p-3 bg-amber-50/50 dark:bg-amber-500/5 rounded-xl border border-amber-200/30 text-[10px] text-amber-700 dark:text-amber-300">
                  سعر الصرف المعتمد: {coinsPerUsd} CC = $1.00 USD. رصيدك المتاح: {userCoins} CC.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Secure Checkout Note */}
        <div className="flex items-center gap-2.5 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-200/60 dark:border-gray-800 text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-[#4A7C59] shrink-0" />
          <p>أنت محمي بضمان تشفير بيانات المدفوعات. جميع المعاملات تتم بالكامل في بيئة مشفرة آمنة بنسبة 100%.</p>
        </div>
      </div>

      {/* Left Column: Order Summary Review */}
      <div className="p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#141C2F] shadow-sm space-y-6 h-fit">
        <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-3">
          مراجعة محتويات طلبك
        </h2>

        <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-xs text-gray-800 dark:text-white leading-snug">{item.title}</h4>
                <p className="text-[10px] text-gray-400 mt-1">المدرب: {item.teacher.name || "معلم منصة كود كرافت"}</p>
              </div>
              <div className="text-left shrink-0">
                <span className="text-xs font-black text-gray-900 dark:text-white">${item.finalPrice.toFixed(2)}</span>
                <span className="block text-[8px] font-bold text-amber-500 uppercase mt-0.5">{item.priceInCoins} CC</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Summary calculations */}
        <div className="space-y-3 border-t border-gray-100 dark:border-gray-800/85 pt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>المجموع الفرعي</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {couponCode && (
            <div className="flex justify-between text-emerald-600">
              <span className="flex items-center gap-1"><Ticket className="w-3.5 h-3.5" /> كود خصم</span>
              <span>مطبق</span>
            </div>
          )}

          {coinDiscountUsd > 0 && (
            <div className="flex justify-between text-[#4A7C59]">
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> خصم عملات CC</span>
              <span>-${coinDiscountUsd.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>الضرائب ({taxPct > 0 ? `${taxPct * 100}%` : "0%"})</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm font-black text-gray-900 dark:text-white border-t border-gray-100 dark:border-gray-800 pt-3">
            <span>المجموع النهائي للدفع</span>
            {gateway === "COINS" ? (
              <span className="text-amber-500">{totalCoinsCost} CC</span>
            ) : (
              <span className="text-[#2B4C7E] dark:text-sky-400">${finalTotalUsd.toFixed(2)}</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-4 bg-[#2B4C7E] hover:bg-[#2B4C7E]/95 disabled:opacity-50 text-white text-xs font-black rounded-2xl shadow-md shadow-[#2B4C7E]/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          <span>
            {gateway === "COINS"
              ? `تأكيد الدفع بـ ${totalCoinsCost} عملة كرافت`
              : `تأكيد ودفع $${finalTotalUsd.toFixed(2)} الآن`}
          </span>
        </button>
      </div>
    </form>
  )
}
