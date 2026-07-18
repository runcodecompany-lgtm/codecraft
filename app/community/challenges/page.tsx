import Link from "next/link"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { Trophy, Zap, Star, Target, Calendar, CheckCircle, Lock, ChevronRight, Plus, Flame } from "lucide-react"

export const metadata = {
    title: "التحديات | Code Craft Core",
    description: "تحديات يومية وأسبوعية وموسمية بمكافآت XP وعملات",
}

async function getChallengesWithProgress(userId?: string) {
    try {
        const challenges = await prisma.challenge.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
            include: userId ? {
                completions: {
                    where: { userId },
                    select: { progress: true, isCompleted: true, completedAt: true },
                },
            } : undefined,
        })

        return {
            daily: challenges.filter(c => c.type === "DAILY"),
            weekly: challenges.filter(c => c.type === "WEEKLY"),
            events: challenges.filter(c => c.type === "EVENT"),
        }
    } catch { return { daily: [], weekly: [], events: [] } }
}

async function getUserStreak(userId?: string) {
    if (!userId) return null
    try {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: { streakCount: true, longestStreak: true, xp: true, craftCoins: true },
        })
    } catch { return null }
}

function ChallengeCard({ challenge, userId }: { challenge: any; userId?: string }) {
    const completion = challenge.completions?.[0]
    const isCompleted = completion?.isCompleted ?? false
    const progress = completion?.progress ?? 0
    const reqs = (challenge.requirements as any) || {}
    const targetCount = reqs.count || 1
    const progressPct = Math.min(100, Math.round((progress / targetCount) * 100))

    const typeColors: Record<string, string> = {
        DAILY: "from-amber-500 to-orange-600",
        WEEKLY: "from-indigo-500 to-violet-600",
        EVENT: "from-pink-500 to-rose-600",
    }

    const typeLabels: Record<string, string> = {
        DAILY: "يومي",
        WEEKLY: "أسبوعي",
        EVENT: "موسمي",
    }

    return (
        <div className={`relative p-5 rounded-2xl border transition-all ${isCompleted
            ? "border-emerald-400/50 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5"
            : "border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400/40 hover:shadow-md"
        }`}>
            {isCompleted && (
                <div className="absolute top-3 left-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
            )}

            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeColors[challenge.type] || typeColors.DAILY} flex items-center justify-center text-white text-xl shrink-0`}>
                    {challenge.type === "DAILY" ? "🎯" : challenge.type === "WEEKLY" ? "📅" : "🏆"}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${typeColors[challenge.type] || typeColors.DAILY}`}>
                            {typeLabels[challenge.type] || "تحدٍ"}
                        </span>
                        <h3 className="font-bold text-slate-900 dark:text-white">{challenge.title}</h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{challenge.description}</p>

                    {/* Progress */}
                    {userId && !isCompleted && targetCount > 1 && (
                        <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                <span>التقدم</span>
                                <span>{progress}/{targetCount}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Rewards */}
                    <div className="flex items-center gap-3 text-xs">
                        {challenge.xpReward > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                                <Zap className="w-3 h-3" /> +{challenge.xpReward} XP
                            </span>
                        )}
                        {challenge.coinsReward > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                                🪙 +{challenge.coinsReward}
                            </span>
                        )}
                        {challenge.endsAt && (
                            <span className="text-slate-400">
                                ينتهي {new Date(challenge.endsAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {isCompleted && completion?.completedAt && (
                <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    ✅ أكملت هذا التحدي في {new Date(completion.completedAt).toLocaleDateString("ar-EG", { month: "long", day: "numeric" })}
                </div>
            )}
        </div>
    )
}

export default async function ChallengesPage() {
    const session = await getServerSession()
    const [{ daily, weekly, events }, userStats] = await Promise.all([
        getChallengesWithProgress(session?.id),
        getUserStreak(session?.id),
    ])

    const allChallenges = [...daily, ...weekly, ...events]
    const completedCount = allChallenges.filter((c: any) => c.completions?.[0]?.isCompleted).length

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
            {/* Hero */}
            <div className="bg-gradient-to-br from-amber-950 via-slate-900 to-orange-900 text-white py-12 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 text-amber-300 text-sm mb-4">
                        <Link href="/community" className="hover:text-white transition-colors">المجتمع</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span>التحديات</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black mb-2">🏆 التحديات</h1>
                            <p className="text-amber-200">أكمل التحديات يومياً وأسبوعياً لكسب XP وعملات Craft</p>
                        </div>
                        {session && userStats && (
                            <div className="flex gap-4">
                                <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[100px]">
                                    <div className="text-2xl font-black flex items-center justify-center gap-1">
                                        <Flame className="w-5 h-5 text-amber-400" />
                                        {userStats.streakCount}
                                    </div>
                                    <div className="text-amber-300 text-xs mt-1">يوم متتالي</div>
                                </div>
                                <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[100px]">
                                    <div className="text-2xl font-black">{completedCount}</div>
                                    <div className="text-amber-300 text-xs mt-1">تحدٍ مكتمل</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
                {allChallenges.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/50">
                        <Trophy className="w-14 h-14 mx-auto text-slate-400 mb-4" />
                        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">لا توجد تحديات نشطة</h2>
                        <p className="text-slate-500">تحقق مجدداً قريباً!</p>
                    </div>
                ) : (
                    <>
                        {/* Daily Challenges */}
                        {daily.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                                        <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h2 className="text-xl font-black">التحديات اليومية</h2>
                                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                        تتجدد يومياً
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {daily.map((c: any) => (
                                        <ChallengeCard key={c.id} challenge={c} userId={session?.id} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Weekly Challenges */}
                        {weekly.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h2 className="text-xl font-black">التحديات الأسبوعية</h2>
                                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                        مكافآت أكبر
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {weekly.map((c: any) => (
                                        <ChallengeCard key={c.id} challenge={c} userId={session?.id} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Seasonal Events */}
                        {events.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-500/10 flex items-center justify-center">
                                        <Star className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <h2 className="text-xl font-black">الأحداث الموسمية</h2>
                                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                        محدودة الوقت
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {events.map((c: any) => (
                                        <ChallengeCard key={c.id} challenge={c} userId={session?.id} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* Streak Card */}
                {session && userStats && (
                    <section className="p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                        <div className="flex items-center gap-4">
                            <div className="text-5xl">🔥</div>
                            <div>
                                <h3 className="text-xl font-black">سلسلة النشاط</h3>
                                <p className="text-amber-100 text-sm">أنت على سلسلة {userStats.streakCount} يوم متتالي! أطول سلسلة: {userStats.longestStreak} يوم</p>
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-amber-100">
                            استمر في تسجيل الدخول يومياً للحفاظ على سلسلة نشاطك وكسب مكافآت متزايدة!
                        </div>
                    </section>
                )}
            </div>
        </main>
    )
}
