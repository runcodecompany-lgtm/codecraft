import React from "react"
import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import {
  Sparkles, BookOpen, Users, HelpCircle, Star,
  Percent, FileText, ArrowLeft, MessageSquare, CheckCircle,
  TrendingUp, Award, Clock
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TeacherDashboardPage() {
  const session = await getServerSession()

  // Guard authentication
  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    redirect("/login?unauthorized=true")
  }

  // Fetch teacher profile
  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.id }
  })

  // Fetch courses owned by teacher (Admin can see all, Teacher only their own)
  const isSystemAdmin = session.role === "ADMIN"
  const courses = await prisma.course.findMany({
    where: isSystemAdmin ? {} : { teacherId: session.id },
    select: { id: true, title: true }
  })

  const courseIds = courses.map(c => c.id)

  // Fetch modules and lessons
  const modules = await prisma.module.findMany({
    where: { courseId: { in: courseIds } },
    select: { id: true }
  })
  const moduleIds = modules.map(m => m.id)

  const lessons = await prisma.lesson.findMany({
    where: { moduleId: { in: moduleIds } },
    select: { id: true }
  })

  // Quizzes count
  const quizCount = await prisma.quiz.count({
    where: { moduleId: { in: moduleIds } }
  })

  // Enrollments and completion calculations
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds } }
  })

  const totalStudents = enrollments.length
  const completedEnrollmentsCount = enrollments.filter(e => e.isCompleted).length
  const completionRate = totalStudents > 0
    ? Math.round((completedEnrollmentsCount / totalStudents) * 100)
    : 0

  // Fetch reviews and calculate average rating
  const reviews = await prisma.review.findMany({
    where: { courseId: { in: courseIds } }
  })

  const totalReviews = reviews.length
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "4.9"

  // Recent enrollments
  const recentEnrollments = await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      user: { select: { name: true, avatar: true, email: true } },
      course: { select: { title: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 5
  })

  // Recent reviews
  const recentReviews = await prisma.review.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      user: { select: { name: true, avatar: true } },
      course: { select: { title: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 5
  })

  // Most active courses
  const mostActiveCourses = await prisma.course.findMany({
    where: isSystemAdmin ? {} : { teacherId: session.id },
    include: {
      enrollments: { select: { id: true, isCompleted: true } },
      _count: { select: { enrollments: true } }
    },
    orderBy: { enrollments: { _count: "desc" } },
    take: 5
  })

  // Student growth over time (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const growthData = await prisma.enrollment.findMany({
    where: {
      courseId: { in: courseIds },
      createdAt: { gte: sixMonthsAgo }
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" }
  })

  // Group enrollments by month for growth chart
  const monthlyGrowth: Record<string, number> = {}
  growthData.forEach(enr => {
    const monthKey = enr.createdAt.toLocaleDateString("ar-EG", { month: "short", year: "numeric" })
    monthlyGrowth[monthKey] = (monthlyGrowth[monthKey] || 0) + 1
  })
  const growthLabels = Object.keys(monthlyGrowth)
  const growthValues = Object.values(monthlyGrowth)

  // Recent quiz attempts
  const quizzes = await prisma.quiz.findMany({
    where: { moduleId: { in: moduleIds } },
    select: { id: true }
  })
  const quizIds = quizzes.map(q => q.id)

  const recentQuizAttempts = await prisma.quizAttempt.findMany({
    where: { quizId: { in: quizIds } },
    include: {
      user: { select: { name: true } },
      quiz: { select: { title: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 5
  })

  // Stats definition for loop
  const stats = [
    { name: "إجمالي الطلاب", value: `+${totalStudents}`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "الدورات المنشورة", value: courses.length, icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { name: "الدروس المفعلة", value: lessons.length, icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "الاختبارات التفاعلية", value: quizCount, icon: HelpCircle, color: "text-violet-500", bg: "bg-violet-500/10" },
    { name: "متوسط تقييم الطلاب", value: `${averageRating} / 5.0`, icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
    { name: "معدل الإكمال المنجز", value: `${completionRate}%`, icon: Percent, color: "text-rose-500", bg: "bg-rose-500/10" },
  ]

  return (
    <div className="space-y-8" dir="rtl">

      {/* Welcome banner */}
      <div className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div className="flex items-center gap-4 text-center md:text-right flex-col md:flex-row">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-black text-2xl text-white shadow-md shadow-indigo-500/10">
              {session.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.avatar} alt={session.name || ""} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                (session.name || "T").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
                <Sparkles className="h-3 w-3" />
                <span>لوحة التحكم الرئيسية</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">أهلاً بك، أ. {session.name}</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{profile?.title || "معلم ومطور مناهج برمجية معتمد"}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/teacher/courses/new"
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-gradient-to-l from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-md hover:scale-[1.02] transition-all"
            >
              <span>إنشاء دورة جديدة</span>
            </Link>
            <Link
              href="/dashboard/teacher/profile"
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
            >
              <span>تعديل السيرة الذاتية</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-950 p-5 space-y-3 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-1">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-bold">{stat.name}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Activity and Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Recent Registrations & Achievements */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent Enrollments */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-indigo-500" />
              <span>آخر الطلاب المسجلين</span>
            </h2>

            {recentEnrollments.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400 italic">
                لا يوجد طلاب مسجلون حالياً في دوراتك.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-900">
                {recentEnrollments.map((enr) => (
                  <div key={enr.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-bold text-sm text-indigo-500 shrink-0">
                        {enr.user.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={enr.user.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          (enr.user.name || "S").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">{enr.user.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">سجل في: {enr.course.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/5 px-2.5 py-1 rounded-full">
                        <Percent className="w-3 h-3" />
                        <span>تقدم: {Math.round(enr.progress)}%</span>
                      </span>
                      <span className="block text-[9px] text-gray-400 mt-1">
                        {new Date(enr.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Quiz Attempts */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span>آخر محاولات الاختبارات</span>
            </h2>

            {recentQuizAttempts.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400 italic">
                لا توجد محاولات اختبارات مسجلة بعد.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-900">
                {recentQuizAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">{attempt.user.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">اختبار: {attempt.quiz.title}</p>
                    </div>
                    <div className="text-left">
                      <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full ${attempt.isPassed
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-450"
                        }`}>
                        <span>الدرجة: {attempt.score} / {attempt.total} ({attempt.percentage}%)</span>
                      </span>
                      <span className="block text-[9px] text-gray-400 mt-1">
                        {new Date(attempt.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Most Active Courses & Growth */}
        <div className="space-y-6">

          {/* Most Active Courses */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span>أكثر الدورات نشاطاً</span>
            </h2>

            {mostActiveCourses.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400 italic">
                لا توجد بيانات كافية بعد.
              </div>
            ) : (
              <div className="space-y-3">
                {mostActiveCourses.map((course, idx) => {
                  const completedCount = course.enrollments.filter(e => e.isCompleted).length
                  const totalEnrolled = course._count.enrollments
                  const completionPercent = totalEnrolled > 0 ? Math.round((completedCount / totalEnrolled) * 100) : 0

                  return (
                    <div key={course.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-400 w-5">{idx + 1}</span>
                        <div>
                          <h4 className="font-extrabold text-xs text-gray-900 dark:text-white leading-tight">{course.title}</h4>
                          <span className="text-[9px] text-gray-400">{totalEnrolled} طالب • {completionPercent}% إكمال</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{totalEnrolled}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Growth Chart (simple bar chart using divs) */}
          {growthLabels.length > 0 && (
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <ArrowLeft className="w-5 h-5 text-emerald-500" />
                <span>نمو الطلاب (آخر 6 أشهر)</span>
              </h2>
              <div className="flex items-end gap-2 h-40">
                {growthValues.map((value, idx) => {
                  const maxVal = Math.max(...growthValues, 1)
                  const heightPercent = (value / maxVal) * 100
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">{value}</span>
                      <div
                        className="w-full rounded-lg bg-gradient-to-t from-indigo-500 to-indigo-400 transition-all"
                        style={{ height: `${heightPercent}%`, minHeight: "8px" }}
                      />
                      <span className="text-[7px] text-gray-400 text-center leading-tight">{growthLabels[idx]}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}


          {/* Right Column Original: Recent Reviews */}
          <div className="space-y-6">

            {/* Recent Reviews Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-500" />
                  <span>أحدث تقييمات الطلاب</span>
                </h2>
                <Link href="/dashboard/teacher/reviews" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  عرض الكل
                </Link>
              </div>

              {recentReviews.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-400 italic flex-grow flex items-center justify-center">
                  لا توجد تقييمات مضافة بعد.
                </div>
              ) : (
                <div className="space-y-4 flex-grow overflow-y-auto max-h-[400px]">
                  {recentReviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-gray-50/50 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-900 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-500 shrink-0">
                            {rev.user.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={rev.user.avatar} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              (rev.user.name || "S").charAt(0).toUpperCase()
                            )}
                          </div>
                          <h4 className="font-extrabold text-xs text-gray-900 dark:text-white">{rev.user.name}</h4>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-slate-350 leading-relaxed font-medium">"{rev.comment}"</p>
                      <div className="flex justify-between items-center text-[9px] text-gray-400 pt-1 border-t border-gray-100 dark:border-slate-800/80">
                        <span>دورة: {rev.course.title}</span>
                        <span>{new Date(rev.createdAt).toLocaleDateString("ar-EG")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
