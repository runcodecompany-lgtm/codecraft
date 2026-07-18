import Link from "next/link"
import prisma from "@/lib/prisma"
import { MessageSquare, HelpCircle, Trophy, Activity, Code2, Brain, Database, Globe, ArrowLeft, Plus } from "lucide-react"

export const metadata = {
    title: "المجتمع | Code Craft Core",
}

async function getForums() {
    try {
        return await prisma.forum.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
            include: {
                track: { select: { id: true, name: true } },
                _count: { select: { topics: true } },
            },
        })
    } catch { return [] }
}

export default async function CommunityPage() {
    const forums = await getForums()

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100" dir="rtl">
            <div className="mx-auto max-w-6xl px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-black mb-4">🌐 مجتمع Code Craft</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                        تواصل مع المتعلمين عبر المسارات المختلفة، اطرح أسئلتك، شارك معرفتك، وابنِ سمعتك في مجتمع تعلم متعدد المجالات.
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    <Link href="/community/forums" className="group rounded-2xl border border-indigo-200/60 dark:border-indigo-500/20 bg-white dark:bg-slate-900 p-6 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all hover:shadow-lg">
                        <MessageSquare className="w-8 h-8 text-indigo-500 mb-3" />
                        <h3 className="font-bold text-lg mb-1">المنتديات</h3>
                            <p className="text-sm text-slate-500">ناقش موضوعات مرتبطة بالبرمجة والفيزياء والكيمياء وغيرها</p>
                    </Link>
                    <Link href="/community/questions" className="group rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20 bg-white dark:bg-slate-900 p-6 hover:border-emerald-400 dark:hover:border-emerald-500/40 transition-all hover:shadow-lg">
                        <HelpCircle className="w-8 h-8 text-emerald-500 mb-3" />
                        <h3 className="font-bold text-lg mb-1">الأسئلة والأجوبة</h3>
                        <p className="text-sm text-slate-500">اطرح سؤالاً أو أجب عن أسئلة الآخرين</p>
                    </Link>
                    <Link href="/community/challenges" className="group rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-white dark:bg-slate-900 p-6 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all hover:shadow-lg">
                        <Trophy className="w-8 h-8 text-amber-500 mb-3" />
                        <h3 className="font-bold text-lg mb-1">التحديات</h3>
                        <p className="text-sm text-slate-500">تحديات يومية وأسبوعية بمكافآت</p>
                    </Link>
                </div>

                {/* Forums Grid */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">أقسام المنتدى</h2>
                        <Link href="/community/activity" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            النشاط الأخير
                        </Link>
                    </div>

                    {forums.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/50">
                            <MessageSquare className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                            <p className="text-slate-500">لا توجد أقسام منتدى بعد</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {forums.map((forum: any) => (
                                <Link key={forum.id} href={`/community/forums/${forum.id}`}
                                    className="group rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:border-indigo-400/40 dark:hover:border-indigo-500/30 transition-all hover:shadow-md"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                            {forum.icon === "Code2" ? <Code2 className="w-6 h-6 text-indigo-500" /> :
                                                forum.icon === "Brain" ? <Brain className="w-6 h-6 text-indigo-500" /> :
                                                    forum.icon === "Database" ? <Database className="w-6 h-6 text-indigo-500" /> :
                                                        <Globe className="w-6 h-6 text-indigo-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{forum.title}</h3>
                                            {forum.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{forum.description}</p>}
                                            <div className="mt-2">
                                                <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                                                    {forum.track?.name || "قسم عام"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                                                <span>{forum._count?.topics || 0} موضوع</span>
                                            </div>
                                        </div>
                                        <ArrowLeft className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Recent Activity Feed */}
                <section className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">📊 آخر النشاطات</h2>
                    <RecentActivity />
                </section>
            </div>
        </main>
    )
}

async function RecentActivity() {
    try {
        const activities = await prisma.activity.findMany({
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { user: { select: { id: true, name: true, avatar: true } } },
        })

        if (activities.length === 0) {
            return (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/50">
                    <Activity className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-500 text-sm">لا يوجد نشاط بعد. كن أول من يشارك!</p>
                </div>
            )
        }

        return (
            <div className="space-y-3">
                {activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                            {activity.user?.name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm">
                                <span className="font-bold">{activity.user?.name || "عضو"}</span>
                                {activity.type === "FORUM_TOPIC" && " أنشأ موضوعاً جديداً"}
                                {activity.type === "QUESTION" && " طرح سؤالاً"}
                                {activity.type === "ANSWER" && " أجاب على سؤال"}
                                {activity.type === "ACHIEVEMENT" && " حصل على إنجاز"}
                                {activity.type === "CERTIFICATE" && " حصل على شهادة"}
                                {activity.type === "COURSE_COMPLETE" && " أكمل دورة"}
                                {activity.type === "BADGE" && " حصل على شارة"}
                            </p>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                            {new Date(activity.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                        </span>
                    </div>
                ))}
            </div>
        )
    } catch { return null }
}
