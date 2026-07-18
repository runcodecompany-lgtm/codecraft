import Link from "next/link"
import prisma from "@/lib/prisma"
import { MessageSquare, Code2, Brain, Database, Globe, Plus, ChevronRight, Users, Hash, Filter } from "lucide-react"
import { getServerSession } from "@/lib/auth"

export const metadata = {
    title: "المنتديات | Code Craft Core",
    description: "منتديات برمجية عربية - شارك معرفتك وتعلم من الآخرين",
}

const iconMap: Record<string, React.FC<any>> = {
    Code2, Brain, Database, Globe, MessageSquare, Hash,
}

interface Props {
    searchParams: Promise<{ track?: string }>
}

async function getForums(trackId?: string) {
    try {
        return await prisma.forum.findMany({
            where: { isActive: true, ...(trackId ? { trackId } : {}) },
            orderBy: { order: "asc" },
            include: {
                track: { select: { id: true, name: true } },
                _count: { select: { topics: true } },
                topics: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    include: { user: { select: { name: true } } },
                },
            },
        })
    } catch { return [] }
}

async function getStats() {
    try {
        const [topicCount, replyCount, userCount] = await Promise.all([
            prisma.forumTopic.count(),
            prisma.forumReply.count(),
            prisma.user.count({ where: { role: "STUDENT" } }),
        ])
        return { topicCount, replyCount, userCount }
    } catch { return { topicCount: 0, replyCount: 0, userCount: 0 } }
}

async function getTracks() {
    try {
        return await prisma.learningTrack.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true },
        })
    } catch {
        return []
    }
}

export default async function ForumsPage({ searchParams }: Props) {
    const { track } = await searchParams
    const [forums, stats, session, tracks] = await Promise.all([
        getForums(track),
        getStats(),
        getServerSession(),
        getTracks(),
    ])

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
            {/* Hero */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-2 text-indigo-300 text-sm mb-4">
                        <Link href="/community" className="hover:text-white transition-colors">المجتمع</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span>المنتديات</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black mb-3">💬 المنتديات</h1>
                            <p className="text-indigo-200 max-w-xl">
                                ناقش مواضيع برمجية، شارك تجاربك، واستفد من خبرات المجتمع العربي التقني.
                            </p>
                        </div>
                        {session && (
                            <Link
                                href="/community/forums/topic/new"
                                className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shrink-0"
                            >
                                <Plus className="w-5 h-5" />
                                موضوع جديد
                            </Link>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-10">
                        {[
                            { label: "موضوع", value: stats.topicCount.toLocaleString("ar") },
                            { label: "رد", value: stats.replyCount.toLocaleString("ar") },
                            { label: "عضو", value: stats.userCount.toLocaleString("ar") },
                        ].map((s) => (
                            <div key={s.label} className="text-center bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="text-3xl font-black">{s.value}</div>
                                <div className="text-indigo-300 text-sm mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Forums List */}
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                        <Filter className="w-3.5 h-3.5" />
                        تصفية حسب المسار:
                    </span>
                    <Link
                        href="/community/forums"
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border ${!track ? "bg-indigo-600 text-white border-indigo-500" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"}`}
                    >
                        جميع الأقسام
                    </Link>
                    {tracks.map((item) => (
                        <Link
                            key={item.id}
                            href={`/community/forums?track=${item.id}`}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${track === item.id ? "bg-indigo-600 text-white border-indigo-500" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"}`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                {forums.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/50">
                        <MessageSquare className="w-14 h-14 mx-auto text-slate-400 mb-4" />
                        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">لا توجد أقسام بعد</h2>
                        <p className="text-slate-500">سيتم إضافة أقسام المنتدى قريباً</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {forums.map((forum: any) => {
                            const Icon = iconMap[forum.icon] || MessageSquare
                            const lastTopic = forum.topics?.[0]
                            return (
                                <Link
                                    key={forum.id}
                                    href={`/community/forums/${forum.id}`}
                                    className="group flex items-center gap-5 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400/40 dark:hover:border-indigo-500/30 hover:shadow-lg transition-all"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <Icon className="w-7 h-7 text-indigo-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h2 className="font-bold text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {forum.title}
                                                </h2>
                                                {forum.description && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                                        {forum.description}
                                                    </p>
                                                )}
                                                <div className="mt-2">
                                                    <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                                                        {forum.track?.name || "قسم عام"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-center shrink-0">
                                                <div className="text-xl font-black text-slate-800 dark:text-white">
                                                    {forum._count.topics}
                                                </div>
                                                <div className="text-xs text-slate-400">موضوع</div>
                                            </div>
                                        </div>
                                        {lastTopic && (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                                                <span>آخر مشاركة:</span>
                                                <span className="font-bold text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                                                    {lastTopic.title}
                                                </span>
                                                <span>بواسطة {lastTopic.user?.name || "عضو"}</span>
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </main>
    )
}
