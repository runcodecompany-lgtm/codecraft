// app/dashboard/student/courses/page.tsx
import React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import {
  BookOpen, CheckCircle2, Lock, PlayCircle, Coins, Layers, Sparkles, ArrowLeft,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function StudentCoursesPage() {
  const session = await getServerSession()
  if (!session) redirect("/login")
  if (session.role !== "STUDENT" && session.role !== "TEACHER" && session.role !== "ADMIN") {
    redirect("/")
  }

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    include: {
      teacher: { select: { name: true } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            select: { id: true, title: true, order: true, duration: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const completedProgress = await prisma.userProgress.findMany({
    where: { userId: session.id, isCompleted: true },
    select: { lessonId: true },
  })
  const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId))

  const totalCompleted = completedProgress.length
  const totalLessonsAll = courses.reduce(
    (sum, c) => sum + c.modules.reduce((s, m) => s + m.lessons.length, 0),
    0
  )

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: { craftCoins: true }
  })
  const craftCoins = dbUser?.craftCoins ?? 0

  const difficultyMap = (price: number) => {
    if (price === 0) return {
      label: "مبتدئ", accent: "var(--ccs-500)",
      coverBg: "linear-gradient(135deg, var(--ccs-500), #2D6B3D)",
    }
    if (price <= 200) return {
      label: "متوسط", accent: "var(--ccc-500)",
      coverBg: "linear-gradient(135deg, var(--ccc-500), #1B3450)",
    }
    return {
      label: "متقدم", accent: "var(--cca-500)",
      coverBg: "linear-gradient(135deg, #D97706, #92400E)",
    }
  }

  const initials = (name: string) =>
    (name || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()

  return (
    <div className="animate-fade-in" dir="rtl" style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-2xl)" }}>

      {/* ════════════════════════════════════════════════════════════
        ❶ HERO — مقرراتي الدراسية مع ملخص سريع
        ════════════════════════════════════════════════════════════ */}
      <div style={{
        padding: "var(--ccc-space-2xl)",
        borderRadius: "var(--ccc-radius-2xl)",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(30,41,59,0.04), 0 4px 16px rgba(30,41,59,0.04)",
        borderTop: "4px solid var(--ccc-500)",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ccc-space-lg)", alignItems: "flex-start", justifyContent: "space-between" }}>
          {/* Text */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 12px", borderRadius: "var(--ccc-radius-full)",
              background: "color-mix(in srgb, var(--ccc-500) 7%, transparent)",
              border: "1px solid color-mix(in srgb, var(--ccc-500) 12%, transparent)",
              font: "var(--ccc-caption)", fontWeight: 600, color: "var(--ccc-500)",
              marginBottom: "var(--ccc-space-sm)",
            }}>
              <Layers className="w-3.5 h-3.5" />
              <span>مسيرتي التعليمية</span>
            </div>
            <h1 style={{ font: "700 24px/32px var(--ccc-font-sans)", color: "var(--ccn-900)", margin: 0 }}>
              مقرراتي الدراسية
            </h1>
            <p style={{ font: "var(--ccc-body-sm)", color: "var(--ccn-500)", marginTop: 4, maxWidth: 480 }}>
              اختر مقرراً وواصل رحلة التعلّم — كل درس مكتمل يمنحك XP إضافية لترقية مستواك
            </p>
          </div>

          {/* Mini stats row */}
          <div style={{ display: "flex", gap: "var(--ccc-space-md)", flexWrap: "wrap" }}>
            {[
              { icon: BookOpen, value: courses.length, label: "مقرر", color: "var(--ccc-500)" },
              { icon: CheckCircle2, value: totalCompleted, label: "مكتمل", color: "var(--ccs-500)" },
              { icon: Layers, value: totalLessonsAll, label: "درس", color: "var(--ccn-500)" },
              { icon: Coins, value: craftCoins.toLocaleString("ar"), label: "CC", color: "var(--cca-500)" },
            ].map((stat, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 14px",
                borderRadius: "var(--ccc-radius-xl)",
                background: "color-mix(in srgb, " + stat.color + " 5%, #fff)",
                border: "1px solid color-mix(in srgb, " + stat.color + " 10%, transparent)",
              }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                <div>
                  <span style={{ font: "700 15px/1 var(--ccc-font-sans)", color: "var(--ccn-900)" }}>
                    {stat.value}
                  </span>
                  <span style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)", marginRight: 4 }}>
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
        ❷ COURSES GRID
        ════════════════════════════════════════════════════════════ */}
      {courses.length === 0 ? (
        <div style={{
          padding: "var(--ccc-space-3xl) var(--ccc-space-xl)",
          textAlign: "center", color: "var(--ccn-400)",
        }}>
          <BookOpen className="w-12 h-12" style={{ margin: "0 auto var(--ccc-space-md)", opacity: 0.3 }} />
          <div style={{ font: "var(--ccc-h4)", color: "var(--ccn-500)", fontWeight: 600 }}>
            لا توجد مقررات متاحة حالياً
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "var(--ccc-space-lg)" }} className="sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
            const completed = course.modules.reduce(
              (acc, m) => acc + m.lessons.filter((l) => completedLessonIds.has(l.id)).length,
              0
            )
            const progress = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0
            const diff = difficultyMap(course.priceInCoins)
            const firstLesson = course.modules[0]?.lessons[0]
            const canEnroll = course.priceInCoins === 0 || craftCoins >= course.priceInCoins

            return (
              <div
                key={course.id}
                style={{
                  display: "flex", flexDirection: "column",
                  borderRadius: "var(--ccc-radius-2xl)",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(30,41,59,0.04), 0 4px 12px rgba(30,41,59,0.04)",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Cover area */}
                <div style={{
                  height: 100,
                  background: diff.coverBg,
                  position: "relative",
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  padding: "var(--ccc-space-md)",
                }}>
                  {/* Difficulty badge */}
                  <span style={{
                    padding: "3px 10px", borderRadius: "var(--ccc-radius-full)",
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                    font: "var(--ccc-micro)", fontWeight: 700, color: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}>
                    {diff.label}
                  </span>
                  {/* Price tag */}
                  <span style={{
                    padding: "3px 10px", borderRadius: "var(--ccc-radius-full)",
                    background: course.priceInCoins > 0
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(74,124,89,0.3)",
                    backdropFilter: "blur(8px)",
                    font: "var(--ccc-micro)", fontWeight: 700,
                    color: course.priceInCoins > 0
                      ? "rgba(255,255,255,0.9)"
                      : "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}>
                    {course.priceInCoins > 0 ? `${course.priceInCoins} CC` : "مجاني"}
                  </span>
                </div>

                {/* Content */}
                <div style={{
                  padding: "var(--ccc-space-lg)",
                  display: "flex", flexDirection: "column", flex: 1, gap: "var(--ccc-space-md)",
                }}>
                  {/* Title + Teacher */}
                  <div>
                    <h2 style={{
                      font: "700 15px/22px var(--ccc-font-sans)",
                      color: "var(--ccn-900)", margin: 0,
                    }}>
                      {course.title}
                    </h2>
                    {course.description && (
                      <p style={{
                        font: "var(--ccc-caption)",
                        color: "var(--ccn-500)",
                        marginTop: 4,
                        lineHeight: 1.6,
                        overflow: "hidden", textOverflow: "ellipsis",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      }}>
                        {course.description}
                      </p>
                    )}
                  </div>

                  {/* Meta row */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: "var(--ccc-space-md)",
                    font: "var(--ccc-caption)", color: "var(--ccn-400)",
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <BookOpen className="w-3.5 h-3.5" />
                      {totalLessons} درس
                    </span>
                    {completed > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--ccs-500)" }}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {completed} مكتمل
                      </span>
                    )}
                    {course.teacher && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%",
                          background: "var(--ccc-500)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          font: "700 8px/1 var(--ccc-font-sans)", flexShrink: 0,
                        }}>
                          {initials(course.teacher.name)}
                        </div>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 80 }}>
                          {course.teacher.name}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Progress + Action */}
                  <div style={{ marginTop: "auto" }}>
                    {progress > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-sm)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", font: "var(--ccc-caption)", color: "var(--ccn-500)" }}>
                          <span>التقدم</span>
                          <span style={{ fontWeight: 700, color: "var(--ccc-500)" }}>{progress}%</span>
                        </div>
                        <div style={{ height: 5, background: "var(--ccn-200)", borderRadius: "var(--ccc-radius-full)", overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: "var(--ccc-radius-full)",
                            background: "var(--ccc-500)",
                            width: `${progress}%`, transition: "width 0.7s ease",
                          }} />
                        </div>
                        <Link
                          href={`/courses/${course.slug}`}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            padding: "10px 0", width: "100%",
                            borderRadius: "var(--ccc-radius-lg)",
                            background: "var(--ccc-500)", color: "#fff",
                            font: "var(--ccc-label)", fontWeight: 600, textDecoration: "none",
                            transition: "all 0.15s ease",
                            boxShadow: "0 1px 2px rgba(43,76,126,0.12)",
                          }}
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>متابعة التعلم</span>
                        </Link>
                      </div>
                    ) : firstLesson ? (
                      canEnroll ? (
                        <Link
                          href={`/courses/${course.slug}`}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            padding: "10px 0", width: "100%",
                            borderRadius: "var(--ccc-radius-lg)",
                            border: "1.5px solid var(--ccn-200)",
                            color: "var(--ccn-700)",
                            font: "var(--ccc-label)", fontWeight: 600, textDecoration: "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>ابدأ الدراسة الآن</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "10px 0", width: "100%",
                          borderRadius: "var(--ccc-radius-lg)",
                          background: "var(--ccn-50)",
                          color: "var(--ccn-400)",
                          font: "var(--ccc-label)", fontWeight: 600,
                        }}>
                          <Lock className="w-3.5 h-3.5" />
                          <span>يحتاج {course.priceInCoins} CC</span>
                        </div>
                      )
                    ) : (
                      <div style={{
                        padding: "10px 0", width: "100%", textAlign: "center",
                        borderRadius: "var(--ccc-radius-lg)",
                        background: "var(--ccn-50)",
                        color: "var(--ccn-400)",
                        font: "var(--ccc-label)", fontWeight: 600,
                      }}>
                        مقرر بدون دروس حالياً
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
