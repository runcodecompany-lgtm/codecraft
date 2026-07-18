"use client"

import { useState, useTransition } from "react"
import { createReply, deleteReply, reportContent } from "@/actions/community"
import { Send, Quote, Trash2, Flag } from "lucide-react"

interface Props {
    topicId: string
    topicClosed: boolean
    currentUserId?: string
    replies: any[]
}

export default function TopicRepliesClient({ topicId, topicClosed, currentUserId, replies: initialReplies }: Props) {
    const [replies, setReplies] = useState(initialReplies)
    const [content, setContent] = useState("")
    const [quoteId, setQuoteId] = useState<string | null>(null)
    const [quotedText, setQuotedText] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return
        startTransition(async () => {
            const result = await createReply({ topicId, content: content.trim(), quoteId: quoteId || undefined })
            if (result.error) {
                setError(result.error)
            } else {
                setError(null)
                setContent("")
                setQuoteId(null)
                setQuotedText(null)
                // Optimistic update
                if (result.reply) {
                    setReplies(prev => [...prev, { ...result.reply, user: { name: "أنت" } }])
                }
            }
        })
    }

    const handleDelete = (replyId: string) => {
        startTransition(async () => {
            const result = await deleteReply(replyId)
            if (result.success) {
                setReplies(prev => prev.filter(r => r.id !== replyId))
            }
        })
    }

    const handleReport = (targetId: string) => {
        startTransition(async () => {
            await reportContent(targetId, "FORUM_REPLY", "INAPPROPRIATE")
            alert("تم الإبلاغ عن الرد")
        })
    }

    const handleQuote = (reply: any) => {
        setQuoteId(reply.id)
        setQuotedText(reply.content)
        document.getElementById("reply-form")?.scrollIntoView({ behavior: "smooth" })
    }

    return (
        <div className="space-y-4">
            {/* Replies */}
            {replies.map((reply: any, idx: number) => (
                <div key={reply.id} id={`reply-${reply.id}`} className="flex gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {reply.user?.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{reply.user?.name || "عضو"}</span>
                                <span className="text-xs text-slate-400">#{idx + 1}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {!topicClosed && (
                                    <button
                                        onClick={() => handleQuote(reply)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                        title="اقتباس"
                                    >
                                        <Quote className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {currentUserId === reply.userId ? (
                                    <button
                                        onClick={() => handleDelete(reply.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                        title="حذف"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleReport(reply.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                        title="إبلاغ"
                                    >
                                        <Flag className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Quoted reply */}
                        {reply.quote && (
                            <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 border-r-4 border-indigo-500 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs block mb-1">
                                    {reply.quote.user?.name || "عضو"} كتب:
                                </span>
                                <p className="line-clamp-3">{reply.quote.content}</p>
                            </div>
                        )}

                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{reply.content}</p>
                        <p className="text-xs text-slate-400 mt-2">
                            {new Date(reply.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                    </div>
                </div>
            ))}

            {replies.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                    لا توجد ردود بعد. كن أول من يرد!
                </div>
            )}

            {/* Reply Form */}
            {currentUserId && !topicClosed && (
                <div id="reply-form" className="mt-6 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <h3 className="font-bold mb-3">إضافة رد</h3>

                    {quotedText && (
                        <div className="mb-3 p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl flex items-start gap-2">
                            <Quote className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{quotedText}</p>
                            </div>
                            <button
                                onClick={() => { setQuoteId(null); setQuotedText(null) }}
                                className="text-slate-400 hover:text-red-500 text-xs shrink-0"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="اكتب ردك هنا..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            required
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isPending || !content.trim()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all"
                            >
                                <Send className="w-4 h-4" />
                                {isPending ? "جار الإرسال..." : "إرسال الرد"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {topicClosed && (
                <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    🔒 هذا الموضوع مغلق ولا يمكن إضافة ردود جديدة
                </div>
            )}

            {!currentUserId && !topicClosed && (
                <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    يجب <a href="/login" className="text-indigo-600 font-bold">تسجيل الدخول</a> لإضافة رد
                </div>
            )}
        </div>
    )
}
