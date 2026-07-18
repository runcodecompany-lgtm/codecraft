// app/dashboard/student/subscription/page.tsx
import React from "react"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { getActiveSubscription, getSubscriptionPlans, subscribeToPlan, cancelSubscription } from "@/actions/subscription"
import { getFinancialReports, requestRefund } from "@/actions/financial"
import { revalidatePath } from "next/cache"
import { ShieldCheck, Coins, Sparkles, AlertCircle, FileText, Ban, Layers, RefreshCw, Star } from "lucide-react"
import StudentSidebar from "@/components/student-sidebar"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const dynamic = "force-dynamic"

export default async function StudentSubscriptionPage(props: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const searchParams = await props.searchParams
  const message = searchParams.message
  const error = searchParams.error

  const session = await getServerSession()
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border shadow-md max-w-sm">
          <p className="font-bold mb-4">يجب تسجيل الدخول لمشاهدة صفحة الاشتراكات.</p>
          <a href="/login" className="px-6 py-2.5 bg-indigo-650 text-white rounded-2xl text-xs font-bold">
            تسجيل الدخول
          </a>
        </div>
      </div>
    )
  }

  const activeSub = await getActiveSubscription(session.id)
  const plansRes = await getSubscriptionPlans()
  const plans = plansRes.plans || []

  // Count monthly AI usage
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const aiMessageCount = await prisma.aiMessage.count({
    where: {
      conversation: { userId: session.id },
      role: "user",
      createdAt: { gte: startOfMonth }
    }
  })

  // Count current course enrollments
  const enrollmentCount = await prisma.enrollment.count({
    where: { userId: session.id }
  })

  // Fetch student invoices
  const invoices = await prisma.invoice.findMany({
    where: { userId: session.id },
    include: { payment: true },
    orderBy: { createdAt: "desc" }
  })

  // Fetch refund requests
  const refundRequests = await prisma.refund.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" }
  })

  // Server actions for form calls
  async function handleSubscribe(formData: FormData) {
    "use server"
    const planId = formData.get("planId") as string
    const res = await subscribeToPlan(planId, false)
    if (res.success) {
      revalidatePath("/dashboard/student/subscription")
      revalidatePath("/dashboard/student")
    }
  }

  async function handleCancel(formData: FormData) {
    "use server"
    const subId = formData.get("subscriptionId") as string
    if (subId) {
      await cancelSubscription(subId)
      revalidatePath("/dashboard/student/subscription")
    }
  }

  async function handleRequestRefund(formData: FormData) {
    "use server"
    const paymentId = formData.get("paymentId") as string
    const reason = formData.get("reason") as string
    if (paymentId && reason) {
      await requestRefund(paymentId, reason)
      revalidatePath("/dashboard/student/subscription")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* <Navbar /> */}

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* <StudentSidebar /> */}

        {/* Dashboard Content */}
        <main className="flex-1 text-right space-y-8" dir="rtl">
          {/* Status Messages */}
          {message && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-emerald-800 dark:text-emerald-450 text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-800 dark:text-rose-405 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Active Subscription Summary */}
          {activeSub ? (
            <div className="p-6 rounded-3xl border border-indigo-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden space-y-6">
              {/* Glow decoration */}
              <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-indigo-150/40 text-indigo-700 dark:text-indigo-400">
                    خطة نشطة حالياً
                  </span>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-2">
                    الخطة الحالية: {activeSub.plan.name}
                  </h2>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    بدأ الاشتراك في: {new Date(activeSub.startDate).toLocaleDateString("ar-EG")} | ينتهي في: {new Date(activeSub.endDate).toLocaleDateString("ar-EG")}
                  </p>
                </div>
                
                {/* Cancel form */}
                {activeSub.status !== "CANCELLED" && (
                  <form action={handleCancel}>
                    <input type="hidden" name="subscriptionId" value={activeSub.id} />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
                    >
                      إلغاء الاشتراك التلقائي
                    </button>
                  </form>
                )}
              </div>

              {/* Usage quotas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* AI Assistant messages quota */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-slate-350">
                    <span>استهلاك المساعد الذكي</span>
                    <span>{aiMessageCount} / {activeSub.plan.maxAiTokens === 999999 ? "∞" : activeSub.plan.maxAiTokens} رسالة</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${activeSub.plan.maxAiTokens === 999999 ? 5 : Math.min(100, (aiMessageCount / activeSub.plan.maxAiTokens) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Enrolled Courses limits */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-slate-350">
                    <span>الحد الأقصى للمقررات النشطة</span>
                    <span>{enrollmentCount} / {activeSub.plan.maxCourses === 0 ? "∞" : activeSub.plan.maxCourses} دورة</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${activeSub.plan.maxCourses === 0 ? 5 : Math.min(100, (enrollmentCount / activeSub.plan.maxCourses) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Free / Trial Invitation Banner */
            <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-150/40 space-y-4">
              <h2 className="text-xl font-extrabold text-indigo-900 dark:text-indigo-400">
                لا يوجد لديك اشتراك نشط حالياً
              </h2>
              <p className="text-sm text-slate-650 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                أنت تستمتع بالمنصة حالياً على الخطة المجانية بحدود محدودة. قم بالترقية للخطط المدفوعة أو تفعيل فترة تجريبية مجانية مدتها 7 أيام لاستكشاف كافة إمكانيات المساعد التعليمي الذكي.
              </p>
            </div>
          )}

          {/* Pricing Grid plans */}
          <div className="space-y-6">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">خطط الاشتراك المتاحة</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((p) => {
                const isActive = activeSub?.planId === p.id
                return (
                  <div
                    key={p.id}
                    className={`p-6 rounded-3xl border bg-white dark:bg-slate-900 flex flex-col justify-between space-y-6 shadow-sm relative overflow-hidden transition-all hover:shadow-lg ${
                      isActive 
                        ? "border-indigo-500 ring-2 ring-indigo-500/20" 
                        : "border-gray-205 dark:border-slate-800/80"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-0 left-0 bg-indigo-500 text-white text-[9px] font-bold px-3 py-0.5 rounded-br-2xl">
                        الخطة الحالية
                      </span>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-base font-extrabold text-gray-950 dark:text-white">{p.name}</h3>
                      <p className="text-[11px] text-gray-400 leading-relaxed min-h-[44px]">{p.description}</p>
                      
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">${p.price}</span>
                        <span className="text-xs text-gray-400 font-medium">/شهرياً</span>
                      </div>

                      <ul className="space-y-2 text-xs font-semibold text-gray-600 dark:text-slate-400 border-t border-gray-100 dark:border-slate-850 pt-4">
                        <li className="flex items-center gap-2">
                          <Layers className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                          <span>أقصى حد للدورات: {p.maxCourses === 0 ? "غير محدود" : `${p.maxCourses} دورات`}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Sparkles className="h-4.5 w-4.5 text-violet-500 shrink-0" />
                          <span>المساعد الذكي: {p.maxAiTokens === 0 ? "غير متاح" : p.maxAiTokens === 999999 ? "غير محدود" : `${p.maxAiTokens} رسالة`}</span>
                        </li>
                      </ul>
                    </div>

                    <form action={handleSubscribe}>
                      <input type="hidden" name="planId" value={p.id} />
                      <button
                        type="submit"
                        disabled={isActive || p.price === 0}
                        className={`w-full py-2.5 rounded-2xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
                          isActive
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                            : p.price === 0
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-850 dark:text-slate-300"
                              : "bg-indigo-650 hover:bg-indigo-750 text-white shadow-indigo-600/10 hover:shadow-indigo-600/20"
                        }`}
                      >
                        {isActive ? "مفعلة" : p.price === 0 ? "الخطة الأساسية" : "اشترك الآن"}
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Billing & Invoice History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Invoice list */}
            <div className="p-6 rounded-3xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                سجل الفواتير والمدفوعات
              </h2>

              {invoices.length === 0 ? (
                <p className="text-xs text-gray-400 italic">لا يوجد أي فواتير صادرة لحسابك حتى الآن.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-850 overflow-y-auto max-h-80">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="py-3.5 flex items-center justify-between text-right gap-4">
                      <div>
                        <p className="font-extrabold text-xs text-gray-950 dark:text-white">{inv.invoiceNumber}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">التاريخ: {new Date(inv.createdAt).toLocaleDateString("ar-EG")}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">${inv.total}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          inv.payment.status === "PAID" 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450" 
                            : inv.payment.status === "REFUNDED"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-red-500/10 text-red-650"
                        }`}>
                          {inv.payment.status === "PAID" ? "مدفوعة" : inv.payment.status === "REFUNDED" ? "مسترجعة" : "فاشلة"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Refund disputes */}
            <div className="p-6 rounded-3xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Ban className="h-5 w-5 text-rose-500" />
                طلبات الاسترجاع
              </h2>

              {/* Form to submit refund */}
              <form action={handleRequestRefund} className="space-y-4 text-right">
                <div>
                  <label className="text-xs font-bold text-gray-500">اختر الفاتورة المؤهلة</label>
                  <select
                    name="paymentId"
                    className="w-full mt-1.5 px-4 py-2.5 rounded-2xl text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
                  >
                    <option value="">-- اختر معاملة صالحة --</option>
                    {invoices.filter(inv => inv.payment.status === "PAID").map((inv) => (
                      <option key={inv.paymentId} value={inv.paymentId}>
                        {inv.invoiceNumber} - بقيمة ${inv.total}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500">سبب الاسترجاع</label>
                  <textarea
                    name="reason"
                    rows={3}
                    placeholder="يرجى كتابة سبب رغبتك في استرجاع المبلغ بالتفصيل..."
                    className="w-full mt-1.5 px-4 py-2.5 rounded-2xl text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
                >
                  تقديم طلب استرجاع
                </button>
              </form>

              {/* List of past request refunds */}
              {refundRequests.length > 0 && (
                <div className="border-t border-gray-150/60 dark:border-slate-800 pt-4 space-y-3">
                  <p className="text-xs font-bold text-gray-500">حالات طلباتك الحالية</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {refundRequests.map((ref) => (
                      <div key={ref.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-150 dark:border-slate-850 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">مبلغ: ${ref.amount}</p>
                          <p className="text-[10px] text-gray-400 mt-1">السبب: {ref.reason}</p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          ref.status === "APPROVED" 
                            ? "bg-emerald-500/10 text-emerald-600" 
                            : ref.status === "REJECTED"
                              ? "bg-red-500/10 text-red-650"
                              : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {ref.status === "APPROVED" ? "مقبول" : ref.status === "REJECTED" ? "مرفوض" : "قيد المراجعة"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* <Footer /> */}
    </div>
  )
}
