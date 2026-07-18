import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { ChevronRight, CheckCircle, Eye, Tag, Clock } from "lucide-react"
import QuestionDetailClient from "./question-client"

interface Props {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params
    const q = await prisma.qaQuestion.findUnique({ where: { id } })
    return { title: q ? `${q.title} | الأسئلة والأجوبة` : "السؤال" }
}

async function getQuestionWithAnswers(id: string) {
    try {
        await prisma.qaQuestion.update({ where: { id }, data: { viewCount: { increment: 1 } } })
        return await prisma.qaQuestion.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, avatar: true, reputation: true, level: true } },
                track: { select: { id: true, name: true } },
                answers: {
                    orderBy: [{ isAccepted: "desc" }, { voteCount: "desc" }],
                    include: {
                        user: { select: { id: true, name: true, avatar: true, reputation: true } },
                    },
                },
            },
        })
    } catch { return null }
}

export default async function QuestionDetailPage({ params }: Props) {
    const { id } = await params
    const [question, session] = await Promise.all([
        getQuestionWithAnswers(id),
        getServerSession(),
    ])

    if (!question) notFound()

    const tags = question.tags?.split(",").map((t: string) => t.trim()).filter(Boolean) || []

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 flex-wrap">
                    <Link href="/community" className="hover:text-emerald-600 transition-colors">المجتمع</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href="/community/questions" className="hover:text-emerald-600 transition-colors">الأسئلة والأجوبة</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-slate-900 dark:text-white font-bold line-clamp-1 max-w-[250px]">{question.title}</span>
                </div>

                {/* Question Header */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        {question.isResolved && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                                <CheckCircle className="w-3 h-3" /> محلول
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                            {question.track?.name || "سؤال عام"}
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4">{question.title}</h1>

                    <div className="flex items-center gap-3 mb-5">
                        <Link href={`/users/${question.user.id}`}>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                                {question.user.name?.charAt(0) || "?"}
                            </div>
                        </Link>
                        <div>
                            <Link href={`/users/${question.user.id}`} className="font-bold hover:text-emerald-600 transition-colors text-sm">
                                {question.user.name || "عضو"}
                            </Link>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(question.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {question.viewCount} مشاهدة
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap mb-5">
                            <Tag className="w-4 h-4 text-slate-400" />
                            {tags.map((tag: string) => (
                                <Link
                                    key={tag}
                                    href={`/community/questions?tag=${tag}`}
                                    className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-mono hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                >
                                    #{tag}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Interactive part */}
                    <QuestionDetailClient
                        question={question}
                        currentUserId={session?.id}
                        initialAnswers={question.answers}
                    />
                </div>
            </div>
        </main>
    )
}
