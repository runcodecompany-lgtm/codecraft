import Link from "next/link"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { Trophy, Zap, Star, MessageSquare, ChevronRight } from "lucide-react"

export const metadata = {
    title: "لوحة الصدارة المجتمعية | Code Craft Core",
}

interface Props {
    searchParams: Promise<{ sortBy?: string; period?: string }>
}

const sortOptions = [
    { id: "reputation", label: "أعلى سمعة", icon: "⭐" },
    { id: "xp", label: "أعلى XP", icon: "⚡" },
    { id: "activity", label: "أكثر نشاطاً", icon: "📊" },
    { id: "contribution", label: "أكثر مساهمة", icon: "💬" },
]

const periodOptions = [
    { id: "all", label: "الإجمالي" },
    { id: "monthly", label: "شهري" },
    { id: "weekly", label: "أسبوعي" },
]

async function getLeaderboardData(sortBy: string) {
    const take = 50
    const select = {
        id: true,
        name: true,
        avatar: true,
        xp: true,
        level: true,
        reputation: true,
        totalFollowers: true,
        streakCount: true,
        _count: {
            select: {
                forumTopics: true,
                forumReplies: true,
                qaAnswers: true,
                qaQuestions: true,
            },
        },
    }

    try {
        switch (sortBy) {
            case "reputation":
                return await prisma.user.findMany({
                    where: { reputation: { gt: 0 } },
                    orderBy: { reputation: "desc" },
                    take,
                    select,
                })
            case "activity":
                return await prisma.user.findMany({
                    orderBy: { activityFeed: { _count: "desc" } },
                    take,
                    select,
                })
            case "contribution":
                return await prisma.user.findMany({
                    orderBy: [{ forumTopics: { _count: "desc" } }],
                    take,
                    select,
                })
            default: // xp
                return await prisma.user.findMany({
                    where: { xp: { gt: 0 } },
                    orderBy: { xp: "desc" },
                    take,
                    select,
                })
        }
    } catch { return [] }
}

const medals: Record<number, { emoji: string; bg: string }> = {
    0: { emoji: "🥇", bg: "bg-amber-500/10 border-amber-400/30" },
    1: { emoji: "🥈", bg: "bg-slate-400/10 border-slate-400/30" },
    2: { emoji: "🥉", bg: "bg-amber-700/10 border-amber-700/30" },
}

export default async function CommunityLeaderboardPage({ searchParams }: Props) {
    const { sortBy = "xp", period = "all" } = await searchParams
    const [users, session] = await Promise.all([
        getLeaderboardData(sortBy),
        getServerSession(),
    ])

    const myRank = (users as any[]).findIndex(u => u.id === session?.id) + 1

    const getValue = (user: any) => {
        switch (sortBy) {
            case "reputation": return { value: user.reputation.toLocaleString("ar"), label: "سمعة" }
            case "activity": return { value: (user._count.forumTopics + user._count.qaQuestions + user._count.qaAnswers).toLocaleString("ar"), label: "مشاركة" }
            case "contribution": return { value: (user._count.forumTopics + user._count.forumReplies).toLocaleString("ar"), label: "مساهمة" }
            default: return { value: user.xp.toLocaleString("ar"), label: "XP" }
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
            {/* Hero */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-900 text-white py-12 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 text-indigo-300 text-sm mb-4">
                        <Link href="/community" className="hover:text-white transition-colors">المجتمع</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span>لوحة الصدارة</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black mb-2">🏆 لوحة الصدارة المجتمعية</h1>
                            <p className="text-indigo-200">تنافس مع أعضاء المجتمع على أعلى المراتب</p>
                        </div>
                        {session && myRank > 0 && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[120px]">
                                <p className="text-xs text-indigo-300 mb-1">ترتيبك</p>
                                <p className="text-3xl font-black">#{myRank}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Sort Tabs */}
                <div className="flex gap-2 flex-wrap mb-6">
                    {sortOptions.map(opt => (
                        <Link
                            key={opt.id}
                            href={`/community/leaderboard?sortBy=${opt.id}&period=${period}`}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${sortBy === opt.id
                                ? "bg-indigo-600 text-white border-indigo-500"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                            }`}
                        >
                            <span>{opt.icon}</span>
                            {opt.label}
                        </Link>
                    ))}
                </div>

                {/* Leaderboard */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-6">العضو</div>
                        <div className="col-span-2 text-center">المستوى</div>
                        <div className="col-span-3 text-center">النتيجة</div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {(users as any[]).map((user, idx) => {
                            const medal = medals[idx]
                            const val = getValue(user)
                            const isMe = user.id === session?.id
                            const initials = user.name?.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "?"

                            return (
                                <Link
                                    key={user.id}
                                    href={`/users/${user.id}`}
                                    className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${isMe ? "bg-indigo-500/5 border-r-4 border-indigo-600" : medal ? medal.bg : ""}`}
                                >
                                    <div className="col-span-1 text-center font-black text-sm">
                                        {medal ? <span className="text-xl">{medal.emoji}</span> : <span className="text-slate-400">#{idx + 1}</span>}
                                    </div>
                                    <div className="col-span-6 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                                            {initials}
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${isMe ? "text-indigo-600 dark:text-indigo-400" : ""}`}>
                                                {user.name || "عضو"}
                                                {isMe && <span className="text-[10px] bg-indigo-500/10 px-1.5 py-0.5 rounded mr-1">(أنت)</span>}
                                            </p>
                                            <p className="text-xs text-slate-400">{user.totalFollowers} متابع</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-center text-sm font-bold text-slate-500">{user.level}</div>
                                    <div className="col-span-3 text-center">
                                        <span className="text-sm font-black text-slate-900 dark:text-white">{val.value}</span>
                                        <span className="text-xs text-slate-400 mr-1">{val.label}</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {users.length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                        لا توجد بيانات بعد
                    </div>
                )}
            </div>
        </main>
    )
}
