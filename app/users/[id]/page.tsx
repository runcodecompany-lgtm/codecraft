import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import Link from "next/link"
import { Trophy, Zap, Flame, Award, Calendar, Globe, MapPin, Mail, ChevronRight, MessageSquare, ArrowLeft, BookOpen } from "lucide-react"
import FollowButton from "./follow-button"

interface Props {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params
    const user = await prisma.user.findUnique({
        where: { id },
        select: { name: true }
    })
    return {
        title: user ? `الملف الشخصي لـ ${user.name} | Code Craft Core` : "العضو",
    }
}

async function getUserProfile(id: string) {
    try {
        return await prisma.user.findUnique({
            where: { id },
            include: {
                achievements: {
                    orderBy: { createdAt: "desc" },
                },
                certificates: {
                    include: {
                        course: {
                            select: { title: true }
                        }
                    },
                    orderBy: { createdAt: "desc" },
                },
                activityFeed: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        })
    } catch {
        return null
    }
}

export default async function UserProfilePage({ params }: Props) {
    const { id } = await params
    const user = await getUserProfile(id)

    if (!user) {
        notFound()
    }

    const session = await getServerSession()
    const isCurrentUser = session?.id === user.id

    // Check if current user is following this user
    let isFollowing = false
    if (session?.id && !isCurrentUser) {
        const follow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: session.id,
                    followingId: user.id,
                },
            },
        })
        isFollowing = !!follow
    }

    // Format role label
    const roleLabels: Record<string, string> = {
        GUEST: "ضيف",
        STUDENT: "طالب",
        TEACHER: "معلم",
        ADMIN: "مسؤول",
        SUPER_ADMIN: "مدير النظام",
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
            {/* Header Banner */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white py-14 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>
                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="flex items-center gap-2 text-indigo-300 text-sm mb-6">
                        <Link href="/community" className="hover:text-white transition-colors">المجتمع</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span>الملف الشخصي</span>
                    </div>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-right">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-500/20 border-4 border-slate-900">
                                {user.name?.charAt(0) || "?"}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white font-bold text-xs px-2.5 py-1 rounded-full border-2 border-slate-900">
                                لفل {user.level}
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                                <h1 className="text-3xl font-black">{user.name || "عضو مجهول"}</h1>
                                <span className="inline-flex self-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    {roleLabels[user.role] || user.role}
                                </span>
                            </div>
                            
                            {user.bio ? (
                                <p className="text-slate-300 mt-3 max-w-2xl text-sm leading-relaxed">{user.bio}</p>
                            ) : (
                                <p className="text-slate-400 mt-3 text-sm italic">لا توجد سيرة ذاتية مكتوبة بعد.</p>
                            )}

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-xs text-slate-300">
                                {user.website && (
                                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                                        <Globe className="w-4 h-4" />
                                        <span>الموقع الإلكتروني</span>
                                    </a>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span>انضم في {new Date(user.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0">
                            {!isCurrentUser && session && (
                                <>
                                    <FollowButton targetUserId={user.id} initialIsFollowing={isFollowing} />
                                    <Link
                                        href={`/community/messages?startUser=${user.id}`}
                                        className="inline-flex items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700 shadow-sm"
                                        title="إرسال رسالة"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl text-center">
                        <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{user.reputation}</div>
                        <div className="text-xs text-slate-400 font-bold mt-1">السمعة المكتسبة</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl text-center">
                        <div className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
                            <Zap className="w-5 h-5" />
                            {user.xp}
                        </div>
                        <div className="text-xs text-slate-400 font-bold mt-1">نقاط الخبرة XP</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl text-center">
                        <div className="text-2xl font-black text-orange-500 flex items-center justify-center gap-1">
                            <Flame className="w-5 h-5" />
                            {user.streakCount}
                        </div>
                        <div className="text-xs text-slate-400 font-bold mt-1">سلسلة النشاط اليومي</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl text-center">
                        <div className="text-2xl font-black text-slate-800 dark:text-white">
                            {user.totalFollowers} / {user.totalFollowing}
                        </div>
                        <div className="text-xs text-slate-400 font-bold mt-1">المتابعون / يتابع</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Certificates and Recent activity */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Certificates */}
                        <section className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-6 rounded-2xl">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-indigo-600" />
                                الشهادات المعتمدة ({user.certificates.length})
                            </h2>
                            {user.certificates.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    لم يحصل على أي شهادات حتى الآن.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {user.certificates.map((cert) => (
                                        <div key={cert.id} className="p-4 border border-slate-200/60 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-500/30 transition-all flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                                                🎓
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-sm text-slate-850 dark:text-white truncate">{cert.course.title}</h4>
                                                <p className="text-xs text-slate-400 mt-1">رقم: {cert.certificateNumber}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">بتاريخ: {new Date(cert.createdAt).toLocaleDateString("ar-EG")}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Recent Activity */}
                        <section className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-6 rounded-2xl">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-600" />
                                النشاط الأخير
                            </h2>
                            {user.activityFeed.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    لا يوجد نشاط مسجل مؤخراً.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {user.activityFeed.map((activity) => {
                                        const meta = (activity.data as any) || {}
                                        return (
                                            <div key={activity.id} className="flex gap-3 text-sm pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                                                <div className="text-lg shrink-0">
                                                    {activity.type === "FORUM_TOPIC" ? "💬" : activity.type === "ANSWER" ? "✅" : "❓"}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-slate-700 dark:text-slate-350">
                                                        {activity.type === "FORUM_TOPIC" && `أنشأ موضوعاً في المنتدى: ${meta.title || ""}`}
                                                        {activity.type === "QUESTION" && `طرح سؤالاً جديداً: ${meta.title || ""}`}
                                                        {activity.type === "ANSWER" && "أجاب على سؤال في قسم الأسئلة والأجوبة"}
                                                        {!["FORUM_TOPIC", "QUESTION", "ANSWER"].includes(activity.type) && `قام بنشاط: ${activity.type}`}
                                                    </p>
                                                    <span className="text-xs text-slate-400 mt-1 block">
                                                        {new Date(activity.createdAt).toLocaleDateString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Achievements & Badges */}
                    <div className="space-y-8">
                        <section className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-6 rounded-2xl">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-indigo-600" />
                                الإنجازات المحققة ({user.achievements.length})
                            </h2>
                            {user.achievements.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    لم يفتح أي إنجازات بعد.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {user.achievements.map((ach) => (
                                        <div key={ach.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900">
                                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-xl shrink-0">
                                                🏆
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-xs text-slate-850 dark:text-white truncate">{ach.title}</h4>
                                                <p className="text-[11px] text-slate-400 truncate">{ach.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </main>
    )
}
