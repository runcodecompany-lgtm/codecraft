// app/dashboard/student/achievements/page.tsx
import React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import {
  Trophy, Star, Flame, BookOpen, Target, Medal, Zap, Lock, CheckCircle2, Sparkles, Layers, Coins,
} from "lucide-react"

export const dynamic = "force-dynamic"

const rarityConfig = {
  "شائع": { color: "var(--ccn-400)", label: "شائع", barBg: "var(--ccn-300)" },
  "غير شائع": { color: "var(--ccs-500)", label: "غير شائع", barBg: "var(--ccs-500)" },
  "نادر": { color: "var(--ccc-500)", label: "نادر", barBg: "var(--ccc-500)" },
  "أسطوري": { color: "var(--cca-500)", label: "أسطوري", barBg: "var(--cca-500)" },
}

export default async function StudentAchievementsPage() {
  const session = await getServerSession()
  if (!session) redirect("/login")
  if (session.role !== "STUDENT" && session.role !== "TEACHER" && session.role !== "ADMIN") {
    redirect("/")
  }

  const completedLessons = await prisma.userProgress.count({
    where: { userId: session.id, isCompleted: true },
  })
  const level = Math.floor(session.craftCoins / 100) + 1

  const achievements = [
    {
      id: "first-lesson",
      title: "البداية دائماً صعبة",
      description: "أكمل درسك الأول",
      icon: BookOpen,
      iconBg: "color-mix(in srgb, var(--ccs-500) 12%, transparent)",
      iconColor: "var(--ccs-500)",
      unlocked: completedLessons >= 1,
      progress: Math.min(completedLessons, 1),
      total: 1,
      reward: 50,
      rarity: "شائع" as const,
    },
    {
      id: "five-lessons",
      title: "صانع العادات",
      description: "أكمل 5 دروس برمجية",
      icon: Target,
      iconBg: "color-mix(in srgb, var(--ccc-500) 12%, transparent)",
      iconColor: "var(--ccc-500)",
      unlocked: completedLessons >= 5,
      progress: Math.min(completedLessons, 5),
      total: 5,
      reward: 100,
      rarity: "غير شائع" as const,
    },
    {
      id: "ten-lessons",
      title: "متعلم ملتزم",
      description: "أكمل 10 دروس برمجية",
      icon: Flame,
      iconBg: "color-mix(in srgb, #EA580C 12%, transparent)",
      iconColor: "#EA580C",
      unlocked: completedLessons >= 10,
      progress: Math.min(completedLessons, 10),
      total: 10,
      reward: 200,
      rarity: "نادر" as const,
    },
    {
      id: "streak-7",
      title: "الثبات أساس النجاح",
      description: "حافظ على streak لمدة 7 أيام",
      icon: Flame,
      iconBg: "color-mix(in srgb, #DC2626 12%, transparent)",
      iconColor: "#DC2626",
      unlocked: (session.streakCount ?? 0) >= 7,
      progress: Math.min(session.streakCount ?? 0, 7),
      total: 7,
      reward: 150,
      rarity: "نادر" as const,
    },
    {
      id: "coins-500",
      title: "مجمّع العملات",
      description: "اجمع 500 عملة Craft Coins",
      icon: Trophy,
      iconBg: "color-mix(in srgb, var(--cca-500) 12%, transparent)",
      iconColor: "var(--cca-500)",
      unlocked: session.craftCoins >= 500,
      progress: Math.min(session.craftCoins, 500),
      total: 500,
      reward: 100,
      rarity: "غير شائع" as const,
    },
    {
      id: "level-5",
      title: "محترف صاعد",
      description: "ابلغ المستوى الخامس",
      icon: Star,
      iconBg: "color-mix(in srgb, #7C3AED 12%, transparent)",
      iconColor: "#7C3AED",
      unlocked: level >= 5,
      progress: Math.min(level, 5),
      total: 5,
      reward: 300,
      rarity: "أسطوري" as const,
    },
    {
      id: "coins-1000",
      title: "الثروة البرمجية",
      description: "اجمع 1000 عملة Craft Coins",
      icon: Medal,
      iconBg: "color-mix(in srgb, #CA8A04 12%, transparent)",
      iconColor: "#CA8A04",
      unlocked: session.craftCoins >= 1000,
      progress: Math.min(session.craftCoins, 1000),
      total: 1000,
      reward: 250,
      rarity: "نادر" as const,
    },
    {
      id: "twenty-lessons",
      title: "خبير البرمجة",
      description: "أكمل 20 درساً برمجياً",
      icon: Zap,
      iconBg: "color-mix(in srgb, #06B6D4 12%, transparent)",
      iconColor: "#06B6D4",
      unlocked: completedLessons >= 20,
      progress: Math.min(completedLessons, 20),
      total: 20,
      reward: 400,
      rarity: "أسطوري" as const,
    },
  ]

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalCount = achievements.length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ccc-space-2xl)" }} dir="rtl">
      {/* ════════════════════════════════════════════════════════════
        ❶ HERO — لوحة الإنجازات مع ملخص سريع
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
              <Trophy className="w-3.5 h-3.5" />
              <span>لوحة الإنجازات</span>
            </div>
            <h1 style={{
              font: "700 24px/32px var(--ccc-font-sans)",
              color: "var(--ccn-900)", margin: 0,
            }}>
              إنجازاتي ومكافآتي
            </h1>
            <p style={{
              font: "var(--ccc-body-sm)", color: "var(--ccn-500)",
              marginTop: 4, maxWidth: 480,
            }}>
              أنجزت <strong style={{ color: "var(--ccc-500)" }}>{unlockedCount}</strong> من أصل <strong>{totalCount}</strong> إنجاز — واصل التعلّم لفتح المزيد!
            </p>
          </div>

          {/* Mini stats row */}
          <div style={{ display: "flex", gap: "var(--ccc-space-md)", flexWrap: "wrap" }}>
            {[
              { icon: Trophy, value: `${unlockedCount}/${totalCount}`, label: "مفتوح", color: "var(--ccc-500)" },
              { icon: CheckCircle2, value: completedLessons, label: "درس مكتمل", color: "var(--ccs-500)" },
              { icon: Flame, value: `${session.streakCount ?? 0} يوم`, label: "استمرار", color: "var(--cca-500)" },
              { icon: Star, value: `المستوى ${level}`, label: "الخبرة", color: "#7C3AED" },
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
        ❷ SECTION TITLE
        ════════════════════════════════════════════════════════════ */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingBottom: "var(--ccc-space-sm)",
        borderBottom: "1px solid var(--ccn-200)",
      }}>
        <h2 style={{
          font: "700 18px/26px var(--ccc-font-sans)", color: "var(--ccn-900)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Medal className="w-5 h-5" style={{ color: "var(--ccc-500)" }} />
          جميع الإنجازات
        </h2>
        <div style={{ display: "flex", gap: "var(--ccc-space-md)", font: "var(--ccc-caption)", fontWeight: 700 }}>
          <span style={{ color: "var(--ccs-500)", display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {unlockedCount} مفتوح
          </span>
          <span style={{ color: "var(--ccn-400)", display: "flex", alignItems: "center", gap: 4 }}>
            <Lock className="w-3.5 h-3.5" />
            {totalCount - unlockedCount} مقفل
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
        ❸ ACHIEVEMENTS GRID
        ════════════════════════════════════════════════════════════ */}
      <div className="sm:grid-cols-2 xl:grid-cols-3" style={{
        display: "grid", gap: "var(--ccc-space-lg)",
      }}>
        {achievements.map((ach) => {
          const progressPct = Math.round((ach.progress / ach.total) * 100)
          const Icon = ach.icon
          const rarity = rarityConfig[ach.rarity]
          const isUnlocked = ach.unlocked

          return (
            <div
              key={ach.id}
              style={{
                position: "relative",
                display: "flex", flexDirection: "column",
                padding: "var(--ccc-space-lg)",
                borderRadius: "var(--ccc-radius-2xl)",
                background: "#fff",
                boxShadow: isUnlocked
                  ? "0 1px 3px rgba(30,41,59,0.04), 0 4px 12px rgba(30,41,59,0.04)"
                  : "0 1px 2px rgba(30,41,59,0.02), 0 2px 6px rgba(30,41,59,0.02)",
                opacity: isUnlocked ? 1 : 0.55,
                borderTop: `3px solid ${rarity.color}`,
                transition: "all 0.25s ease",
              }}
            >
              {/* Status badge — top left */}
              <div style={{
                position: "absolute", top: 12, left: 12,
              }}>
                {isUnlocked ? (
                  <CheckCircle2 className="w-5 h-5" style={{ color: "var(--ccs-500)" }} />
                ) : (
                  <Lock className="w-4 h-4" style={{ color: "var(--ccn-300)" }} />
                )}
              </div>

              {/* Rarity badge — top right */}
              <div style={{
                position: "absolute", top: 12, right: 12,
                font: "var(--ccc-micro)", fontWeight: 700,
                padding: "2px 8px", borderRadius: "var(--ccc-radius-full)",
                background: `color-mix(in srgb, ${rarity.color} 8%, transparent)`,
                color: rarity.color,
                border: `1px solid color-mix(in srgb, ${rarity.color} 12%, transparent)`,
              }}>
                {rarity.label}
              </div>

              {/* Icon */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 56, height: 56,
                borderRadius: "var(--ccc-radius-xl)",
                background: ach.iconBg,
                marginBottom: "var(--ccc-space-md)",
                marginTop: 8,
              }}>
                <Icon className="w-7 h-7" style={{ color: ach.iconColor }} />
              </div>

              {/* Content */}
              <div style={{
                display: "flex", flexDirection: "column", flex: 1,
                gap: "var(--ccc-space-xs)",
              }}>
                <h3 style={{
                  font: "700 15px/22px var(--ccc-font-sans)",
                  color: "var(--ccn-900)", margin: 0,
                }}>
                  {ach.title}
                </h3>
                <p style={{
                  font: "var(--ccc-caption)",
                  color: "var(--ccn-500)", margin: 0,
                  lineHeight: 1.6,
                }}>
                  {ach.description}
                </p>
              </div>

              {/* Bottom row: reward + status */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginTop: "var(--ccc-space-md)",
                paddingTop: "var(--ccc-space-md)",
                borderTop: "1px solid var(--ccn-200)",
              }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  font: "var(--ccc-micro)", fontWeight: 700,
                  color: "var(--cca-500)",
                  background: "color-mix(in srgb, var(--cca-500) 8%, transparent)",
                  padding: "3px 10px", borderRadius: "var(--ccc-radius-md)",
                }}>
                  <Coins className="w-3 h-3" />
                  {ach.reward} CC
                </span>

                {isUnlocked ? (
                  <span style={{
                    font: "var(--ccc-caption)", fontWeight: 700,
                    color: "var(--ccs-500)",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    مكتمل
                  </span>
                ) : (
                  <span style={{ font: "var(--ccc-caption)", color: "var(--ccn-400)" }}>
                    {ach.progress} / {ach.total}
                  </span>
                )}
              </div>

              {/* Progress bar — locked only */}
              {!isUnlocked && (
                <div style={{ marginTop: "var(--ccc-space-sm)" }}>
                  <div style={{
                    height: 4,
                    background: "var(--ccn-200)",
                    borderRadius: "var(--ccc-radius-full)",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      borderRadius: "var(--ccc-radius-full)",
                      background: rarity.barBg,
                      width: `${progressPct}%`,
                      transition: "width 0.7s ease",
                    }} />
                  </div>
                  <p style={{
                    font: "var(--ccc-micro)", color: "var(--ccn-400)",
                    marginTop: 2, margin: "2px 0 0 0",
                  }}>
                    {progressPct}% مكتمل
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
