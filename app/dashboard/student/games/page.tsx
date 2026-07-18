// app/dashboard/student/games/page.tsx
"use client"
import React, { useState } from "react"
import Link from "next/link"
import { Gamepad2, Code2, Lock, PlayCircle, Zap, Trophy, Target, Sparkles, Layers, ChevronLeft } from "lucide-react"

const challenges = [
  {
    id: "html-structure",
    title: "بناء هيكل صفحة HTML",
    description: "ابنِ هيكلاً متكاملاً لصفحة ويب يشمل: header, nav, main, section, footer. اختبر مهاراتك الأساسية في HTML5.",
    language: "html",
    difficulty: "BEGINNER" as const,
    reward: 30,
    tags: ["HTML5", "Semantic"],
    locked: false,
  },
  {
    id: "css-flexbox",
    title: "تحدي CSS Flexbox",
    description: "صمّم شريط تنقّل متجاوب باستخدام Flexbox. يجب أن تكون العناصر مرتّبة أفقياً وتتوزّع بالتساوي.",
    language: "css",
    difficulty: "BEGINNER" as const,
    reward: 40,
    tags: ["CSS3", "Flexbox"],
    locked: false,
  },
  {
    id: "js-array-methods",
    title: "مسابقة Array Methods",
    description: "استخدم map(), filter(), reduce() لحل سلسلة من تحديات المصفوفات في JavaScript. الحل الأنيق يمنحك نقاط مضاعفة!",
    language: "javascript",
    difficulty: "INTERMEDIATE" as const,
    reward: 60,
    tags: ["JavaScript", "Functional"],
    locked: false,
  },
  {
    id: "css-grid-layout",
    title: "تصميم Layout بـ CSS Grid",
    description: "أنشئ تصميم Bento Box باستخدام CSS Grid فقط. تحدٍّ حقيقي لمن يريد إتقان تقنية Grid المتقدمة.",
    language: "css",
    difficulty: "INTERMEDIATE" as const,
    reward: 70,
    tags: ["CSS Grid", "Layout"],
    locked: false,
  },
  {
    id: "js-async-await",
    title: "بطل Async/Await",
    description: "قم بتحويل Callback Hell إلى كود نظيف باستخدام Async/Await. اكتشف قوة البرمجة غير المتزامنة الحديثة.",
    language: "javascript",
    difficulty: "ADVANCED" as const,
    reward: 100,
    tags: ["Async", "Promises"],
    locked: true,
  },
  {
    id: "full-component",
    title: "بناء مكوّن React تفاعلي",
    description: "صمّم مكوّن Counter متكامل يدعم Increment, Decrement, Reset مع رسوم متحركة. اختبار React الشامل!",
    language: "javascript",
    difficulty: "ADVANCED" as const,
    reward: 150,
    tags: ["React", "Hooks"],
    locked: true,
  },
]

