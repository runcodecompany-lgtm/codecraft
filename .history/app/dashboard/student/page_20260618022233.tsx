// app/dashboard/student/page.tsx
import React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import StatCard from "@/components/stat-card"
import CourseCard from "@/components/course-card"
import ProgressBar from "@/components/progress-bar"
import { 
  Trophy, 
  Flame, 
  Coins, 
  Zap, 
  BookOpen, 
  Target, 
  Sparkles,
  ArrowLeft,
  Award,
  Gamepad2,
  Brain,
  Bell,
  Clock,
  ChevronLeft,
  ArrowUpRight,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import { getDifficultyLabelWithEnglish, getTrackRoleLabel } from "@/lib/learning"

export const dynamic = "force-dynamic"

export default async function StudentDashboardPage() {
  const session = await getServerSession()

  // Guard: if user is not authenticated or not authorized, redirect
  if (!session) {
    redirect("/login")
  }

  if (session.role !== "STUDENT" && session.role !== "TEACHER" && session.role !== "ADMIN") {
    redirect("/")
  }

  // 1. Fetch student database details
  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      userTracks: {
        include: {
          track: true
        }
      },
      placementAttempts: {
        where: { trackId: { not: null } },
        orderBy: { createdAt: "desc" },
        include: {
          track: true,
        },
      },
      learningProfile: true,
      trackRecommendations: {
        include: {
          track: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      enrollments: {
        where: { isCompleted: false },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              priceInCoins: true,
              trackId: true,
              modules: {
                select: {
                  lessons: { select: { id: true } }
                }
              }
            }
          }
        },
        take: 3
      }
    }
  })

  if (!dbUser) {
    redirect("/login")
  }

  // 2. Fetch full student statistics
  const enrolledCount = await prisma.enrollment.count({
    where: { userId: session.id },
  })

  const completedCoursesCount = await prisma.enrollment.count({
    where: { userId: session.id, isCompleted: true },
  })

  const certificatesCount = await prisma.certificate.count({
    where: { userId: session.id },
  })

  const quizAttemptsCount = await prisma.quizAttempt.count({
    where: { userId: session.id, isPassed: true },
  })

  const gamesCompletedCount = await prisma.gameResult.count({
    where: { userId: session.id },
  })

  // 3. Fetch recent activities
  const recentNotifications = await prisma.notification.findMany({
    where: { userId: session.id },
    take: 4,
    orderBy: { createdAt: "desc" }
  })

  const recentTransactions = await prisma.transaction.findMany({
    where: { userId: session.id },
    take: 4,
    orderBy: { createdAt: "desc" }
  })

  const recentAchievements = await prisma.userAchievement.findMany({
    where: { userId: session.id },
    take: 4,
    orderBy: { createdAt: "desc" }
  })

  // 4. Calculate Level Up Progress
  const xpNeededForNext = dbUser.level * 100
  // Cumulative XP needed to reach next level
  const cumulativeXpForCurrent = 50 * dbUser.level * (dbUser.level - 1)
  const currentLevelXp = Math.max(0, dbUser.xp - cumulativeXpForCurrent)

  const primaryTrack = dbUser.userTracks.find(t => t.isPrimary)
  const secondaryTracks = dbUser.userTracks.filter(t => !t.isPrimary)
  
  // A user needs to take a placement test for all their tracks. We'll find tracks without an attempt.
  const attemptedTrackIds = dbUser.placementAttempts.map(p => p.trackId)
  const tracksNeedingPlacement = dbUser.userTracks.filter(t => !attemptedTrackIds.includes(t.trackId))
  const recommendationsByTrack = new Map<string, typeof dbUser.trackRecommendations>()
  dbUser.trackRecommendations.forEach((recommendation) => {
    const items = recommendationsByTrack.get(recommendation.trackId) || []
    items.push(recommendation)
    recommendationsByTrack.set(recommendation.trackId, items)
  })

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      {/* ── 1. Placement Test Prompt Banner ─────────────────────── */}
      {tracksNeedingPlacement.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-violet-200/80 dark:border-violet-950/40 bg-gradient-to-l from-violet-600 via-indigo-700 to-indigo-900 p-6 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-violet-400/20 blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
                بداية مخصصة ومكافأة مميزة
              </span>
              <h3 className="font-extrabold text-lg">حدد مستواك في مساراتك التعليمية!</h3>
              <p className="text-xs text-indigo-100 leading-relaxed max-w-xl">
                لديك {tracksNeedingPlacement.length} مسار بحاجة لاختبار تحديد مستوى. أجرِ الاختبار الآن ليقترح لك النظام المحتوى الأنسب لقدراتك في كل مسار!
              </p>
            </div>
            <Link
              href="/dashboard/student/placement"
              className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-xs font-black text-slate-900 transition-all shadow-md self-start sm:self-center flex items-center gap-1.5"
            >
              <span>ابدأ الاختبار الآن</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      )}

      {/* ── 2. Welcome & Hero Info ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100/80 dark:border-indigo-950/40 bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 border border-white/10 flex items-center justify-center text-2xl font-black text-white shadow-inner flex-shrink-0">
              {dbUser.avatar ? (
                <img src={dbUser.avatar} alt="Avatar" className="h-full w-full object-cover rounded-2xl" />
              ) : (
                (dbUser.name || "ط").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
              )}
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-[10px] font-bold">
                <Sparkles className="h-3 w-3" />
                <span>رتبة: صانع كود ناشئ</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                أهلاً بك، {dbUser.name}! 👋
              </h1>
              {dbUser.userTracks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {dbUser.userTracks.map(t => (
                    <span key={t.id} className="text-indigo-200 text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                      {t.track.name}: {getDifficultyLabelWithEnglish(t.level)} {t.isPrimary && '⭐'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Level Progress Circle / Indicator */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md self-start lg:self-center">
            <div className="relative flex items-center justify-center h-14 w-14 rounded-xl bg-indigo-600/90 text-white shadow-inner">
              <div className="text-center">
                <p className="text-[9px] font-bold uppercase opacity-85">مستوى</p>
                <p className="text-xl font-black">{dbUser.level}</p>
              </div>
            </div>
            
            <div className="space-y-1.5 w-44 md:w-52">
              <div className="flex justify-between text-[10px] font-bold text-indigo-200">
                <span>نقاط الخبرة</span>
                <span>{currentLevelXp} / {xpNeededForNext}</span>
              </div>
              <ProgressBar 
                value={currentLevelXp} 
                max={xpNeededForNext} 
                showLabel={false}
                colorClass="bg-gradient-to-r from-cyan-400 to-indigo-400"
                bgClass="bg-white/10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. General Statistics ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard 
          title="الدورات المسجلة"
          value={enrolledCount}
          description="مقررات دراسية مسجلة"
          icon={BookOpen}
          iconColorClass="text-indigo-500"
          gradientClass="from-indigo-500/20 to-violet-500/20"
        />
        <StatCard 
          title="الدورات المنجزة"
          value={completedCoursesCount}
          description="مقررات مكتملة 100%"
          icon={Trophy}
          iconColorClass="text-emerald-500"
          gradientClass="from-emerald-500/20 to-teal-500/20"
        />
        <StatCard 
          title="الشهادات الصادرة"
          value={certificatesCount}
          description="شهادة إتمام معتمدة"
          icon={Award}
          iconColorClass="text-violet-500"
          gradientClass="from-violet-500/20 to-fuchsia-500/20"
        />
        <StatCard 
          title="الاختبارات الناجحة"
          value={quizAttemptsCount}
          description="اختبارات منجزة بنجاح"
          icon={Brain}
          iconColorClass="text-cyan-500"
          gradientClass="from-cyan-500/20 to-teal-500/20"
        />
        <StatCard 
          title="الألعاب المكتملة"
          value={gamesCompletedCount}
          description="تحديات ساحة البرمجة"
          icon={Gamepad2}
          iconColorClass="text-orange-500"
          gradientClass="from-orange-500/20 to-red-500/20"
        />
      </div>

      {/* ── 4. Current Coins & Streak ────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/80 shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">الرصيد المالي للعملات</span>
            <h3 className="text-2xl font-black text-amber-500 flex items-center gap-1.5">
              <Coins className="w-6 h-6" />
              <span>{dbUser.craftCoins.toLocaleString("ar")} CC</span>
            </h3>
          </div>
          <Link
            href="/dashboard/student/wallet"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            المحفظة الرقمية
          </Link>
        </div>

        <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/80 shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">شعلة التعلم المتصل</span>
            <h3 className="text-2xl font-black text-orange-500 flex items-center gap-1.5">
              <Flame className="w-6 h-6 animate-pulse" />
              <span>{dbUser.streakCount} أيام متتالية</span>
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">ادخل يومياً للحفاظ على الشعلة!</span>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">نظرة عامة على مسارات التعلم</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              يتم تتبع المستوى والتقدم والتوصيات لكل مسار بشكل مستقل.
            </p>
          </div>
          <Link
            href="/dashboard/student/profile"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400"
          >
            إدارة المسارات والأهداف
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {dbUser.userTracks.map((track) => (
            <div key={track.id} className="rounded-2xl border border-gray-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white">{track.track.name}</h3>
                  <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {getTrackRoleLabel(track.isPrimary)}
                  </p>
                </div>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                  {getDifficultyLabelWithEnglish(track.level)}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>تقدم المسار</span>
                  <span>{Math.round(track.progress)}%</span>
                </div>
                <ProgressBar
                  value={track.progress}
                  max={100}
                  showLabel={false}
                  colorClass="bg-gradient-to-r from-indigo-500 to-violet-500"
                />
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">التوصيات المرتبطة بهذا المسار</p>
                {recommendationsByTrack.get(track.trackId)?.slice(0, 2).map((recommendation) => (
                  <Link
                    key={recommendation.id}
                    href={`/courses/${recommendation.course.slug}`}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40"
                  >
                    <span className="font-bold text-gray-900 dark:text-white">{recommendation.course.title}</span>
                    <span className="text-slate-400">{getDifficultyLabelWithEnglish(recommendation.course.level)}</span>
                  </Link>
                ))}
                {!recommendationsByTrack.get(track.trackId)?.length && (
                  <p className="text-xs text-slate-400">لا توجد توصيات بعد لهذا المسار.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Main Grid Columns ─────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Span (2 columns): Courses & Recent Activities */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Courses */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>مقرراتك الدراسية النشطة</span>
            </h2>

            {dbUser.enrollments.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800 rounded-2xl space-y-4">
                <p className="text-slate-400 text-xs font-medium">أنت غير مسجل في أي دورة تعليمية حالياً.</p>
                <Link
                  href="/dashboard/student/courses"
                  className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-sm transition-all"
                >
                  استعرض المقررات والتحق بالدورة الأولى
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {dbUser.enrollments.map((enr) => {
                  const totalLessons = enr.course.modules.reduce((a, m) => a + m.lessons.length, 0)
                  return (
                    <CourseCard
                      key={enr.id}
                      id={enr.course.id}
                      title={enr.course.title}
                      description={enr.course.description}
                      difficulty={enr.course.priceInCoins > 200 ? "ADVANCED" : enr.course.priceInCoins > 0 ? "INTERMEDIATE" : "BEGINNER"}
                      completedLessons={Math.round((enr.progress / 100) * totalLessons)}
                      totalLessons={totalLessons || 1}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Activities Feed */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>آخر الأنشطة والعمليات</span>
            </h2>

            <div className="bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/80 rounded-2xl p-5 space-y-4">
              {recentTransactions.length === 0 && recentAchievements.length === 0 && (
                <p className="text-center text-slate-500 text-xs italic py-4">لا توجد أنشطة حديثة مسجلة بعد.</p>
              )}

              {/* Transactions */}
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-xs border-b border-gray-50 dark:border-slate-800/60 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-amber-500/10 text-amber-500 font-bold">CC</span>
                    <span className="text-gray-900 dark:text-white font-bold">{tx.description}</span>
                  </div>
                  <span className={`font-black ${tx.type === "EARN" ? "text-emerald-500" : "text-rose-500"}`}>
                    {tx.type === "EARN" ? "+" : "-"}{tx.amount} CC
                  </span>
                </div>
              ))}

              {/* Achievements */}
              {recentAchievements.map((ach) => (
                <div key={ach.id} className="flex items-center justify-between text-xs border-b border-gray-50 dark:border-slate-800/60 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-yellow-500/10 text-yellow-500 font-bold">🏆</span>
                    <span className="text-gray-900 dark:text-white font-bold">حصلت على إنجاز: {ach.title}</span>
                  </div>
                  <span className="text-amber-500 font-black">إنجاز فتح</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Span (1 column): Notifications & Info */}
        <div className="space-y-6">
          {/* Recent Notifications */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>التنبيهات والإشعارات الحديثة</span>
            </h2>

            <div className="bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/80 rounded-2xl p-5 space-y-4">
              {recentNotifications.length === 0 ? (
                <p className="text-center text-slate-500 text-xs italic py-4">لا توجد إشعارات حديثة.</p>
              ) : (
                <div className="space-y-3.5">
                  {recentNotifications.map((notif) => (
                    <div key={notif.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-900 dark:text-white">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Intl.DateTimeFormat("ar-SA", { hour: "numeric", minute: "numeric" }).format(new Date(notif.createdAt))}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="h-px bg-gray-50 dark:bg-slate-800/40 pt-2" />
                    </div>
                  ))}

                  <Link
                    href="/dashboard/student/notifications"
                    className="block text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 pt-2"
                  >
                    عرض جميع الإشعارات
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
