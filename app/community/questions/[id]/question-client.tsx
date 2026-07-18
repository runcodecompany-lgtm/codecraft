"use client"

import { useState, useTransition } from "react"
import { postAnswer, acceptAnswer, toggleVote, reportContent } from "@/actions/community"
import { ChevronUp, ChevronDown, CheckCircle, Send, Flag, Trash2 } from "lucide-react"

interface Props {
    question: any
    currentUserId?: string
    initialAnswers: any[]
}

export default function QuestionDetailClient({ question, currentUserId, initialAnswers }: Props) {
    const [answers, setAnswers] = useState(initialAnswers)
    const [content, setContent] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handlePostAnswer = (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return
        startTransition(async () => {
            const result = await postAnswer({ questionId: question.id, content: content.trim() })
            if (result.error) {
                setError(result.error)
            } else if (result.answer) {
                setError(null)
                setContent("")
                setAnswers(prev => [...prev, { ...result.answer, user: { name: "أنت" }, voteCount: 0 }])
            }
        })
    }

    const handleAccept = (answerId: string) => {
        startTransition(async () => {
            const result = await acceptAnswer(answerId)
            if (result.success) {
                setAnswers(prev => prev.map(a => ({ ...a, isAccepted: a.id === answerId })))
            }
        })
    }

    const handleVote = (targetId: string, targetType: "QUESTION" | "ANSWER", value: 1 | -1) => {
        startTransition(async () => {
            await toggleVote(targetId, targetType, value)
        })
    }

    const handleReport = (targetId: string, targetType: string) => {
        startTransition(async () => {
            await reportContent(targetId, targetType, "INAPPROPRIATE")
            alert("تم الإبلاغ")
        })
    }

    const isQuestionOwner = currentUserId === question.userId

    return (
        <div className="space-y-6">
            {/* Question Voting */}
            <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                        onClick={() => handleVote(question.id, "QUESTION", 1)}
                        className="p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                        <ChevronUp className="w-6 h-6" />
                    </button>
                    <span className="text-xl font-black">{question.voteCount}</span>
                    <button
                        onClick={() => handleVote(question.id, "QUESTION", -1)}
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 transition-colors"
                    >
                        <ChevronDown className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{question.content}</p>
                </div>
            </div>

            {/* Answers */}
            <div>
                <h2 className="text-lg font-bold mb-4">{answers.length} إجابة</h2>
                <div className="space-y-4">
                    {answers.map((answer: any) => (
                        <div
                            key={answer.id}
                            className={`flex gap-4 p-5 rounded-xl border transition-all ${answer.isAccepted
                                ? "border-emerald-400/50 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5"
                                : "border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900"
                            }`}
                        >
                            {/* Vote */}
                            <div className="flex flex-col items-center gap-1 shrink-0">
                                <button
                                    onClick={() => handleVote(answer.id, "ANSWER", 1)}
                                    className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-600 transition-colors"
                                >
                                    <ChevronUp className="w-5 h-5" />
                                </button>
                                <span className="font-black text-sm">{answer.voteCount}</span>
                                <button
                                    onClick={() => handleVote(answer.id, "ANSWER", -1)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 transition-colors"
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </button>

                                {/* Accept button */}
                                {isQuestionOwner && !question.isResolved && (
                                    <button
                                        onClick={() => handleAccept(answer.id)}
                                        className="mt-1 p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-600 transition-colors"
                                        title="قبول كأفضل إجابة"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                    </button>
                                )}
                                {answer.isAccepted && (
                                    <div className="p-1.5 text-emerald-600 dark:text-emerald-400" title="أفضل إجابة">
                                        <CheckCircle className="w-5 h-5 fill-current" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                {answer.isAccepted && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-3">
                                        <CheckCircle className="w-3 h-3" />
                                        أفضل إجابة
                                    </div>
                                )}
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{answer.content}</p>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                                            {answer.user?.name?.charAt(0) || "?"}
                                        </div>
                                        <span className="font-bold">{answer.user?.name || "عضو"}</span>
                                        <span>·</span>
                                        <span>{new Date(answer.createdAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}</span>
                                    </div>
                                    {currentUserId && currentUserId !== answer.userId && (
                                        <button
                                            onClick={() => handleReport(answer.id, "ANSWER")}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                        >
                                            <Flag className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Answer Form */}
            {currentUserId && !question.isResolved && (
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <h3 className="font-bold mb-3">إضافة إجابة</h3>
                    <form onSubmit={handlePostAnswer} className="space-y-3">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="اكتب إجابتك الكاملة والمفصلة هنا..."
                            rows={5}
                            required
                            minLength={10}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isPending || !content.trim()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all"
                            >
                                <Send className="w-4 h-4" />
                                {isPending ? "جار الإرسال..." : "نشر الإجابة"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {question.isResolved && (
                <div className="text-center py-4 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-200 dark:border-emerald-500/20 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                    ✅ هذا السؤال تم حله
                </div>
            )}

            {!currentUserId && (
                <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    يجب <a href="/login" className="text-emerald-600 font-bold">تسجيل الدخول</a> لإضافة إجابة
                </div>
            )}
        </div>
    )
}
