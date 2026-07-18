// app/dashboard/admin/financials/page.tsx
import React from "react"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { getFinancialReports, reviewPayout, reviewRefund } from "@/actions/financial"
import { createCoupon, createPromotion } from "@/actions/payment"
import { revalidatePath } from "next/cache"
import { Coins, Landmark, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, FileText, Ban, Tag, Gift, Percent, Plus, TrendingUp, Sparkles, DollarSign } from "lucide-react"
import AdminSidebar from "@/components/admin-sidebar"

export const dynamic = "force-dynamic"

export default async function AdminFinancialsPage(props: {
  searchParams: Promise<{ success?: string; error?: string; timeframe?: "daily" | "weekly" | "monthly" | "yearly" }>
}) {
  const searchParams = await props.searchParams
  const successMsg = searchParams.success
  const errorMsg = searchParams.error
  const timeframe = searchParams.timeframe || "monthly"

  const session = await getServerSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border shadow-md max-w-sm">
          <p className="font-bold mb-4">غير مصرح لك بدخول لوحة الإدارة المالية.</p>
          <a href="/" className="px-6 py-2.5 bg-indigo-650 text-white rounded-2xl text-xs font-bold">
            الرئيسية
          </a>
        </div>
      </div>
    )
  }

  // Get reports & stats
  const reportsRes = await getFinancialReports(timeframe)
  const stats = reportsRes.stats || { totalRevenue: 0, totalRefunded: 0, netRevenue: 0, activeSubscriptionsCount: 0, allPaymentsCount: 0 }

  // Fetch pending/past payout requests
  const payouts = await prisma.teacherPayout.findMany({
    include: {
      teacher: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  // Fetch refund requests
  const refunds = await prisma.refund.findMany({
    include: {
      user: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  // Fetch active coupons
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" }
  })

  // Fetch active promotions
  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: "desc" }
  })

  // Server actions for buttons
  async function handleReviewPayoutAction(formData: FormData) {
    "use server"
    const payoutId = formData.get("payoutId") as string
    const status = formData.get("status") as "APPROVED" | "REJECTED"
    const notes = formData.get("notes") as string

    if (payoutId && status) {
      const res = await reviewPayout(payoutId, status, notes)
      if (res.success) {
        revalidatePath("/dashboard/admin/financials")
      }
    }
  }

  async function handleReviewRefundAction(formData: FormData) {
    "use server"
    const refundId = formData.get("refundId") as string
    const status = formData.get("status") as "APPROVED" | "REJECTED"
    const notes = formData.get("notes") as string

    if (refundId && status) {
      const res = await reviewRefund(refundId, status, notes)
      if (res.success) {
        revalidatePath("/dashboard/admin/financials")
      }
    }
  }

  async function handleCreateCouponAction(formData: FormData) {
    "use server"
    const code = formData.get("code") as string
    const discountType = formData.get("discountType") as "PERCENT" | "FIXED"
    const discountValue = Number(formData.get("discountValue"))
    const expiryDate = formData.get("expiryDate") as string
    const maxUses = formData.get("maxUses") ? Number(formData.get("maxUses")) : undefined

    if (code && discountType && discountValue > 0) {
      const res = await createCoupon({ code, discountType, discountValue, expiryDate, maxUses })
      if (res.success) {
        revalidatePath("/dashboard/admin/financials")
      }
    }
  }

  async function handleCreatePromotionAction(formData: FormData) {
    "use server"
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const discountType = formData.get("discountType") as "PERCENT" | "FIXED"
    const discountValue = Number(formData.get("discountValue"))
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string

    if (name && discountValue > 0 && startDate && endDate) {
      const res = await createPromotion({ name, description, discountType, discountValue, startDate, endDate })
      if (res.success) {
        revalidatePath("/dashboard/admin/financials")
      }
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">الإدارة المالية والتقارير</h1>
          <p className="text-xs text-gray-400 font-medium mt-1">
            متابعة الإيرادات، طلبات سحب أرباح المعلمين، نزاعات الاسترجاع، إدارة الكوبونات والعروض الترويجية.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-indigo-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-2 shadow-sm">
          <p className="text-[10px] text-gray-500 font-bold">إجمالي الإيرادات</p>
          <p className="text-2xl font-black text-indigo-650 dark:text-indigo-400">${stats.totalRevenue}</p>
        </div>

        <div className="rounded-2xl border border-indigo-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-2 shadow-sm">
          <p className="text-[10px] text-gray-500 font-bold">إجمالي المبالغ المسترجعة</p>
          <p className="text-2xl font-black text-rose-500">${stats.totalRefunded}</p>
        </div>

        <div className="rounded-2xl border border-indigo-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-2 shadow-sm">
          <p className="text-[10px] text-gray-500 font-bold">صافي الإيرادات</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-450">${stats.netRevenue}</p>
        </div>

        <div className="rounded-2xl border border-indigo-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-2 shadow-sm">
          <p className="text-[10px] text-gray-500 font-bold">الاشتراكات النشطة</p>
          <p className="text-2xl font-black text-teal-500">{stats.activeSubscriptionsCount}</p>
        </div>

        <div className="rounded-2xl border border-indigo-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-2 shadow-sm">
          <p className="text-[10px] text-gray-500 font-bold">إجمالي المدفوعات المستلمة</p>
          <p className="text-2xl font-black text-amber-500">{stats.allPaymentsCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payout review panel */}
        <div className="p-6 rounded-3xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Landmark className="h-5 w-5 text-indigo-650" />
            مراجعة طلبات سحب أرباح المعلمين
          </h2>

          {payouts.filter(p => p.status === "PENDING").length === 0 ? (
            <p className="text-xs text-gray-400 italic">لا توجد طلبات سحب معلقة بانتظار المراجعة.</p>
          ) : (
            <div className="space-y-4 max-h-[350px] overflow-y-auto">
              {payouts.filter(p => p.status === "PENDING").map((p) => (
                <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-150 dark:border-slate-850 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-xs text-slate-800 dark:text-slate-350">{p.teacher.name}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{p.teacher.email}</p>
                      <p className="text-[10px] text-indigo-650 font-bold mt-1">المبلغ المطلوب: ${p.amount}</p>
                    </div>
                    <span className="text-[9px] font-mono bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded text-indigo-600">
                      {p.paymentMethod}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-100 dark:border-slate-850">
                    <strong>تفاصيل الحساب:</strong> {p.paymentDetails}
                  </p>

                  <form action={handleReviewPayoutAction} className="flex gap-2">
                    <input type="hidden" name="payoutId" value={p.id} />
                    <input
                      type="text"
                      name="notes"
                      placeholder="ملاحظات المراجعة (اختياري)..."
                      className="flex-1 px-3 py-1.5 rounded-xl text-[10px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 focus:outline-none"
                    />
                    <button
                      type="submit"
                      name="status"
                      value="APPROVED"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl cursor-pointer"
                    >
                      موافقة
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value="REJECTED"
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-xl cursor-pointer"
                    >
                      رفض
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          {/* Past payouts logs */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-850">
            <h3 className="text-xs font-bold text-gray-500 mb-3">طلبات السحب المعالجة سابقاً</h3>
            <div className="divide-y divide-gray-100 dark:divide-slate-850 max-h-40 overflow-y-auto">
              {payouts.filter(p => p.status !== "PENDING").map((p) => (
                <div key={p.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-extrabold text-slate-700 dark:text-slate-350">{p.teacher.name} - ${p.amount}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">ملاحظات: {p.adminNotes || "لا توجد"}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                    p.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                  }`}>
                    {p.status === "APPROVED" ? "تم التحويل" : "مرفوض"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Refund review panel */}
        <div className="p-6 rounded-3xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Ban className="h-5 w-5 text-rose-500" />
            مراجعة نزاعات استرجاع الأموال
          </h2>

          {refunds.filter(r => r.status === "PENDING").length === 0 ? (
            <p className="text-xs text-gray-400 italic">لا توجد طلبات استرجاع معلقة بانتظار المراجعة.</p>
          ) : (
            <div className="space-y-4 max-h-[350px] overflow-y-auto">
              {refunds.filter(r => r.status === "PENDING").map((r) => (
                <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-150 dark:border-slate-850 space-y-3">
                  <div>
                    <p className="font-extrabold text-xs text-slate-800 dark:text-slate-350">{r.user.name}</p>
                    <p className="text-[10px] text-rose-600 font-bold mt-1">مبلغ الاسترجاع: ${r.amount}</p>
                    <p className="text-[10px] text-gray-500 mt-1"><strong>سبب الاسترجاع:</strong> {r.reason}</p>
                  </div>

                  <form action={handleReviewRefundAction} className="flex gap-2">
                    <input type="hidden" name="refundId" value={r.id} />
                    <input
                      type="text"
                      name="notes"
                      placeholder="ملاحظات المراجعة (اختياري)..."
                      className="flex-1 px-3 py-1.5 rounded-xl text-[10px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 focus:outline-none"
                    />
                    <button
                      type="submit"
                      name="status"
                      value="APPROVED"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl cursor-pointer"
                    >
                      موافقة
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value="REJECTED"
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-xl cursor-pointer"
                    >
                      رفض
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          {/* Past refunds logs */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-850">
            <h3 className="text-xs font-bold text-gray-500 mb-3">طلبات الاسترجاع المعالجة سابقاً</h3>
            <div className="divide-y divide-gray-100 dark:divide-slate-850 max-h-40 overflow-y-auto">
              {refunds.filter(r => r.status !== "PENDING").map((r) => (
                <div key={r.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-extrabold text-slate-700 dark:text-slate-350">{r.user.name} - ${r.amount}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">السبب: {r.reason}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                    r.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-650"
                  }`}>
                    {r.status === "APPROVED" ? "مسترجعة" : "مرفوضة"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coupon management */}
        <div className="p-6 rounded-3xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Tag className="h-5 w-5 text-indigo-650" />
            إدارة كوبونات الخصم (Coupons)
          </h2>

          <form action={handleCreateCouponAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500">رمز الكوبون (مثال: SAVE20)</label>
              <input
                type="text"
                name="code"
                required
                className="w-full mt-1.5 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500">نوع الخصم</label>
              <select
                name="discountType"
                className="w-full mt-1.5 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
              >
                <option value="PERCENT">نسبة مئوية (%)</option>
                <option value="FIXED">مبلغ ثابت ($)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500">قيمة الخصم</label>
              <input
                type="number"
                name="discountValue"
                required
                step="0.01"
                className="w-full mt-1.5 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500">الحد الأقصى للاستخدام (اختياري)</label>
              <input
                type="number"
                name="maxUses"
                className="w-full mt-1.5 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-500">تاريخ انتهاء الصلاحية (اختياري)</label>
              <input
                type="date"
                name="expiryDate"
                className="w-full mt-1.5 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="sm:col-span-2 py-2 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              إنشاء كود خصم جديد
            </button>
          </form>

          {/* List of active coupons */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-850">
            <h3 className="text-xs font-bold text-gray-500 mb-3">الكوبونات النشطة حالياً</h3>
            <div className="divide-y divide-gray-105 dark:divide-slate-850 max-h-40 overflow-y-auto">
              {coupons.map((c) => (
                <div key={c.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
                      {c.code}
                    </span>
                    <span className="text-[10px] text-gray-400 mr-2">
                      قيمة: {c.discountValue}{c.discountType === "PERCENT" ? "%" : "$"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    استخدام: {c.useCount} / {c.maxUses || "∞"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Promotion management */}
        <div className="p-6 rounded-3xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Gift className="h-5 w-5 text-indigo-650" />
            حملات الخصومات الترويجية للمنصة
          </h2>

          <form action={handleCreatePromotionAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-500">اسم الحملة الترويجية</label>
              <input
                type="text"
                name="name"
                required
                placeholder="مثال: خصومات عيد الأضحى المبارك"
                className="w-full mt-1.5 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500">نوع الخصم</label>
              <select
                name="discountType"
                className="w-full mt-1.5 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
              >
                <option value="PERCENT">نسبة مئوية (%)</option>
                <option value="FIXED">مبلغ ثابت ($)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500">قيمة الخصم</label>
              <input
                type="number"
                name="discountValue"
                required
                step="0.01"
                className="w-full mt-1.5 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500">تاريخ البدء</label>
              <input
                type="date"
                name="startDate"
                required
                className="w-full mt-1.5 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500">تاريخ الانتهاء</label>
              <input
                type="date"
                name="endDate"
                required
                className="w-full mt-1.5 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-500">الوصف</label>
              <textarea
                name="description"
                rows={2}
                placeholder="تفاصيل الحملة والشروط..."
                className="w-full mt-1.5 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="sm:col-span-2 py-2 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              إطلاق الحملة الترويجية
            </button>
          </form>

          {/* List of active promotions */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-850">
            <h3 className="text-xs font-bold text-gray-500 mb-3">الحملات الترويجية الحالية والسابقة</h3>
            <div className="divide-y divide-gray-100 dark:divide-slate-850 max-h-40 overflow-y-auto">
              {promotions.map((p) => (
                <div key={p.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                    <p className="text-[9px] text-gray-400 mt-0.5">الخصم: {p.discountValue}{p.discountType === "PERCENT" ? "%" : "$"}</p>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    من: {new Date(p.startDate).toLocaleDateString("ar-EG")} إلى: {new Date(p.endDate).toLocaleDateString("ar-EG")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
