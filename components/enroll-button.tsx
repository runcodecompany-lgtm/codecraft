// components/enroll-button.tsx
"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { enrollInCourse, cancelEnrollment } from "@/actions/enrollment"
import { addToCart } from "@/actions/cart"
import { Loader2, PlayCircle, Lock, Coins, Sparkles, LogOut, CheckCircle, CreditCard } from "lucide-react"

interface EnrollButtonProps {
  courseId: string
  priceInCoins: number
  priceUsd: number
  userCoins: number
  isEnrolled: boolean
  isAuthenticated: boolean
}

export default function EnrollButton({
  courseId,
  priceInCoins,
  priceUsd,
  userCoins,
  isEnrolled,
  isAuthenticated,
}: EnrollButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  const handleEnrollOrPurchase = () => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    setError(null)
    startTransition(async () => {
      // If course is free, enroll instantly
      if (priceInCoins === 0 && priceUsd === 0) {
        const result = await enrollInCourse(courseId)
        if (result.success) {
          router.refresh()
        } else {
          setError(result.error || "فشل التسجيل في الدورة.")
        }
      } else {
        // If course is paid, add to cart and redirect to checkout
        const result = await addToCart(courseId)
        if (result.success || result.error?.includes("بالفعل")) {
          router.push("/checkout")
        } else {
          setError(result.error || "فشل إعداد عملية الدفع.")
        }
      }
    })
  }

  const handleCancelEnroll = () => {
    setError(null)
    startTransition(async () => {
      const result = await cancelEnrollment(courseId)
      if (result.success) {
        setShowConfirmCancel(false)
        router.refresh()
      } else {
        setError(result.error || "فشل إلغاء التسجيل.")
      }
    })
  }

  if (isEnrolled) {
    return (
      <div className="space-y-3 w-full max-w-md" dir="rtl">
        <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-2xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>أنت مسجل في هذه الدورة ومصرح لك بالدراسة</span>
        </div>

        {showConfirmCancel ? (
          <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-3">
            <p className="text-[11px] text-rose-400 font-medium leading-relaxed text-right">
              هل أنت متأكد من إلغاء التسجيل؟ سيتم حذف تقدمك الدراسي في الدورة بالكامل ولن يتم استرداد المبالغ أو العملات المستهلكة.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelEnroll}
                disabled={pending}
                className="px-4 py-2 rounded-xl bg-rose-650 hover:bg-rose-700 disabled:opacity-50 text-xs font-bold text-white transition-all flex items-center gap-1.5"
              >
                {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>نعم، ألغِ تسجيلي</span>
              </button>
              <button
                onClick={() => setShowConfirmCancel(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all"
              >
                تراجع
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmCancel(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-gray-200 dark:border-gray-800 hover:bg-rose-500/5 hover:border-rose-550/20 hover:text-rose-500 text-gray-500 dark:text-slate-400 text-xs font-bold transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>إلغاء التسجيل في الدورة</span>
          </button>
        )}
        {error && <p className="text-xs text-rose-500 font-bold mt-1 text-right">{error}</p>}
      </div>
    )
  }

  // Not enrolled pricing display
  const isFree = priceInCoins === 0 && priceUsd === 0

  return (
    <div className="w-full max-w-md space-y-2" dir="rtl">
      <button
        onClick={handleEnrollOrPurchase}
        disabled={pending}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gradient-to-l from-[#2B4C7E] to-[#1c3459] hover:from-[#1c3459] hover:to-[#2B4C7E] disabled:opacity-50 text-white text-xs font-black transition-all shadow-md hover:scale-[1.01]"
      >
        {pending ? (
          <Loader2 className="h-4.5 w-4.5 animate-spin" />
        ) : isFree ? (
          <PlayCircle className="h-4.5 w-4.5" />
        ) : (
          <CreditCard className="h-4.5 w-4.5" />
        )}
        <span>
          {isFree
            ? "سجل وابدأ مجاناً الآن"
            : `اشترك في الدورة الآن (${priceUsd ? `$${priceUsd}` : `${priceInCoins} CC`})`}
        </span>
      </button>

      {error && <p className="text-xs text-rose-500 font-bold mt-1 text-right">{error}</p>}
    </div>
  )
}
