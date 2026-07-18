// app/dashboard/teacher/earnings/page.tsx
import React from "react"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { getTeacherWallet, requestPayout } from "@/actions/financial"
import { revalidatePath } from "next/cache"
import { Wallet, Coins, Landmark, Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import TeacherSidebar from "@/components/teacher-sidebar"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const dynamic = "force-dynamic"

export default async function TeacherEarningsPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const searchParams = await props.searchParams
  const errorMsg = searchParams.error
  const successMsg = searchParams.success

  const session = await getServerSession()
  if (!session || session.role !== "TEACHER") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border shadow-md max-w-sm">
          <p className="font-bold mb-4">غير مصرح لك بدخول لوحة أرباح المعلم.</p>
          <a href="/" className="px-6 py-2.5 bg-indigo-650 text-white rounded-2xl text-xs font-bold">
            الرئيسية
          </a>
        </div>
      </div>
    )
  }

  const walletRes = await getTeacherWallet(session.id)
  const wallet = walletRes.wallet || { currentBalance: 0, pendingBalance: 0, confirmedEarnings: 0 }
  const payouts = walletRes.payouts || []

  // Fetch recent sales of courses owned by this teacher
  const recentSales = await prisma.purchase.findMany({
    where: {
      course: { teacherId: session.id }
    },
    include: {
      user: {
        select: { name: true, email: true }
      },
      course: {
        select: { title: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 10
  })

  // Server action to handle requesting payout
  async function handleRequestPayout(formData: FormData) {
    "use server"
    const amountVal = Number(formData.get("amount"))
    const method = formData.get("method") as string
    const details = formData.get("details") as string

    if (!amountVal || amountVal <= 0) {
      revalidatePath("/dashboard/teacher/earnings?error=المبلغ المدخل غير صحيح.")
      return
    }

    const res = await requestPayout(amountVal, method, details)
    if (res.success) {
      revalidatePath("/dashboard/teacher/earnings?success=تم إرسال طلب السحب بنجاح.")
    } else {
      revalidatePath(`/dashboard/teacher/earnings?error=${res.error}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* <Navbar /> */}

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* <TeacherSidebar /> */}

        {/* Content */}
        <main className="flex-1 text-right space-y-8" dir="rtl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">الأرباح والمحفظة المالية</h1>
              <p className="text-xs text-gray-400 font-medium mt-1">تتبع مبيعات مقرراتك، الأرباح المستحقة، وإدارة طلبات السحب الخاصة بك.</p>
            </div>
          </div>

          {/* Status alerts */}
          {successMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-emerald-800 dark:text-emerald-450 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-800 dark:text-rose-405 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Balance Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Cleared Balance */}
            <div className="p-6 rounded-3xl border border-emerald-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-2 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-16 w-16 bg-emerald-500/5 rounded-full blur-xl" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">الرصيد المتاح للسحب</p>
              <div className="flex items-center gap-2">
                <Wallet className="h-6 w-6 text-emerald-500" />
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">${wallet.currentBalance}</span>
              </div>
            </div>

            {/* Pending Balance */}
            <div className="p-6 rounded-3xl border border-amber-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-2 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-16 w-16 bg-amber-500/5 rounded-full blur-xl" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">الأرباح المعلقة (تحت الضمان)</p>
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-amber-500" />
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">${wallet.pendingBalance}</span>
              </div>
            </div>

            {/* Confirmed Earnings */}
            <div className="p-6 rounded-3xl border border-indigo-150 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-2 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-16 w-16 bg-indigo-500/5 rounded-full blur-xl" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">إجمالي الأرباح المؤكدة</p>
              <div className="flex items-center gap-2">
                <Coins className="h-6 w-6 text-indigo-650" />
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">${wallet.confirmedEarnings}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payout Withdrawal Form */}
            <div className="p-6 rounded-3xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Landmark className="h-5 w-5 text-indigo-600" />
                طلب سحب أرباح
              </h2>

              <form action={handleRequestPayout} className="space-y-4 text-right">
                <div>
                  <label className="text-xs font-bold text-gray-500">المبلغ المطلوب سحبه (USD)</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    max={wallet.currentBalance}
                    placeholder="أدخل مبلغ السحب..."
                    className="w-full mt-1.5 px-4 py-2.5 rounded-2xl text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500">طريقة الدفع</label>
                  <select
                    name="method"
                    className="w-full mt-1.5 px-4 py-2.5 rounded-2xl text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
                  >
                    <option value="PAYPAL">PayPal</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="STRIPE">Stripe Connect</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500">تفاصيل الحساب المالي</label>
                  <textarea
                    name="details"
                    rows={3}
                    placeholder="مثال: بريدك في PayPal أو رقم الآيبان والبنك للحوالات..."
                    className="w-full mt-1.5 px-4 py-2.5 rounded-2xl text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={wallet.currentBalance <= 0}
                  className={`w-full py-3 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer ${
                    wallet.currentBalance <= 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  إرسال طلب السحب
                </button>
              </form>
            </div>

            {/* Payout Logs */}
            <div className="p-6 rounded-3xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-3">سجل طلبات السحب السابقة</h2>
              
              {payouts.length === 0 ? (
                <p className="text-xs text-gray-400 italic">لا توجد طلبات سحب سابقة لحسابك.</p>
              ) : (
                <div className="divide-y divide-gray-150 dark:divide-slate-850 max-h-[300px] overflow-y-auto">
                  {payouts.map((p) => (
                    <div key={p.id} className="py-3.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-extrabold text-slate-700 dark:text-slate-350">مبلغ السحب: ${p.amount}</p>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(p.createdAt).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400">{p.paymentMethod}</span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          p.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : p.status === "REJECTED"
                              ? "bg-red-500/10 text-red-650"
                              : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {p.status === "APPROVED" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                          {p.status === "REJECTED" && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                          {p.status === "PENDING" && <Clock className="h-3.5 w-3.5 text-amber-500 animate-spin" />}
                          {p.status === "APPROVED" ? "مكتمل" : p.status === "REJECTED" ? "مرفوض" : "قيد المعالجة"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Sales Table */}
          <div className="p-6 rounded-3xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-3">سجل عمليات الشراء الأخيرة</h2>

            {recentSales.length === 0 ? (
              <p className="text-xs text-gray-400 italic">لا توجد مبيعات مسجلة لدوراتك بعد.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 font-bold text-gray-450">
                      <th className="py-3 px-4">الدورة</th>
                      <th className="py-3 px-4">الطالب</th>
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4 text-left">سعر البيع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-850 font-medium">
                    {recentSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-4 text-gray-900 dark:text-slate-300 font-extrabold">{sale.course.title}</td>
                        <td className="py-3 px-4">{sale.user.name}</td>
                        <td className="py-3 px-4 text-gray-400">{new Date(sale.createdAt).toLocaleDateString("ar-EG")}</td>
                        <td className="py-3 px-4 text-left text-emerald-600 dark:text-emerald-450 font-extrabold">${sale.pricePaid}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* <Footer /> */}
    </div>
  )
}
