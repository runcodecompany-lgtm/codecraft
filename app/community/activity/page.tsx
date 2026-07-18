import Link from "next/link"
import prisma from "@/lib/prisma"
import { Activity, BookOpen, HelpCircle, MessageSquare, Award, Trophy, Star, ChevronRight } from "lucide-react"

export const metadata = {
    title: "النشاط الاجتماعي | Code Craft Core",
}

interface Props {
    searchParams: Promise<{ page?: string; type?: string }>
}

const activityIcons: Record<string, { icon: React.FC<any>; color: string; label: string }> = {
    FORUM_TOPIC: { icon: MessageSquare, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10", label: "أنشأ موضوعاً" },
    QUESTION: { icon: HelpCircle, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10", label: "طرح سؤالاً" },
    ANSWER: { icon: HelpCircle, color: "text-teal-500 bg-teal-50 dark:bg-teal-500/10", label: "أجاب على سؤال" },
    ACHIEVEMENT: { icon: Award, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10", label: "حصل على إنجاز" },
    CERTIFICATE: { icon: BookOpen, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10", label: "حصل على شهادة" },
    COURSE_COMPLETE: { icon: BookOpen, color: "text-violet-500 bg-violet-50 dark:bg-violet-500/10", label: "أكمل دورة" },
    BADGE: { icon: Star, color: "text-rose-500 bg-rose-50 dark:bg-rose-500/10", label: "حصل على شارة" },
}

async function getActivities(page: number, type?: string) {
    const limit = 30
    const skip = (page - 1) * limit

    try {
        const where: any = {}
        if (type) where.type = type

        const [activities, total] = await Promise.all([
            prisma.activity.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, name: true, avatar: true, level: true } },
                },
            }),
            prisma.activity.count({ where }),
        ])

        return { activities, total, totalPages: Math.ceil(total / limit) }
    } catch { return { activities: [], total: 0, totalPages: 0 } }
}

export default async function ActivityFeedPage({ searchParams }: Props) {
    const { page: pageStr, type } = await searchParams
    const page = Math.max(1, parseInt(pageStr || "1"))
    const { activities, total, totalPages } = await getActivities(page, type)

    const typeFilters = [
        { id: "", label: "الكل" },
        { id: "COURSE_COMPLETE", label: "دورات مكتملة" },
        { id: "ACHIEVEMENT", label: "الإنجازات" },
        { id: "CERTIFICATE", label: "الشهادات" },
        { id: "FORUM_TOPIC", label: "مواضيع المنتدى" },
        { id: "QUESTION", label: "أسئلة" },
        { id: "BADGE", label: "الشارات" },
    ]

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <Link href="/community" className="hover:text-indigo-600 transition-colors">المجتمع</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-slate-900 dark:text-white font-bold">النشاط الاجتماعي</span>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black">📊 آخر النشاطات</h1>
                        <p className="text-slate-500 text-sm mt-1">{total.toLocaleString("ar")} نشاط مسجل</p>
                    </div>
                </div>

                {/* Type Filters */}
                <div className="flex gap-2 flex-wrap mb-6">
                    {typeFilters.map(f => (
                        <Link
                            key={f.id}
                            href={`/community/activity?type=${f.id}&page=1`}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${type === f.id || (!type && !f.id)
                                ? "bg-indigo-600 text-white border-indigo-500"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                            }`}
                        >
                            {f.label}
                        </Link>
                    ))}
                </div>

                {/* Activities */}
                {activities.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/50">
                        <Activity className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                        <p className="text-slate-500">لا توجد نشاطات بعد</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activities.map((activity: any) => {
                            const config = activityIcons[activity.type] || { icon: Activity, color: "text-slate-500 bg-slate-100 dark:bg-slate-800", label: "نشاط" }
                            const Icon = config.icon
                            const data = activity.data as any
                            return (
                                <div
                                    key={activity.id}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-400/40 transition-all"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm">
                                            <Link href={`/users/${activity.user.id}`} className="font-bold hover:text-indigo-600 transition-colors">
                                                {activity.user.name || "عضو"}
                                            </Link>
                                            {" "}<span className="text-slate-500">{config.label}</span>
                                            {data?.title && (
                                                <span className="font-medium text-slate-700 dark:text-slate-300"> — {data.title}</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {new Date(activity.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                                        </p>
                                    </div>
                                    <div className="text-xs text-slate-400 shrink-0">
                                        مستوى {activity.user.level}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {page > 1 && (
                            <Link href={`/community/activity?page=${page - 1}${type ? `&type=${type}` : ""}`} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold hover:border-indigo-400 transition-colors">
                                السابق
                            </Link>
                        )}
                        <span className="text-sm text-slate-500">صفحة {page} من {totalPages}</span>
                        {page < totalPages && (
                            <Link href={`/community/activity?page=${page + 1}${type ? `&type=${type}` : ""}`} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold hover:border-indigo-400 transition-colors">
                                التالي
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}
