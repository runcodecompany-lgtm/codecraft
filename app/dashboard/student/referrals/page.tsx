// app/dashboard/student/referrals/page.tsx
import React from "react"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { getMyAffiliateEarnings, getOrCreateAffiliateLink } from "@/actions/affiliate"
import { revalidatePath } from "next/cache"
import { Users, Link2, Coins, DollarSign, Award, CheckCircle, ArrowUpRight, Copy, Share2 } from "lucide-react"
import StudentSidebar from "@/components/student-sidebar"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const dynamic = "force-dynamic"

export default async function StudentReferralsPage() {
  const session = await getServerSession()
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border shadow-md max-w-sm">
          <p className="font-bold mb-4">يجب تسجيل الدخول لمشاهدة هذه الصفحة.</p>
          <a href="/login" className="px-6 py-2.5 bg-indigo-650 text-white rounded-2xl text-xs font-bold">
            تسجيل الدخول
          </a>
        </div>
      </div>
    )
  }

  // Fetch affiliate info
  const affRes = await getMyAffiliateEarnings()
  const stats = affRes.stats || { totalClicks: 0, confirmedCommissions: 0, pendingCommissions: 0, salesCount: 0 }
  const commissions = affRes.commissions || []

  // Fetch user referral details
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { referralCode: true }
  })

  const referralCode = user?.referralCode || ""

  // Fetch invited friends list
  const referrals = await prisma.user.findMany({
    where: { referredById: session.id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      xp: true,
      role: true
    },
    orderBy: { createdAt: "desc" }
  })

  // Fetch published paid courses to allow generating affiliate links
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      price: { gt: 0 }
    },
    select: {
      id: true,
      title: true,
      price: true
    }
  })

  // Fetch existing affiliate links for this user
  const affiliateLinks = await prisma.affiliateLink.findMany({
    where: { userId: session.id }
  })

  // Server action to generate an affiliate link
  async function handleGenerateAffiliate(formData: FormData) {
    "use server"
    const courseId = formData.get("courseId") as string
    if (courseId) {
      await getOrCreateAffiliateLink(courseId)
      revalidatePath("/dashboard/student/referrals")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* <Navbar /> */}

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* <StudentSidebar /> */}

        {/* Page content */}
        <main className="flex-1 text-right space-y-8" dir="rtl">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">التسويق بالعمولة ودعوة الأصدقاء</h1>
            <p className="text-xs text-gray-400 font-medium mt-1">
              شارك المنصة والدورات مع زملائك واكسب أرباحاً مالية وعملات Craft Coins عند انضمامهم وشراء المحتوى.
            </p>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl border border-indigo-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden space-y-2">
              <p className="text-xs font-bold text-gray-400">إجمالي النقرات</p>
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-indigo-500" />
                <span className="text-2xl font-black">{stats.totalClicks}</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-indigo-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden space-y-2">
              <p className="text-xs font-bold text-gray-400">المدعوين النشطين</p>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-500" />
                <span className="text-2xl font-black">{referrals.length} صديق</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-indigo-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden space-y-2">
              <p className="text-xs font-bold text-gray-400">الأرباح المؤكدة (USD)</p>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450">${stats.confirmedCommissions}</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-indigo-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden space-y-2">
              <p className="text-xs font-bold text-gray-400">العمولات المعلقة (USD)</p>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-black text-amber-600 dark:text-amber-505">${stats.pendingCommissions}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Invite friends section */}
            <div className="p-6 rounded-3xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-650" />
                دعوة الأصدقاء ومكافآت الإحالة
              </h2>

              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150/40 text-xs font-medium space-y-3">
                <p className="font-bold text-indigo-900 dark:text-indigo-400">كيف تعمل المكافأة؟</p>
                <ul className="list-disc list-inside space-y-1 text-slate-650 dark:text-slate-400">
                  <li>شارك كود الدعوة أو الرابط المباشر مع أصدقائك.</li>
                  <li>عند قيامهم بالتسجيل، يحصلون على مكافأة ترحيبية.</li>
                  <li>عند إتمامهم لثلاثة دروس على المنصة، ستحصل تلقائياً على <strong>500 عملة Craft Coins</strong>.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500">كود الإحالة الخاص بك</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="text"
                      readOnly
                      value={referralCode}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-mono font-bold text-center bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500">رابط الدعوة المباشر</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="text"
                      readOnly
                      value={`http://localhost:3000/register?ref=${referralCode}`}
                      className="w-full px-4 py-2.5 rounded-2xl text-xs font-mono text-left bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Invited friends list */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-850">
                <h3 className="text-xs font-bold text-gray-500">الأصدقاء الذين انضموا عبر دعوتك ({referrals.length})</h3>
                {referrals.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">لم يسجل أي صديق عبر رابطك حتى الآن.</p>
                ) : (
                  <div className="divide-y divide-gray-150 dark:divide-slate-850 max-h-40 overflow-y-auto">
                    {referrals.map((friend) => (
                      <div key={friend.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-300">{friend.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">انضم في: {new Date(friend.createdAt).toLocaleDateString("ar-EG")}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                          {friend.xp} XP
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Affiliate Course Links generator */}
            <div className="p-6 rounded-3xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-indigo-650" />
                التسويق بالعمولة للدورات (10% عمولة)
              </h2>

              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-150/40 text-xs font-medium">
                <p className="font-bold text-emerald-900 dark:text-emerald-450">اربح عمولة نقدية!</p>
                <p className="text-slate-650 dark:text-slate-400 mt-1 leading-relaxed">
                  أنشئ روابط تسويقية للدورات المدفوعة بالمنصة. عندما يقوم أي شخص بشراء الدورة عبر رابطك المخصص، ستحصل فوراً على <strong>10% من سعر الدورة نقدياً</strong> تُدفع إلى محفظتك!
                </p>
              </div>

              {/* Form to generate link */}
              <form action={handleGenerateAffiliate} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500">اختر الدورة التدريبية</label>
                  <div className="flex gap-2 mt-1.5">
                    <select
                      name="courseId"
                      className="flex-1 px-4 py-2.5 rounded-2xl text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 focus:outline-none"
                    >
                      <option value="">-- اختر دورة --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} - (${c.price})
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-2xl cursor-pointer"
                    >
                      إنشاء رابط
                    </button>
                  </div>
                </div>
              </form>

              {/* Generated Links list */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-850">
                <h3 className="text-xs font-bold text-gray-500">روابطك التسويقية النشطة ({affiliateLinks.length})</h3>
                {affiliateLinks.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">لا توجد روابط تسويقية حالية. قم بإنشاء رابط أعلاه.</p>
                ) : (
                  <div className="divide-y divide-gray-150 dark:divide-slate-850 max-h-40 overflow-y-auto">
                    {affiliateLinks.map((link) => {
                      const associatedCourse = courses.find((c) => c.id === link.courseId)
                      return (
                        <div key={link.id} className="py-2.5 flex items-center justify-between text-xs gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-slate-800 dark:text-slate-350 truncate">
                              {associatedCourse?.title || "رابط للمنصة الرئيسية"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                              http://localhost:3000/courses/marketplace?aff={link.code}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400">
                              {link.clicks} نقرة
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Commissions list */}
          <div className="p-6 rounded-3xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-3">سجل أرباح العمولات</h2>
            {commissions.length === 0 ? (
              <p className="text-xs text-gray-400 italic">لا توجد أي عمولات مسجلة لحسابك بعد.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-105 dark:border-slate-800 font-bold text-gray-400">
                      <th className="py-3 px-4">الدورة المباعة</th>
                      <th className="py-3 px-4">مبلغ العمولة</th>
                      <th className="py-3 px-4">تاريخ البيع</th>
                      <th className="py-3 px-4 text-left">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-850 font-medium">
                    {commissions.map((comm) => (
                      <tr key={comm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-extrabold">
                          {comm.purchase?.course.title || "دورة تعليمية"}
                        </td>
                        <td className="py-3 px-4 text-emerald-600 font-bold">${comm.amount}</td>
                        <td className="py-3 px-4 text-gray-400">{new Date(comm.createdAt).toLocaleDateString("ar-EG")}</td>
                        <td className="py-3 px-4 text-left">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            comm.status === "PAID" 
                              ? "bg-emerald-500/10 text-emerald-600" 
                              : comm.status === "PENDING"
                                ? "bg-amber-500/10 text-amber-600 animate-pulse"
                                : "bg-red-500/10 text-red-600"
                          }`}>
                            {comm.status === "PAID" ? "مدفوعة" : comm.status === "PENDING" ? "معلقة (ضمان 14 يوم)" : "ملغاة"}
                          </span>
                        </td>
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
