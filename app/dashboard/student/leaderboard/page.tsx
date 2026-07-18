// app/dashboard/student/leaderboard/page.tsx
import React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { Trophy, Flame, Coins, Zap, BookOpen, Brain, ChevronLeft, ArrowRight } from "lucide-react"
import StatCard from "@/components/stat-card"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ sortBy?: string }>
}

const medals: Record<number, { emoji: string; ring: string; bg: string }> = {
  0: {
    emoji: "🥇",
    ring: "ring-2 ring-amber-400/60",
    bg: "bg-gradient-to-br from-amber-500/20 to-yellow-500/10 dark:from-amber-500/10 dark:to-yellow-500/5",
  },
  1: {
    emoji: "🥈",
    ring: "ring-2 ring-slate-400/60",
    bg: "bg-gradient-to-br from-slate-400/20 to-slate-500/10 dark:from-slate-400/10 dark:to-slate-500/5",
  },
  2: {
    emoji: "🥉",
    ring: "ring-2 ring-amber-700/60",
    bg: "bg-gradient-to-br from-amber-700/20 to-amber-900/10 dark:from-amber-700/10 dark:to-amber-900/5",
  },
}

export default async function StudentLeaderboardPage({ searchParams }: Props) {
  const session = await getServerSession()
  if (!session) redirect("/login")
  if (session.role !== "STUDENT" && session.role !== "TEACHER" && session.role !== "ADMIN") {
    redirect("/")
  }

  const { sortBy = "xp" } = await searchParams

  // Fetch top students based on the sort filter
  let students: any[] = []
  
  if (sortBy === "coins") {
    students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { craftCoins: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        avatar: true,
        craftCoins: true,
        xp: true,
        level: true,
        _count: { select: { enrollments: true, quizAttempts: { where: { isPassed: true } } } },
      },
    })
  } else if (sortBy === "courses") {
    students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { enrollments: { _count: "desc" } },
      take: 20,
      select: {
        id: true,
        name: true,
        avatar: true,
        craftCoins: true,
        xp: true,
        level: true,
        _count: { select: { enrollments: true, quizAttempts: { where: { isPassed: true } } } },
      },
    })
  } else if (sortBy === "quizzes") {
    students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { quizAttempts: { _count: "desc" } }, // Sorting by total quiz attempts
      take: 20,
      select: {
        id: true,
        name: true,
        avatar: true,
        craftCoins: true,
        xp: true,
        level: true,
        _count: { select: { enrollments: true, quizAttempts: { where: { isPassed: true } } } },
      },
    })
  } else {
    // Default: Sort by XP
    students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { xp: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        avatar: true,
        craftCoins: true,
        xp: true,
        level: true,
        _count: { select: { enrollments: true, quizAttempts: { where: { isPassed: true } } } },
      },
    })
  }

  // Find current user rank
  const allStudentsOrdered = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: sortBy === "coins" 
      ? { craftCoins: "desc" } 
      : sortBy === "courses" 
      ? { enrollments: { _count: "desc" } } 
      : sortBy === "quizzes" 
      ? { quizAttempts: { _count: "desc" } } 
      : { xp: "desc" },
    select: { id: true },
  })

  const myRank = allStudentsOrdered.findIndex((s) => s.id === session.id) + 1

  return (
    <div className="space-y-8" dir="rtl">
      {/* ── Page Hero ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100/80 dark:border-indigo-950/40 bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-bold mb-3">
              <Trophy className="h-3.5 w-3.5 animate-bounce" />
              <span>المنافسة البرمجية الشريفة</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">لوحة الصدارة</h1>
            <p className="text-indigo-200 text-sm mt-2 max-w-xl">
              تصفح الترتيب العام لأفضل طلاب منصة Code Craft Core وتنافس مع زملائك برمجياً!
            </p>
          </div>

          {/* Current Student Rank */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md self-start lg:self-center text-center min-w-[160px]">
            <p className="text-xs font-bold text-indigo-300 mb-1">ترتيبك الحالي</p>
            <p className="text-4xl font-black">
              {myRank > 0 ? `#${myRank}` : "غير مصنف"}
            </p>
            <p className="text-indigo-300 text-xs mt-1 font-bold">بين جميع طلاب المنصة 🌟</p>
          </div>
        </div>
      </div>

      {/* ── Sorting Tabs ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "xp", label: "أعلى خبرة (XP)", icon: Zap },
            { id: "coins", label: "أكثر عملات (CC)", icon: Coins },
            { id: "courses", label: "أكثر دورات", icon: BookOpen },
            { id: "quizzes", label: "أكثر اختبارات", icon: Brain },
          ].map((tab) => {
            const Icon = tab.icon
            const active = sortBy === tab.id
            return (
              <Link
                key={tab.id}
                href={`/dashboard/student/leaderboard?sortBy=${tab.id}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/10"
                    : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </div>

        <span className="text-xs text-gray-500 dark:text-slate-500 font-bold">
          آخر تحديث: تلقائي ومستمر
        </span>
      </div>

      {/* ── Leaderboard List ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 dark:border-slate-800 text-xs font-black text-gray-400 dark:text-slate-500 uppercase">
          <div className="col-span-1 text-center">الترتيب</div>
          <div className="col-span-5 sm:col-span-6">الطالب</div>
          <div className="col-span-2 text-center">المستوى</div>
          <div className="col-span-2 text-center">نقاط XP</div>
          <div className="col-span-2 text-center">العملات</div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-800/60">
          {students.map((student, idx) => {
            const medal = medals[idx]
            const name = student.name || "طالب كرافت"
            const initials = name
              .split(" ")
              .slice(0, 2)
              .map((w: string) => w[0])
              .join("")
              .toUpperCase()
            const isMe = student.id === session.id

            return (
              <div
                key={student.id}
                className={`grid grid-cols-12 gap-4 px-6 py-4.5 items-center transition-colors ${
                  isMe
                    ? "bg-indigo-500/5 dark:bg-indigo-500/5 border-r-4 border-indigo-600"
                    : medal
                    ? medal.bg
                    : "hover:bg-gray-50/50 dark:hover:bg-slate-800/20"
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 text-center font-black text-sm flex items-center justify-center">
                  {medal ? (
                    <span className="text-xl">{medal.emoji}</span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600">#{idx + 1}</span>
                  )}
                </div>

                {/* Student Info */}
                <div className="col-span-5 sm:col-span-6 flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-black text-white ${
                      medal ? medal.ring : ""
                    }`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${isMe ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                      {name} {isMe && <span className="text-[10px] bg-indigo-500/10 px-1.5 py-0.5 rounded font-black">(أنت)</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 sm:block hidden">
                      {student._count.enrollments} دورة ملتحق بها · {student._count.quizAttempts} اختبار ناجح
                    </p>
                  </div>
                </div>

                {/* Level */}
                <div className="col-span-2 text-center text-xs font-black text-slate-600 dark:text-slate-400">
                  {student.level}
                </div>

                {/* XP */}
                <div className="col-span-2 text-center text-sm font-black text-slate-900 dark:text-white font-mono">
                  {student.xp.toLocaleString("ar")}
                </div>

                {/* Coins */}
                <div className="col-span-2 text-center text-xs font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 font-mono">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{student.craftCoins.toLocaleString("ar")}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
