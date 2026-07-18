import Link from "next/link"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { HelpCircle, Plus, ChevronUp, CheckCircle, Eye, MessageSquare, ChevronRight, Tag, Filter } from "lucide-react"

export const metadata = {
    title: "الأسئلة والأجوبة | Code Craft Core",
    description: "اطرح أسئلتك البرمجية واحصل على إجابات من خبراء المجتمع",
}

interface Props {
    searchParams: Promise<{ filter?: string; tag?: string; page?: string; track?: string }>
}

async function getQuestions(filter: string, tag?: string, trackId?: string, page = 1) {
    const limit = 15
    const skip = (page - 1) * limit

    const where: any = {}
    if (tag) where.tags = { contains: tag }
    if (trackId) where.trackId = trackId
    if (filter === "resolved") where.isResolved = true
    if (filter === "open") where.isResolved = false

    const orderBy: any =
        filter === "votes" ? { voteCount: "desc" } :
        filter === "answers" ? { answerCount: "desc" } :
        filter === "views" ? { viewCount: "desc" } :
        { createdAt: "desc" }

    try {
        const [questions, total] = await Promise.all([
            prisma.qaQuestion.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, name: true, avatar: true } },
                    track: { select: { id: true, name: true } },
                },
            }),
            prisma.qaQuestion.count({ where }),
        ])
        return { questions, total, totalPages: Math.ceil(total / limit) }
    } catch { return { questions: [], total: 0, totalPages: 0 } }
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

export default async function QuestionsPage({ searchParams }: Props) {
    const { filter = "newest", tag, track, page: pageStr } = await searchParams
    const page = Math.max(1, parseInt(pageStr || "1"))
    const [data, session, tracks] = await Promise.all([
        getQuestions(filter, tag, track, page),
        getServerSession(),
        getTracks(),
    ])

    const { questions, total, totalPages } = data

    const filters = [
        { id: "newest", label: "الأحدث" },
        { id: "votes", label: "الأعلى تصويتاً" },
        { id: "answers", label: "الأكثر إجابات" },
        { id: "open", label: "غير محلولة" },
        { id: "resolved", label: "محلولة" },
    ]

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
            {/* Hero */}
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white py-12 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 text-emerald-300 text-sm mb-4">
                        <Link href="/community" className="hover:text-white transition-colors">المجتمع</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span>الأسئلة والأجوبة</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black mb-2">❓ الأسئلة والأجوبة</h1>
                            <p className="text-emerald-200">{total.toLocaleString("ar")} سؤال في قاعدة المعرفة</p>
                        </div>
                        {session && (
                            <Link
                                href="/community/questions/new"
                                className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shrink-0"
                            >
                                <Plus className="w-5 h-5" />
                                طرح سؤال
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap mb-6">
                    {filters.map(f => (
                        <Link
                            key={f.id}
                            href={`/community/questions?filter=${f.id}${tag ? `&tag=${tag}` : ""}`}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${filter === f.id
                                ? "bg-emerald-600 text-white border-emerald-500"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-emerald-300"
                            }`}
                        >
                            {f.label}
                        </Link>
                    ))}
                    {tag && (
                        <Link href="/community/questions" className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            #{tag}
                            <span className="text-xs">✕</span>
                        </Link>
                    )}
                    <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-800" />
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                        <Filter className="w-3.5 h-3.5" />
                        المسار:
                    </span>
                    <Link
                        href={`/community/questions?filter=${filter}${tag ? `&tag=${tag}` : ""}`}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${!track
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                        }`}
                    >
                        جميع المسارات
                    </Link>
                    {tracks.map((item) => (
                        <Link
                            key={item.id}
                            href={`/community/questions?filter=${filter}&track=${item.id}${tag ? `&tag=${tag}` : ""}`}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${track === item.id
                                ? "bg-indigo-600 text-white border-indigo-500"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                            }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* Questions List */}
                {questions.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/50">
                        <HelpCircle className="w-14 h-14 mx-auto text-slate-400 mb-4" />
                        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">لا توجد أسئلة</h2>
                        {session && (
                            <Link href="/community/questions/new" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold">
                                <Plus className="w-4 h-4" /> اطرح أول سؤال
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {questions.map((q: any) => {
                            const tags = q.tags?.split(",").map((t: string) => t.trim()).filter(Boolean) || []
                            return (
                                <Link
                                    key={q.id}
                                    href={`/community/questions/${q.id}`}
                                    className="group flex gap-4 p-5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400/40 dark:hover:border-emerald-500/30 hover:shadow-md transition-all"
                                >
                                    {/* Vote/Answer stats */}
                                    <div className="flex flex-col items-center gap-2 text-center shrink-0 min-w-[52px]">
                                        <div className={`p-2 rounded-xl ${q.isResolved ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-slate-50 dark:bg-slate-800"}`}>
                                            <div className={`text-lg font-black ${q.isResolved ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`}>
                                                {q.answerCount}
                                            </div>
                                            <div className="text-xs text-slate-400">إجابة</div>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                            <ChevronUp className="w-3 h-3" />
                                            {q.voteCount}
                                        </div>
                                    </div>

                                    {/* Question */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-2 mb-1 flex-wrap">
                                            {q.isResolved && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold shrink-0">
                                                    <CheckCircle className="w-3 h-3" /> محلول
                                                </span>
                                            )}
                                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                                                {q.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">{q.content}</p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 text-xs font-bold">
                                                {q.track?.name || "عام"}
                                            </span>
                                            {tags.map((tag: string) => (
                                                <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-mono hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div className="text-left shrink-0 text-xs text-slate-400">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Eye className="w-3 h-3" />
                                            {q.viewCount}
                                        </div>
                                        <div>{new Date(q.createdAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}</div>
                                        <div className="font-bold text-slate-600 dark:text-slate-300 mt-1">{q.user?.name || "عضو"}</div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {page > 1 && (
                            <Link href={`/community/questions?filter=${filter}&page=${page - 1}`} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold hover:border-emerald-400 transition-colors">
                                السابق
                            </Link>
                        )}
                        <span className="text-sm text-slate-500">صفحة {page} من {totalPages}</span>
                        {page < totalPages && (
                            <Link href={`/community/questions?filter=${filter}&page=${page + 1}`} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold hover:border-emerald-400 transition-colors">
                                التالي
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}
