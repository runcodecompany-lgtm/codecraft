import React from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import {
  Users, BookOpen, HelpCircle, Award, ShieldAlert, TrendingUp,
  GraduationCap, Percent, UserCheck,
  Gamepad2, Coins, Bell
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?unauthorized=true")

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
    redirect("/login?unauthorized=true")
  }

  const [totalUsers, totalStudents, totalTeachers, totalCourses,
    totalLessons, totalQuizzes, totalGames, totalCertificates] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.quiz.count(),
      prisma.gameResult.count(),
      prisma.certificate.count()
    ])

  const enrollments = await prisma.enrollment.findMany()
  const completedEnrollments = enrollments.filter(e => e.isCompleted).length
  const completionRate = enrollments.length > 0 ? Math.round((completedEnrollments / enrollments.length) * 100) : 0

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }, take: 5,
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  })

  const recentlyEnrolled = await prisma.enrollment.findMany({
    orderBy: { createdAt: "desc" }, take: 5,
    include: {
      user: { select: { name: true } },
      course: { select: { title: true } }
    }
  })

  const statsCards = [
    { name: "إجمالي المستخدمين", value: totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "الطلاب", value: totalStudents, icon: GraduationCap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "المعلمون", value: totalTeachers, icon: UserCheck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { name: "الدورات", value: totalCourses, icon: BookOpen, color: "text-violet-500", bg: "bg-violet-500/10" },
    { name: "الدروس", value: totalLessons, icon: HelpCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { name: "الاختبارات", value: totalQuizzes, icon: HelpCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
    { name: "الألعاب", value: totalGames, icon: Gamepad2, color: "text-teal-500", bg: "bg-teal-500/10" },
    { name: "الشهادات", value: totalCertificates, icon: Award, color: "text-orange-500", bg: "bg-orange-500/10" },
  ]

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">لوحة الإدارة الرئيسية</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">مرحباً بك في لوحة التحكم. يمكنك إدارة جميع أجزاء المنصة من هنا.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2 shadow-sm">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold">{stat.name}</p>
            </div>
          )
        })}
      </div>

      {/* Performance indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <Percent className="w-5 h-5" />
            <span className="font-black text-sm">معدل إكمال الدورات</span>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{completionRate}%</p>
          <p className="text-xs text-gray-400 mt-1">من أصل {enrollments.length} تسجيل</p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-black text-sm">إجمالي المعاملات</span>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{enrollments.length}</p>
          <p className="text-xs text-gray-400 mt-1">تسجيل في الدورات</p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 mb-2">
            <Bell className="w-5 h-5" />
            <span className="font-black text-sm">إجمالي الشهادات</span>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{totalCertificates}</p>
          <p className="text-xs text-gray-400 mt-1">شهادة ممنوحة</p>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-500" />
            <span>آخر المستخدمين المسجلين</span>
          </h2>
          <div className="space-y-3">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs">
                    {(u.name || "U").charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900 dark:text-white">{u.name}</p>
                    <p className="text-[9px] text-gray-400">{u.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-900 text-gray-500">
                  {u.role === "ADMIN" ? "مشرف" : u.role === "TEACHER" ? "معلم" : u.role === "STUDENT" ? "طالب" : "زائر"}
                </span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/admin/users" className="block mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-center">
            عرض جميع المستخدمين ←
          </Link>
        </div>

        {/* Recent Enrollments */}
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <span>آخر التسجيلات في الدورات</span>
          </h2>
          <div className="space-y-3">
            {recentlyEnrolled.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/40">
                <div>
                  <p className="font-bold text-xs text-gray-900 dark:text-white">{e.user.name}</p>
                  <p className="text-[9px] text-gray-400">{e.course.title}</p>
                </div>
                <span className="text-[9px] text-gray-400">{new Date(e.createdAt).toLocaleDateString("ar-EG")}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/admin/courses" className="block mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-center">
            إدارة الدورات ←
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
        <h2 className="text-base font-black text-gray-900 dark:text-white mb-4">روابط سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "المستخدمين", href: "/dashboard/admin/users", icon: Users, color: "text-blue-500" },
            { name: "المعلمون", href: "/dashboard/admin/teachers", icon: UserCheck, color: "text-indigo-500" },
            { name: "الدورات", href: "/dashboard/admin/courses", icon: BookOpen, color: "text-violet-500" },
            { name: "الشهادات", href: "/dashboard/admin/certificates", icon: Award, color: "text-orange-500" },
            { name: "العملات", href: "/dashboard/admin/coins", icon: Coins, color: "text-amber-500" },
            { name: "الإشعارات", href: "/dashboard/admin/notifications", icon: Bell, color: "text-rose-500" },
            { name: "سجل التدقيق", href: "/dashboard/admin/audit-logs", icon: ShieldAlert, color: "text-emerald-500" },
            { name: "الإعدادات", href: "/dashboard/admin/settings", icon: TrendingUp, color: "text-gray-500" },
          ].map(link => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
              >
                <Icon className={`w-4 h-4 ${link.color}`} />
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{link.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
