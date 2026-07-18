import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { MessageSquare, Pin, Lock, Plus, ChevronRight, Clock, Eye } from "lucide-react"

interface Props {
    params: Promise<{ id: string }>
    searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params
    const forum = await prisma.forum.findUnique({ where: { id } })
    return { title: forum ? `${forum.title} | المنتديات` : "المنتدى" }
}

async function getForumWithTopics(id: string, page: number) {
    const limit = 20
    const skip = (page - 1) * limit
    try {
        const [forum, topics, total] = await Promise.all([
            prisma.forum.findUnique({ where: { id }, include: { track: { select: { id: true, name: true } } } }),
            prisma.forumTopic.findMany({
                where: { forumId: id },
                orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, name: true, avatar: true } },
                    _count: { select: { replies: true } },
                },
            }),
            prisma.forumTopic.count({ where: { forumId: id } }),
        ])
        return { forum, topics, total, totalPages: Math.ceil(total / limit) }
    } catch { return null }
}

export default async function ForumDetailPage({ params, searchParams }: Props) {
    const { id } = await params
    const { page: pageStr } = await searchParams
    const page = Math.max(1, parseInt(pageStr || "1"))

    const data = await getForumWithTopics(id, page)
    if (!data?.forum) notFound()

    const { forum, topics, total, totalPages } = data
    const session = await getServerSession()

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <Link href="/community" className="hover:text-indigo-600 transition-colors">المجتمع</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href="/community/forums" className="hover:text-indigo-600 transition-colors">المنتديات</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-slate-900 dark:text-white font-bold">{forum.title}</span>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">{forum.title}</h1>
                        {forum.description && (
                            <p className="text-slate-500 mt-1">{forum.description}</p>
                        )}
                        <div className="mt-2">
                            <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                                {forum.track?.name || "قسم عام"}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{total} موضوع</p>
                    </div>
                    {session && (
                        <Link
                            href={`/community/forums/topic/new?forumId=${forum.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            موضوع جديد
                        </Link>
                    )}
                </div>

                {/* Topics */}
                {topics.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/50">
                        <MessageSquare className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                        <p className="text-slate-500">لا توجد مواضيع بعد. كن أول من يبدأ النقاش!</p>
                        {session && (
                            <Link
                                href={`/community/forums/topic/new?forumId=${forum.id}`}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold"
                            >
                                <Plus className="w-4 h-4" /> إنشاء أول موضوع
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {topics.map((topic: any) => (
                            <Link
                                key={topic.id}
                                href={`/community/forums/topic/${topic.id}`}
                                className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400/40 dark:hover:border-indigo-500/30 hover:shadow-md transition-all"
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-sm font-black text-indigo-600 dark:text-indigo-400">
                                    {topic.user?.name?.charAt(0) || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {topic.isPinned && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold">
                                                <Pin className="w-3 h-3" /> مثبت
                                            </span>
                                        )}
                                        {topic.isClosed && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold">
                                                <Lock className="w-3 h-3" /> مغلق
                                            </span>
                                        )}
                                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                            {topic.title}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                                        <span>بواسطة <span className="font-bold">{topic.user?.name || "عضو"}</span></span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(topic.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                                        </span>
                                        {topic.tags && (
                                            <span className="text-indigo-400 font-mono">{topic.tags.split(",").map((t: string) => `#${t.trim()}`).join(" ")}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-center shrink-0">
                                    <div className="text-sm font-black text-slate-800 dark:text-white">{topic._count.replies}</div>
                                    <div className="text-xs text-slate-400">رد</div>
                                </div>
                                <div className="text-center shrink-0">
                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                        <Eye className="w-3.5 h-3.5" />
                                        {topic.viewCount}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {page > 1 && (
                            <Link href={`/community/forums/${id}?page=${page - 1}`} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold hover:border-indigo-400 transition-colors">
                                السابق
                            </Link>
                        )}
                        <span className="text-sm text-slate-500">صفحة {page} من {totalPages}</span>
                        {page < totalPages && (
                            <Link href={`/community/forums/${id}?page=${page + 1}`} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold hover:border-indigo-400 transition-colors">
                                التالي
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}