const diffConfig = {
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

const langConfig: Record<string, { iconColor: string; bg: string }> = {
  html: { iconColor: "#F97316", bg: "color-mix(in srgb, #F97316 10%, transparent)" },
  css: { iconColor: "#3B82F6", bg: "color-mix(in srgb, #3B82F6 10%, transparent)" },
  javascript: { iconColor: "#EAB308", bg: "color-mix(in srgb, #EAB308 10%, transparent)" },
}

const filters = [
  { key: "ALL" as const, label: "الكل", icon: Target },
  { key: "BEGINNER" as const, label: "مبتدئ", icon: Zap },
  { key: "INTERMEDIATE" as const, label: "متوسط", icon: Sparkles },
  { key: "ADVANCED" as const, label: "متقدم", icon: Trophy },
]

export default function StudentGamesPage() {
  const [filter, setFilter] = useState<"ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED">("ALL")

  const filtered = challenges.filter((c) => filter === "ALL" || c.difficulty === filter)
  const unlockedCount = challenges.filter((c) => !c.locked).length
  const totalReward = challenges.filter((c) => !c.locked).reduce((s, c) => s + c.reward, 0)

  return (
    <>
      <style>{`
        .game-card-wrap { transition: all 0.25s ease; border-radius: var(--ccc-radius-2xl); overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(30,41,59,0.04), 0 4px 12px rgba(30,41,59,0.04); }
        .game-card-wrap:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(30,41,59,0.08), 0 2px 8px rgba(30,41,59,0.04); }
        .game-card-wrap.game-locked { opacity: 0.6; }
        .game-card-wrap.game-locked:hover { transform: none; box-shadow: 0 1px 3px rgba(30,41,59,0.04), 0 4px 12px rgba(30,41,59,0.04); }
        .game-cta-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 10px 0; border-radius: var(--ccc-radius-lg); color: #fff; font: var(--ccc-label); font-weight: 600; text-decoration: none; transition: all 0.15s ease; border: none; cursor: pointer; }
        .game-cta-btn:hover { opacity: 0.9; transform: scale(1.02); }
        .game-cta-btn:active { transform: scale(0.98); }
        .game-filter-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: var(--ccc-radius-full); font: var(--ccc-caption); font-weight: 700; border: none; cursor: pointer; transition: all 0.2s ease; }
        .game-filter-btn:hover { transform: translateY(-1px); }
        .game-filter-btn:active { transform: scale(0.96); }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-2xl)" }} dir="rtl">

        {/* ════════════════════════════════════════════════════════════
          ❶ HERO — ساحة البرمجة مع ملخص سريع
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
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>ساحة التحديات البرمجية</span>
              </div>
              <h1 style={{
                font: "700 24px/32px var(--ccc-font-sans)",
                color: "var(--ccn-900)", margin: 0,
              }}>
                ساحة البرمجة التفاعلية
              </h1>
              <p style={{
                font: "var(--ccc-body-sm)", color: "var(--ccn-500)",
                marginTop: 4, maxWidth: 520,
              }}>
                حلّ تحديات برمجية حقيقية وأثبت مهاراتك — كل تحدٍّ ناجح = عملات CC وإنجازات حصرية!
              </p>
            </div>

            {/* Mini stats row */}
            <div style={{ display: "flex", gap: "var(--ccc-space-md)", flexWrap: "wrap" }}>
              {[
                { icon: Gamepad2, value: unlockedCount, label: "تحدي متاح", color: "var(--ccc-500)" },
                { icon: Trophy, value: `${totalReward} CC`, label: "إجمالي المكافآت", color: "var(--cca-500)" },
                { icon: Target, value: "متدرّج", label: "مستوى الصعوبة", color: "var(--ccs-500)" },
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
          ❷ FILTER TABS + SECTION TITLE
          ════════════════════════════════════════════════════════════ */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "var(--ccc-space-md)",
          paddingBottom: "var(--ccc-space-sm)",
          borderBottom: "1px solid var(--ccn-200)",
        }}>
          <h2 style={{
            font: "700 18px/26px var(--ccc-font-sans)", color: "var(--ccn-900)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Layers className="w-5 h-5" style={{ color: "var(--ccc-500)" }} />
            التحديات البرمجية
          </h2>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="game-filter-btn"
                style={{
                  background: filter === f.key
                    ? "var(--ccc-500)"
                    : "color-mix(in srgb, var(--ccc-500) 4%, #fff)",
                  color: filter === f.key ? "#fff" : "var(--ccn-600)",
                  boxShadow: filter === f.key
                    ? "0 2px 8px rgba(43,76,126,0.2)"
                    : "none",
                }}
              >
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
          ❸ CHALLENGES GRID
          ════════════════════════════════════════════════════════════ */}
        <div className="sm:grid-cols-2 xl:grid-cols-3" style={{
          display: "grid", gap: "var(--ccc-space-lg)",
        }}>
          {filtered.map((challenge) => {
            const diff = diffConfig[challenge.difficulty]
            const lang = langConfig[challenge.language]

            return (
              <div
                key={challenge.id}
                className={`game-card-wrap${challenge.locked ? " game-locked" : ""}`}
              >
                {/* Cover area */}
                <div style={{
                  height: 100,
                  background: diff.coverBg,
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
                    <Gamepad2 className="w-20 h-20" style={{ color: "rgba(255,255,255,0.5)" }} />
                  </div>

                  {/* Lock badge or Difficulty badge */}
                  {challenge.locked ? (
                    <span style={{
                      padding: "3px 10px", borderRadius: "var(--ccc-radius-full)",
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(8px)",
                      font: "var(--ccc-micro)", fontWeight: 700,
                      color: "rgba(255,255,255,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex", alignItems: "center", gap: 4,
                      position: "relative", zIndex: 1,
                    }}>
                      <Lock className="w-3 h-3" />
                      مقفل
                    </span>
                  ) : (
                    <span style={{
                      padding: "3px 10px", borderRadius: "var(--ccc-radius-full)",
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(8px)",
                      font: "var(--ccc-micro)", fontWeight: 700,
                      color: "rgba(255,255,255,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      position: "relative", zIndex: 1,
                    }}>
                      {diff.label}
                    </span>
                  )}

                  {/* Language icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "var(--ccc-radius-lg)",
                    background: lang.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", zIndex: 1,
                    border: "1px solid rgba(255,255,255,0.15)",
                    backdropFilter: "blur(4px)",
                  }}>
                    <Code2 className="w-4 h-4" style={{ color: lang.iconColor }} />
                  </div>
                </div>

                {/* Content */}
                <div style={{
                  padding: "var(--ccc-space-lg)",
                  display: "flex", flexDirection: "column", flex: 1,
                  gap: "var(--ccc-space-md)",
                }}>
                  {/* Title + description */}
                  <div>
                    <h2 style={{
                      font: "700 15px/22px var(--ccc-font-sans)",
                      color: "var(--ccn-900)", margin: 0,
                    }}>
                      {challenge.title}
                    </h2>
                    <p style={{
                      font: "var(--ccc-caption)",
                      color: "var(--ccn-500)",
                      marginTop: 4,
                      lineHeight: 1.7,
                      overflow: "hidden", textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {challenge.description}
                    </p>
                  </div>

                  {/* Reward + tags row */}
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", flexWrap: "wrap",
                    gap: "var(--ccc-space-sm)",
                  }}>
                    {/* Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {challenge.tags.map((tag) => (
                        <span key={tag} style={{
                          font: "var(--ccc-micro)", fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "var(--ccc-radius-md)",
                          background: "var(--ccn-50)",
                          color: "var(--ccn-500)",
                          border: "1px solid var(--ccn-200)",
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Reward */}
                    <span style={{
                      font: "var(--ccc-micro)", fontWeight: 700,
                      color: "var(--cca-500)",
                      background: "color-mix(in srgb, var(--cca-500) 8%, transparent)",
                      padding: "2px 8px",
                      borderRadius: "var(--ccc-radius-md)",
                      whiteSpace: "nowrap",
                    }}>
                      +{challenge.reward} CC
                    </span>
                  </div>

                  {/* CTA */}
                  {challenge.locked ? (
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "10px 0", width: "100%",
                      borderRadius: "var(--ccc-radius-lg)",
                      background: "var(--ccn-50)",
                      color: "var(--ccn-400)",
                      font: "var(--ccc-label)", fontWeight: 600,
                      marginTop: "auto",
                    }}>
                      <Lock className="w-4 h-4" />
                      أكمل التحديات السابقة
                    </div>
                  ) : (
                    <Link
                      href={`/dashboard/student/games/${challenge.id}`}
                      className="game-cta-btn"
                      style={{
                        background: diff.accent,
                        boxShadow: "0 1px 2px rgba(30,41,59,0.08)",
                        marginTop: "auto",
                      }}
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>ابدأ التحدي</span>
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
