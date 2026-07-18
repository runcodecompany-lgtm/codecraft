import React from "react"
import prisma from "@/lib/prisma"
import { Trophy, Flame, Coins } from "lucide-react"

const medals: Record<number, { emoji: string; ring: string; bg: string; label: string }> = {
  0: {
    emoji: "🥇",
    ring: "ring-2 ring-amber-400/60",
    bg: "bg-gradient-to-br from-amber-500/20 to-yellow-500/10",
    label: "المرتبة الأولى",
  },
  1: {
    emoji: "🥈",
    ring: "ring-2 ring-slate-400/60",
    bg: "bg-gradient-to-br from-slate-400/20 to-slate-500/10",
    label: "المرتبة الثانية",
  },
  2: {
    emoji: "🥉",
    ring: "ring-2 ring-amber-700/60",
    bg: "bg-gradient-to-br from-amber-700/20 to-amber-900/10",
    label: "المرتبة الثالثة",
  },
}

export default async function Leaderboard() {
  const topStudents = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: [{ craftCoins: "desc" }, { streakCount: "desc" }],
    take: 10,
    select: {
      id: true,
      name: true,
      email: true,
      craftCoins: true,
      streakCount: true,
    },
  })

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800 bg-slate-950/40">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">لوحة الشرف العالمية</h2>
          <p className="text-xs text-slate-400 mt-0.5">أفضل 10 طلاب بناءً على العملات والشعلة</p>
        </div>
      </div>

      {/* List */}
      <ul className="divide-y divide-slate-800/60">
        {topStudents.length === 0 && (
          <li className="py-12 text-center text-slate-500 italic text-sm">
            لا يوجد طلاب مسجلون بعد.
          </li>
        )}

        {topStudents.map((student, idx) => {
          const medal = medals[idx]
          const initials = (student.name ?? student.email ?? "?")
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase()

          return (
            <li
              key={student.id}
              className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-800/30 ${
                medal ? medal.bg : ""
              }`}
            >
              {/* Rank */}
              <span className="w-7 text-center text-lg font-black text-slate-400 flex-shrink-0">
                {medal ? medal.emoji : `#${idx + 1}`}
              </span>

              {/* Avatar */}
              <div
                className={`flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white ${
                  medal ? medal.ring : ""
                }`}
              >
                {initials}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">
                  {student.name ?? student.email}
                </p>
                {medal && (
                  <p className="text-[10px] text-slate-400 font-medium">{medal.label}</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs flex-shrink-0">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Coins className="w-3.5 h-3.5" />
                  {student.craftCoins.toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-orange-400 font-bold">
                  <Flame className="w-3.5 h-3.5" />
                  {student.streakCount}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
