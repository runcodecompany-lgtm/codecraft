// app/dashboard/student/quizzes/page.tsx
import React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import {
  Brain, FileQuestion, Trophy, Zap, Clock, ChevronLeft, Target, BookOpen, Sparkles, Layers,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function StudentQuizzesPage() {
  const session = await getServerSession()
  if (!session) redirect("/login")
  if (session.role !== "STUDENT" && session.role !== "TEACHER" && session.role !== "ADMIN") {
    redirect("/")
  }

  const quizzes = await prisma.quiz.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: "desc" },
  })

  const level = Math.floor(session.craftCoins / 100) + 1
  const totalQuestions = quizzes.reduce((sum, q) => sum + q._count.questions, 0)
  const maxReward = Math.max(...quizzes.map(q => q._count.questions), 0) * 10

  const difficultyConfig = {
    BEGINNER: {
      label: "مبتدئ",
      coverBg: "linear-gradient(135deg, var(--ccs-500), #2D6B3D)",
      accent: "var(--ccs-500)",
    },
    INTERMEDIATE: {
      label: "متوسط",
      coverBg: "linear-gradient(135deg, var(--ccc-500), #1B3450)",
      accent: "var(--ccc-500)",
    },
    ADVANCED: {
      label: "متقدم",
      coverBg: "linear-gradient(135deg, #D97706, #92400E)",
      accent: "var(--cca-500)",
    },
  }

  return (
    <>
      <style>{`
        .quiz-card-wrap { transition: all 0.25s ease; }
        .quiz-card-wrap:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(30,41,59,0.08), 0 2px 8px rgba(30,41,59,0.04); }
        .quiz-cta-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 10px 0; border-radius: var(--ccc-radius-lg); color: #fff; font: var(--ccc-label); font-weight: 600; text-decoration: none; transition: all 0.15s ease; border: none; cursor: pointer; }
        .quiz-cta-btn:hover { opacity: 0.9; transform: scale(1.02); }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-2xl)" }} dir="rtl">

        {/* ════════════════════════════════════════════════════════════
          ❶ HERO — مركز الاختبارات مع ملخص سريع
          ════════════════════════════════════════════════════════════ */}
        <div style={{
          padding: "var(--ccc-space-2xl)",
          borderRadius: "var(--ccc-radius-2xl)",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(30,41,59,0.04), 0 4px 16px rgba(30,41,59,0.04)",
          borderTop: "4px solid var(--ccc-500)",
        }}>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "var(--ccc-space-lg)",
            alignItems: "flex-start", justifyContent: "space-between",
          }}>
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
                <span>مركز الاختبارات</span>
              </div>
              <h1 style={{
                font: "700 24px/32px var(--ccc-font-sans)",
                color: "var(--ccn-900)", margin: 0,
              }}>
                الاختبارات التفاعلية
              </h1>
              <p style={{
                font: "var(--ccc-body-sm)", color: "var(--ccn-500)",
                marginTop: 4, maxWidth: 520,
              }}>
                اختبر معلوماتك البرمجية — كل إجابة صحيحة تمنحك عملات Craft Coins إضافية وترفع مستواك!
              </p>
            </div>

            {/* Mini stats row — like courses page */}
            <div style={{ display: "flex", gap: "var(--ccc-space-md)", flexWrap: "wrap" }}>
              {[
                { icon: FileQuestion, value: quizzes.length, label: "اختبار", color: "var(--ccc-500)" },
                { icon: BookOpen, value: totalQuestions, label: "سؤال", color: "var(--ccs-500)" },
                { icon: Zap, value: `${maxReward} CC`, label: "أقصى مكافأة", color: "var(--cca-500)" },
                { icon: Trophy, value: `المستوى ${level}`, label: "حالي", color: "var(--ccc-500)" },
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
                    <span style={{
                      font: "700 15px/1 var(--ccc-font-sans)", color: "var(--ccn-900)",
                    }}>
                      {stat.value}
                    </span>
                    <span style={{
                      font: "var(--ccc-caption)", color: "var(--ccn-500)", marginRight: 4,
                    }}>
                      {stat.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
          ❷ QUIZZES GRID
          ════════════════════════════════════════════════════════════ */}
        {quizzes.length === 0 ? (
          <div style={{
            padding: "var(--ccc-space-3xl) var(--ccc-space-xl)",
            textAlign: "center", color: "var(--ccn-400)",
          }}>
            <Brain className="w-12 h-12" style={{ margin: "0 auto var(--ccc-space-md)", opacity: 0.3 }} />
            <div style={{
              font: "var(--ccc-h4)", color: "var(--ccn-500)", fontWeight: 600,
            }}>
              لا توجد اختبارات متاحة بعد
            </div>
            <p style={{ font: "var(--ccc-body-sm)", color: "var(--ccn-400)", marginTop: 4 }}>
              سيتم إضافة اختبارات قريباً!
            </p>
          </div>
        ) : (
          <>
            {/* Section title */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingBottom: "var(--ccc-space-sm)",
              borderBottom: "1px solid var(--ccn-200)",
            }}>
              <h2 style={{
                font: "700 18px/26px var(--ccc-font-sans)", color: "var(--ccn-900)",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <Target className="w-5 h-5" style={{ color: "var(--ccc-500)" }} />
                قائمة الاختبارات
              </h2>
              <span style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)", fontWeight: 600 }}>
                {quizzes.length} اختبار
              </span>
            </div>

            {/* Grid */}
            <div className="sm:grid-cols-2 xl:grid-cols-3" style={{
              display: "grid", gap: "var(--ccc-space-lg)",
            }}>
              {quizzes.map((quiz) => {
                const qCount = quiz._count.questions
                const difficulty = qCount <= 3 ? "BEGINNER" : qCount <= 6 ? "INTERMEDIATE" : "ADVANCED"
                const rewardCoins = qCount * 10
                const cfg = difficultyConfig[difficulty]
                const estimatedMinutes = qCount * 2

                return (
                  <div
                    key={quiz.id}
                    className="quiz-card-wrap"
                    style={{
                      display: "flex", flexDirection: "column",
                      borderRadius: "var(--ccc-radius-2xl)",
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(30,41,59,0.04), 0 4px 12px rgba(30,41,59,0.04)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Cover area — gradient + badges */}
                    <div style={{
                      height: 100,
                      background: cfg.coverBg,
                      position: "relative",
                      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                      padding: "var(--ccc-space-md)",
                      overflow: "hidden",
                    }}>
                      {/* Decorative watermark icon */}
                      <div style={{
                        position: "absolute", bottom: -12, left: -12,
                        opacity: 0.08,
                      }}>
                        <Brain className="w-20 h-20" style={{ color: "rgba(255,255,255,0.5)" }} />
                      </div>
                      {/* Difficulty badge */}
                      <span style={{
                        padding: "3px 10px", borderRadius: "var(--ccc-radius-full)",
                        background: "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(8px)",
                        font: "var(--ccc-micro)", fontWeight: 700,
                        color: "rgba(255,255,255,0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        position: "relative", zIndex: 1,
                      }}>
                        {cfg.label}
                      </span>
                      {/* Reward pill */}
                      <span style={{
                        padding: "3px 10px", borderRadius: "var(--ccc-radius-full)",
                        background: "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(8px)",
                        font: "var(--ccc-micro)", fontWeight: 700,
                        color: "rgba(255,255,255,0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        position: "relative", zIndex: 1,
                      }}>
                        +{rewardCoins} CC
                      </span>
                    </div>

                    {/* Content */}
                    <div style={{
                      padding: "var(--ccc-space-lg)",
                      display: "flex", flexDirection: "column", flex: 1,
                      gap: "var(--ccc-space-md)",
                    }}>
                      {/* Title */}
                      <h2 style={{
                        font: "700 15px/22px var(--ccc-font-sans)",
                        color: "var(--ccn-900)", margin: 0,
                      }}>
                        {quiz.title}
                      </h2>

                      {/* Meta row */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: "var(--ccc-space-md)",
                        font: "var(--ccc-caption)", color: "var(--ccn-400)",
                      }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <FileQuestion className="w-3.5 h-3.5" />
                          {qCount} سؤال
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock className="w-3.5 h-3.5" />
                          ~{estimatedMinutes} دقيقة
                        </span>
                      </div>

                      {/* CTA */}
                      <Link
                        href={`/quizzes/${quiz.id}`}
                        className="quiz-cta-btn"
                        style={{
                          background: cfg.accent,
                          boxShadow: "0 1px 2px rgba(30,41,59,0.08)",
                          marginTop: "auto",
                        }}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>ابدأ الاختبار</span>
                        <ChevronLeft className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}
