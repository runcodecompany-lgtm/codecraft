import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { ChevronRight, Pin, Lock, Eye, MessageSquare, Clock, Tag } from "lucide-react"
import TopicRepliesClient from "./replies-client"

interface Props {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params
    const topic = await prisma.forumTopic.findUnique({ where: { id } })
    return { title: topic ? `${topic.title} | المنتديات` : "الموضوع" }
}

async function getTopicWithReplies(id: string) {
    try {
        // Increment view count
        await prisma.forumTopic.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        })

        return await prisma.forumTopic.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, avatar: true, reputation: true, level: true, xp: true } },
                forum: { select: { id: true, title: true } },
                replies: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                        quote: {
                            include: { user: { select: { name: true } } }
                        },
                    },
                },
            },
        })
    } catch { return null }
}

export default async function TopicDetailPage({ params }: Props) {
    const { id } = await params
    const [topic, session] = await Promise.all([
        getTopicWithReplies(id),
        getServerSession(),
    ])

    if (!topic) notFound()

    const tags = topic.tags?.split(",").map((t: string) => t.trim()).filter(Boolean) || []

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 flex-wrap">
                    <Link href="/community" className="hover:text-indigo-600 transition-colors">المجتمع</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href="/community/forums" className="hover:text-indigo-600 transition-colors">المنتديات</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href={`/community/forums/${topic.forum.id}`} className="hover:text-indigo-600 transition-colors">{topic.forum.title}</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-slate-900 dark:text-white font-bold line-clamp-1 max-w-[200px]">{topic.title}</span>
                </div>

                {/* Topic Header */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 mb-6">
                    <div className="flex items-start gap-2 flex-wrap mb-3">
                        {topic.isPinned && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold">
                                <Pin className="w-3 h-3" /> مثبت
                            </span>
                        )}
                        {topic.isClosed && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold">
                                <Lock className="w-3 h-3" /> مغلق
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4">{topic.title}</h1>

                    {/* Author info */}
                    <div className="flex items-center gap-3 mb-5">
                        <Link href={`/users/${topic.user.id}`}>
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                                {topic.user.name?.charAt(0) || "?"}
                            </div>
                        </Link>
                        <div>
                            <Link href={`/users/${topic.user.id}`} className="font-bold hover:text-indigo-600 transition-colors">
                                {topic.user.name || "عضو"}
                            </Link>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(topic.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {topic.viewCount} مشاهدة
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    {topic.replies.length} رد
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                        {topic.content}
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                            <Tag className="w-4 h-4 text-slate-400" />
                            {tags.map((tag: string) => (
                                <span key={tag} className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Replies Section */}
                <div>
                    <h2 className="font-bold text-lg mb-4">
                        الردود ({topic.replies.length})
                    </h2>
                    <TopicRepliesClient
                        topicId={topic.id}
                        topicClosed={topic.isClosed}
                        currentUserId={session?.id}
                        replies={topic.replies}
                    />
                </div>
            </div>
        </main>
    )
}
