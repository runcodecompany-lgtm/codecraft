// app/dashboard/student/page.tsx
import React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import {
  Flame, Coins, BookOpen, Target, Sparkles,
  ArrowRight, Award, Gamepad2, Brain, Bell,
  GraduationCap, Star, Medal,
  ChevronLeft, Layers,
  Activity, Zap, BarChart4, Clock,
  ChevronLeft as ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { getDifficultyLabelWithEnglish, getTrackRoleLabel } from "@/lib/learning"
import StudentAIInsights from "@/components/student-ai-insights"

export const dynamic = "force-dynamic"

export default async function StudentDashboardPage() {
  const session = await getServerSession()

  if (!session) { redirect("/login") }
  if (session.role !== "STUDENT" && session.role !== "TEACHER" && session.role !== "ADMIN") { redirect("/") }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      userTracks: { include: { track: true } },
      placementAttempts: {
        where: { trackId: { not: null } },
        orderBy: { createdAt: "desc" },
        include: { track: true },
      },
      learningProfile: true,
      trackRecommendations: {
        include: {
          track: true,
          course: { select: { id: true, title: true, slug: true, level: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      enrollments: {
        where: { isCompleted: false },
        include: {
          course: {
            select: {
              id: true, title: true, description: true, priceInCoins: true, trackId: true,
              modules: { select: { lessons: { select: { id: true } } } },
            },
          },
        },
        take: 3,
      },
    },
  })

  if (!dbUser) { redirect("/login") }

  const enrolledCount = await prisma.enrollment.count({ where: { userId: session.id } })
  const completedCoursesCount = await prisma.enrollment.count({ where: { userId: session.id, isCompleted: true } })
  const certificatesCount = await prisma.certificate.count({ where: { userId: session.id } })
  const quizAttemptsCount = await prisma.quizAttempt.count({ where: { userId: session.id, isPassed: true } })
  const gamesCompletedCount = await prisma.gameResult.count({ where: { userId: session.id } })

  const recentNotifications = await prisma.notification.findMany({
    where: { userId: session.id }, take: 4, orderBy: { createdAt: "desc" },
  })
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId: session.id }, take: 4, orderBy: { createdAt: "desc" },
  })
  const recentAchievements = await prisma.userAchievement.findMany({
    where: { userId: session.id }, take: 4, orderBy: { createdAt: "desc" },
  })

  const xpNeededForNext = dbUser.level * 100
  const cumulativeXpForCurrent = 50 * dbUser.level * (dbUser.level - 1)
  const currentLevelXp = Math.max(0, dbUser.xp - cumulativeXpForCurrent)

  const attemptedTrackIds = dbUser.placementAttempts.map((p) => p.trackId)
  const tracksNeedingPlacement = dbUser.userTracks.filter((t) => !attemptedTrackIds.includes(t.trackId))

  const recommendationsByTrack = new Map<string, typeof dbUser.trackRecommendations>()
  dbUser.trackRecommendations.forEach((rec) => {
    const items = recommendationsByTrack.get(rec.trackId) || []
    items.push(rec)
    recommendationsByTrack.set(rec.trackId, items)
  })

  const firstName = (dbUser.name || "طالب").split(" ")[0]
  const initials = (dbUser.name || "ط").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
  const levelProgress = xpNeededForNext > 0 ? Math.min(1, currentLevelXp / xpNeededForNext) : 0
  const ringCircumference = 2 * Math.PI * 30
  const nextLevel = dbUser.level + 1
  const xpProgressPercent = Math.round(levelProgress * 100)
  const heroRingCircumference = 2 * Math.PI * 38

  return (
    <div className="animate-fade-in" dir="rtl" style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-2xl)" }}>

      {/* ════════════════════════════════════════════════════════════
        ❶ HERO COCKPIT — مساحة ترحيب ذكية مع لمحة عن التقدم
        ════════════════════════════════════════════════════════════ */}
      <div style={{
        padding: "var(--ccc-space-2xl)",
        borderRadius: "var(--ccc-radius-2xl)",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(30,41,59,0.04), 0 4px 16px rgba(30,41,59,0.04)",
        borderTop: "4px solid var(--ccc-500)",
      }}>
        {/* Main row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--ccc-space-lg)" }}>
          {/* Avatar + Level Ring + Greeting */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-xl)" }}>
            {/* Avatar with integrated level ring */}
            <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="38" fill="none" stroke="var(--ccn-200)" strokeWidth="4" />
                <circle cx="44" cy="44" r="38" fill="none" stroke="var(--ccc-500)" strokeWidth="4"
                  strokeDasharray={heroRingCircumference}
                  strokeDashoffset={heroRingCircumference * (1 - levelProgress)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.7s ease", transform: "rotate(-90deg)", transformOrigin: "44px 44px" }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: "4px", borderRadius: "50%",
                background: "linear-gradient(135deg, var(--ccc-500), var(--ccc-700))",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                color: "#fff", lineHeight: 1.2,
              }}>
                <span style={{ font: "var(--ccc-caption)", opacity: 0.8, marginBottom: -2 }}>Lv.{dbUser.level}</span>
                <span style={{ font: "700 20px/1 var(--ccc-font-sans)" }}>{initials}</span>
              </div>
            </div>

            {/* Greeting + Role + XP */}
            <div>
              <h1 style={{ font: "700 26px/34px var(--ccc-font-sans)", color: "var(--ccn-900)", margin: 0 }}>
                مرحباً، {firstName}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)", marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ font: "var(--ccc-body-sm)", color: "var(--ccn-500)" }}>متعلم Code Craft</span>
                {dbUser.userTracks.length > 0 && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "2px 10px", borderRadius: "var(--ccc-radius-full)",
                    background: "color-mix(in srgb, var(--ccc-500) 7%, transparent)",
                    font: "var(--ccc-micro)", fontWeight: 600, color: "var(--ccc-500)",
                    border: "1px solid color-mix(in srgb, var(--ccc-500) 12%, transparent)",
                  }}>
                    <Star className="w-3 h-3" />
                    {dbUser.userTracks.find(t => t.isPrimary)?.track.name || dbUser.userTracks[0].track.name}
                  </span>
                )}
              </div>
              {/* XP Progress — دائماً ظاهر */}
              <div style={{ marginTop: "var(--ccc-space-md)", maxWidth: 320 }}>
                <div style={{ display: "flex", justifyContent: "space-between", font: "var(--ccc-caption)", color: "var(--ccn-400)", marginBottom: 4 }}>
                  <span>XP: {currentLevelXp.toLocaleString("ar")} / {xpNeededForNext.toLocaleString("ar")}</span>
                  <span style={{ fontWeight: 700, color: "var(--ccc-500)" }}>{xpProgressPercent}%</span>
                </div>
                <div style={{ height: 5, background: "var(--ccn-200)", borderRadius: "var(--ccc-radius-full)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    background: "var(--ccc-500)",
                    borderRadius: "var(--ccc-radius-full)",
                    width: `${levelProgress * 100}%`,
                    transition: "width 0.7s ease",
                  }} />
                </div>
                <div style={{ font: "var(--ccc-micro)", color: "var(--ccn-400)", marginTop: 3 }}>
                  {xpProgressPercent >= 100 ? "مستعد للارتقاء إلى المستوى التالي!" : `نحو المستوى ${nextLevel}`}
                </div>
              </div>
            </div>
          </div>

          {/* Streak + Coins — كبسولات جانبية */}
          <div style={{ display: "flex", gap: "var(--ccc-space-sm)" }}>
            {/* Streak pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px 8px 14px",
              borderRadius: "var(--ccc-radius-xl)",
              background: "color-mix(in srgb, #F97316 6%, transparent)",
              border: "1px solid color-mix(in srgb, #F97316 15%, transparent)",
            }}>
              <div style={{ width: 32, height: 32, borderRadius: "var(--ccc-radius-lg)", background: "color-mix(in srgb, #F97316 12%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Flame className="w-4 h-4" style={{ color: "#F97316" }} />
              </div>
              <div>
                <div style={{ font: "700 16px/1 var(--ccc-font-sans)", color: "#C2410C" }}>{dbUser.streakCount}</div>
                <div style={{ font: "var(--ccc-micro)", color: "#9A3412" }}>يوم متتالي</div>
              </div>
            </div>

            {/* Coins pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px 8px 14px",
              borderRadius: "var(--ccc-radius-xl)",
              background: "color-mix(in srgb, var(--cca-500) 6%, transparent)",
              border: "1px solid color-mix(in srgb, var(--cca-500) 15%, transparent)",
            }}>
              <div style={{ width: 32, height: 32, borderRadius: "var(--ccc-radius-lg)", background: "color-mix(in srgb, var(--cca-500) 12%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Coins className="w-4 h-4" style={{ color: "var(--cca-500)" }} />
              </div>
              <div>
                <div style={{ font: "700 16px/1 var(--ccc-font-sans)", color: "var(--cca-600)" }}>{dbUser.craftCoins.toLocaleString("ar")}</div>
                <div style={{ font: "var(--ccc-micro)", color: "var(--cca-700)" }}>عملة كرافت</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
        ❷ PLACEMENT BANNER — شريط نحيف بلون هادئ
        ════════════════════════════════════════════════════════════ */}
      {tracksNeedingPlacement.length > 0 && (
        <div className="animate-fade-in-down" style={{
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
          gap: "var(--ccc-space-md)",
          padding: "var(--ccc-space-md) var(--ccc-space-xl)",
          borderRadius: "var(--ccc-radius-xl)",
          background: "color-mix(in srgb, var(--ccc-500) 4%, #fff)",
          border: "1px solid color-mix(in srgb, var(--ccc-500) 10%, transparent)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-md)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--ccc-radius-lg)", background: "color-mix(in srgb, var(--ccc-500) 8%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ccc-500)" }}>
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div style={{ font: "var(--ccc-body-sm)", fontWeight: 600, color: "var(--ccn-800)" }}>
                <Sparkles className="w-3 h-3" style={{ display: "inline", verticalAlign: "middle", marginLeft: 4, color: "var(--cca-500)" }} />
                أجرِ اختبار تحديد المستوى لمساراتك!
              </div>
              <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)", marginTop: 1 }}>احصل على خطة دراسية مخصصة ومكافآت البداية</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ccc-space-sm)" }}>
            {tracksNeedingPlacement.map((ut) => (
              <Link key={ut.id} href={`/dashboard/student/placement?trackId=${ut.trackId}`} className="ccc-btn-primary" style={{ padding: "6px 14px", font: "var(--ccc-caption)", fontWeight: 600, fontSize: 11 }}>
                <span>اختبار {ut.track.name}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            ))}
            <Link href="/dashboard/student/roadmap" style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px",
              borderRadius: "var(--ccc-radius-lg)",
              background: "color-mix(in srgb, var(--ccs-500) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--ccs-500) 20%, transparent)",
              color: "var(--ccs-600)", font: "var(--ccc-caption)", fontWeight: 600, fontSize: 11,
              textDecoration: "none",
            }}>
              🗺️ خريطة التعلم
            </Link>
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════
        ❸ KEY METRICS — 3 مؤشرات مدمجة بأنماط مختلفة
        ════════════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--ccc-space-lg)" }}>
        {[
          {
            icon: BookOpen, value: enrolledCount, label: "المقررات النشطة",
            accent: "var(--ccc-500)", bg: "color-mix(in srgb, var(--ccc-500) 5%, #fff)",
          },
          {
            icon: Award, value: completedCoursesCount, label: "الدورات المكتملة",
            accent: "var(--ccs-500)", bg: "color-mix(in srgb, var(--ccs-500) 5%, #fff)",
          },
          {
            icon: Medal, value: certificatesCount, label: "الشهادات الرقمية",
            accent: "var(--cca-500)", bg: "color-mix(in srgb, var(--cca-500) 5%, #fff)",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="animate-fade-in-up"
            style={{
              animationDelay: `${i * 120}ms`,
              padding: "var(--ccc-space-xl)",
              borderRadius: "var(--ccc-radius-xl)",
              background: stat.bg,
              boxShadow: "0 1px 3px rgba(30,41,59,0.04)",
              display: "flex", flexDirection: "column", gap: "var(--ccc-space-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "var(--ccc-radius-lg)",
                background: "color-mix(in srgb, " + stat.accent + " 10%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.accent }} />
              </div>
              <span style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)", fontWeight: 500 }}>{stat.label}</span>
            </div>
            <div style={{ font: "700 32px/36px var(--ccc-font-sans)", color: "var(--ccn-900)", letterSpacing: "-0.02em" }}>
              {stat.value.toLocaleString("ar")}
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
        ❹ MAIN CONTENT: Active Courses (2/3) + Side Panel (1/3)
        ════════════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gap: "var(--ccc-space-xl)" }} className="lg:grid-cols-3">
        {/* Active Courses — 2/3 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-lg)" }} className="lg:col-span-2">
          <div style={{
            padding: "var(--ccc-space-lg)",
            borderRadius: "var(--ccc-radius-2xl)",
            background: "#fff",
            boxShadow: "0 1px 4px rgba(30,41,59,0.04), 0 4px 16px rgba(30,41,59,0.04)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--ccc-space-lg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)" }}>
                <BookOpen className="w-5 h-5" style={{ color: "var(--ccc-500)" }} />
                <h2 style={{ font: "var(--ccc-h3)", color: "var(--ccn-900)", margin: 0, fontWeight: 700 }}>مقرراتي النشطة</h2>
              </div>
              {dbUser.enrollments.length > 0 && (
                <Link href="/dashboard/student/courses" style={{
                  display: "flex", alignItems: "center", gap: 4,
                  font: "var(--ccc-caption)", fontWeight: 600, color: "var(--ccc-500)",
                  textDecoration: "none", transition: "opacity 0.15s",
                }} className="hover:opacity-70">
                  عرض الكل
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {dbUser.enrollments.length === 0 ? (
              <div className="ccc-empty" style={{ padding: "var(--ccc-space-2xl) 0" }}>
                <BookOpen className="ccc-empty-icon" />
                <div className="ccc-empty-text">أنت غير مسجل في أي دورة حالياً</div>
                <Link href="/dashboard/student/courses" className="ccc-btn-primary">استعرض المقررات</Link>
              </div>
            ) : (
              <div style={{
                display: "flex", gap: "var(--ccc-space-md)",
                overflowX: "auto", paddingBottom: "var(--ccc-space-sm)",
                scrollSnapType: "x mandatory", scrollbarWidth: "thin",
              }}>
                {dbUser.enrollments.map((enr) => {
                  const totalLessons = enr.course.modules.reduce((a, m) => a + m.lessons.length, 0)
                  return (
                    <div
                      key={enr.id}
                      className="animate-fade-in-up"
                      style={{
                        flex: "0 0 280px", scrollSnapAlign: "start",
                        padding: "var(--ccc-space-lg)",
                        borderRadius: "var(--ccc-radius-xl)",
                        background: "var(--ccn-50)",
                        border: "1px solid var(--ccn-200)",
                        display: "flex", flexDirection: "column",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ marginBottom: "var(--ccc-space-md)" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "2px 10px", borderRadius: "var(--ccc-radius-full)",
                          background: "color-mix(in srgb, var(--ccs-500) 10%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--ccs-500) 15%, transparent)",
                          font: "var(--ccc-micro)", color: "var(--ccs-500)",
                        }}>
                          <Sparkles className="w-2.5 h-2.5" />
                          قيد الدراسة
                        </span>
                      </div>
                      <div style={{ font: "var(--ccc-h4)", fontWeight: 700, color: "var(--ccn-900)", marginBottom: 4, lineHeight: 1.4 }}>
                        {enr.course.title}
                      </div>
                      {enr.course.description && (
                        <div style={{
                          font: "var(--ccc-caption)", color: "var(--ccn-500)",
                          lineHeight: 1.6, marginBottom: "var(--ccc-space-md)",
                          overflow: "hidden", textOverflow: "ellipsis",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        }}>
                          {enr.course.description}
                        </div>
                      )}
                      <div style={{ marginTop: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", font: "var(--ccc-caption)", color: "var(--ccn-500)", marginBottom: "var(--ccc-space-sm)" }}>
                          <span>الدروس: {Math.round((enr.progress / 100) * totalLessons)} / {totalLessons || 1}</span>
                          <span style={{ fontWeight: 700, color: "var(--ccc-500)" }}>{Math.round(enr.progress)}%</span>
                        </div>
                        <div style={{ height: 5, background: "var(--ccn-200)", borderRadius: "var(--ccc-radius-full)", overflow: "hidden", marginBottom: "var(--ccc-space-md)" }}>
                          <div style={{ height: "100%", background: "var(--ccc-500)", borderRadius: "var(--ccc-radius-full)", width: `${enr.progress}%`, transition: "width 0.7s ease" }} />
                        </div>
                        <Link
                          href={`/courses/${enr.course.slug}`}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            width: "100%", padding: "10px 0",
                            borderRadius: "var(--ccc-radius-lg)",
                            background: "var(--ccc-500)", color: "#fff",
                            font: "var(--ccc-label)", fontWeight: 600, textDecoration: "none",
                            transition: "all 0.15s ease",
                            boxShadow: "0 1px 2px rgba(43,76,126,0.12)",
                          }}
                        >
                          <span>متابعة التعلم</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel — 1/3 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-lg)" }}>
          {/* Notifications Mini */}
          <div style={{
            padding: "var(--ccc-space-lg)",
            borderRadius: "var(--ccc-radius-xl)",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(30,41,59,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--ccc-space-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)" }}>
                <Bell className="w-4 h-4" style={{ color: "var(--ccc-500)" }} />
                <h3 style={{ font: "var(--ccc-h4)", color: "var(--ccn-900)", margin: 0, fontWeight: 700 }}>الإشعارات</h3>
              </div>
              <Link href="/dashboard/student/notifications" style={{ font: "var(--ccc-caption)", color: "var(--ccc-500)", textDecoration: "none", fontWeight: 600 }}>الكل</Link>
            </div>
            {recentNotifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--ccc-space-lg) 0", font: "var(--ccc-caption)", color: "var(--ccn-400)" }}>لا توجد إشعارات</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-sm)" }}>
                {recentNotifications.map((notif, i) => (
                  <div key={notif.id} style={{
                    padding: "var(--ccc-space-sm) var(--ccc-space-md)",
                    borderRadius: "var(--ccc-radius-lg)",
                    background: "var(--ccn-50)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ font: "var(--ccc-caption)", fontWeight: 700, color: "var(--ccn-800)" }}>{notif.title}</span>
                      <span style={{ font: "var(--ccc-micro)", color: "var(--ccn-400)" }}>
                        {new Intl.DateTimeFormat("ar-SA", { hour: "numeric", minute: "numeric" }).format(new Date(notif.createdAt))}
                      </span>
                    </div>
                    <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)" }}>{notif.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats — دائرتان Progress + عداد */}
          <div style={{
            padding: "var(--ccc-space-lg)",
            borderRadius: "var(--ccc-radius-xl)",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(30,41,59,0.04)",
            display: "flex", flexDirection: "column", gap: "var(--ccc-space-lg)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)" }}>
              <BarChart4 className="w-4 h-4" style={{ color: "var(--ccc-500)" }} />
              <h3 style={{ font: "var(--ccc-h4)", color: "var(--ccn-900)", margin: 0, fontWeight: 700 }}>إحصائيات سريعة</h3>
            </div>

            <div style={{ display: "flex", gap: "var(--ccc-space-md)" }}>
              {/* Quiz stat */}
              <div style={{ flex: 1, textAlign: "center", padding: "var(--ccc-space-md)", borderRadius: "var(--ccc-radius-lg)", background: "color-mix(in srgb, var(--ccc-500) 4%, transparent)" }}>
                <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto var(--ccc-space-sm)" }}>
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="var(--ccn-200)" strokeWidth="4" />
                    <circle cx="28" cy="28" r="24" fill="none" stroke="var(--ccc-500)" strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 24}
                      strokeDashoffset={2 * Math.PI * 24 * (1 - Math.min(1, quizAttemptsCount / 20))}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 0.7s ease", transform: "rotate(-90deg)", transformOrigin: "28px 28px" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Brain className="w-5 h-5" style={{ color: "var(--ccc-500)" }} />
                  </div>
                </div>
                <div style={{ font: "700 18px/1 var(--ccc-font-sans)", color: "var(--ccn-900)" }}>{quizAttemptsCount}</div>
                <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)" }}>اختبار ناجح</div>
              </div>

              {/* Games stat */}
              <div style={{ flex: 1, textAlign: "center", padding: "var(--ccc-space-md)", borderRadius: "var(--ccc-radius-lg)", background: "color-mix(in srgb, var(--ccs-500) 4%, transparent)" }}>
                <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto var(--ccc-space-sm)" }}>
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="var(--ccn-200)" strokeWidth="4" />
                    <circle cx="28" cy="28" r="24" fill="none" stroke="var(--ccs-500)" strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 24}
                      strokeDashoffset={2 * Math.PI * 24 * (1 - Math.min(1, gamesCompletedCount / 20))}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 0.7s ease", transform: "rotate(-90deg)", transformOrigin: "28px 28px" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Gamepad2 className="w-5 h-5" style={{ color: "var(--ccs-500)" }} />
                  </div>
                </div>
                <div style={{ font: "700 18px/1 var(--ccc-font-sans)", color: "var(--ccn-900)" }}>{gamesCompletedCount}</div>
                <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)" }}>تحدي برمجي</div>
              </div>
            </div>

            {/* Recent activity summary */}
            {(recentTransactions.length > 0 || recentAchievements.length > 0) && (
              <div style={{ borderTop: "1px solid var(--ccn-200)", paddingTop: "var(--ccc-space-md)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)", marginBottom: "var(--ccc-space-sm)" }}>
                  <Activity className="w-3.5 h-3.5" style={{ color: "var(--ccn-400)" }} />
                  <span style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)", fontWeight: 600 }}>آخر النشاطات</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {recentAchievements.slice(0, 2).map((ach) => (
                    <div key={ach.id} style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)", padding: "4px 0" }}>
                      <Medal className="w-3 h-3" style={{ color: "var(--cca-500)", flexShrink: 0 }} />
                      <span style={{ font: "var(--ccc-caption)", color: "var(--ccn-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ach.title}
                      </span>
                    </div>
                  ))}
                  {recentTransactions.slice(0, 2).map((tx) => (
                    <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)", padding: "4px 0" }}>
                      <Coins className="w-3 h-3" style={{ color: tx.type === "EARN" ? "var(--ccs-500)" : "var(--ccr-500)", flexShrink: 0 }} />
                      <span style={{ font: "var(--ccc-caption)", color: "var(--ccn-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tx.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
        ❺ LEARNING TRACKS — مسارات مع تقدم مرئي
        ════════════════════════════════════════════════════════════ */}
      <div style={{
        padding: "var(--ccc-space-xl)",
        borderRadius: "var(--ccc-radius-2xl)",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(30,41,59,0.04), 0 4px 16px rgba(30,41,59,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--ccc-space-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)" }}>
            <Layers className="w-5 h-5" style={{ color: "var(--ccc-500)" }} />
            <h2 style={{ font: "var(--ccc-h3)", color: "var(--ccn-900)", margin: 0, fontWeight: 700 }}>مسارات التعلم</h2>
          </div>
          <Link href="/dashboard/student/profile" style={{
            display: "flex", alignItems: "center", gap: 4,
            font: "var(--ccc-caption)", fontWeight: 600, color: "var(--ccc-500)",
            textDecoration: "none", transition: "opacity 0.15s",
          }} className="hover:opacity-70">
            إدارة المسارات
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {dbUser.userTracks.length === 0 ? (
          <div className="ccc-empty" style={{ padding: "var(--ccc-space-xl) 0" }}>
            <GraduationCap className="ccc-empty-icon" />
            <div className="ccc-empty-text">لم تقم باختيار أي مسار تعليمي بعد.</div>
            <Link href="/dashboard/student/profile" className="ccc-btn-primary">اختر مسارك الآن</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-lg)" }}>
            {dbUser.userTracks.map((track, idx) => (
              <div key={track.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--ccc-space-sm)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)", flexWrap: "wrap" }}>
                    <span style={{ font: "var(--ccc-body-sm)", fontWeight: 700, color: "var(--ccn-900)" }}>{track.track.name}</span>
                    <span className="ccc-badge ccc-badge-primary" style={{ font: "var(--ccc-micro)", padding: "1px 8px" }}>{getDifficultyLabelWithEnglish(track.level)}</span>
                    {track.isPrimary && (
                      <span style={{ font: "var(--ccc-micro)", color: "var(--ccc-500)", fontWeight: 600 }}>الرئيسي</span>
                    )}
                  </div>
                  <span style={{ font: "var(--ccc-body-sm)", fontWeight: 700, color: "var(--ccc-500)" }}>{Math.round(track.progress)}%</span>
                </div>
                <div style={{ height: 6, background: "var(--ccn-200)", borderRadius: "var(--ccc-radius-full)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    borderRadius: "var(--ccc-radius-full)",
                    background: "var(--ccc-500)",
                    width: `${track.progress}%`,
                    transition: "width 0.7s ease",
                  }} />
                </div>
                {recommendationsByTrack.get(track.trackId)?.length > 0 && (
                  <div style={{ display: "flex", gap: "var(--ccc-space-sm)", marginTop: "var(--ccc-space-sm)", flexWrap: "wrap" }}>
                    {recommendationsByTrack.get(track.trackId)?.slice(0, 2).map((rec) => (
                      <Link
                        key={rec.id}
                        href={`/courses/${(rec.course as any).slug || rec.course.id}`}
                        style={{
                          font: "var(--ccc-caption)", color: "var(--ccn-500)", textDecoration: "none",
                          padding: "4px 10px", borderRadius: "var(--ccc-radius-md)",
                          background: "var(--ccn-50)", border: "1px solid var(--ccn-200)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {rec.course.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
        ❻ AI INSIGHTS SECTION
        ════════════════════════════════════════════════════════════ */}
      <StudentAIInsights />
    </div>
  )
}
