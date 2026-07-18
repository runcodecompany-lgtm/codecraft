"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createTopic } from "@/actions/community"
import { PenLine, Send, ChevronRight, Tag } from "lucide-react"
import Link from "next/link"

interface Props {
    forums: Array<{ id: string; title: string }>
    defaultForumId?: string
}

export default function NewTopicClient({ forums, defaultForumId }: Props) {
    const router = useRouter()
    const [forumId, setForumId] = useState(defaultForumId || forums[0]?.id || "")
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [tags, setTags] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            const result = await createTopic({ forumId, title, content, tags: tags || undefined })
            if (result.error) {
                setError(result.error)
            } else if (result.topic) {
                router.push(`/community/forums/topic/${result.topic.id}`)
            }
        })
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <Link href="/community" className="hover:text-indigo-600 transition-colors">المجتمع</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href="/community/forums" className="hover:text-indigo-600 transition-colors">المنتديات</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-slate-900 dark:text-white font-bold">موضوع جديد</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
                            <PenLine className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className="text-xl font-black">إنشاء موضوع جديد</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Forum Selection */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                القسم <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={forumId}
                                onChange={(e) => setForumId(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="جديد">اختر القسم...</option>
                                {forums.map(f => (
                                    <option key={f.id} value={f.id}>{f.title}</option>
                                ))}
                                <option value="جدد">جديد</option>
                            </select>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                عنوان الموضوع <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="اكتب عنواناً واضحاً ومعبراً..."
                                required
                                minLength={3}
                                maxLength={200}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-slate-400 mt-1">{title.length}/200</p>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                محتوى الموضوع <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="اشرح موضوعك بالتفصيل..."
                                required
                                minLength={10}
                                rows={8}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                الوسوم (اختياري)
                            </label>
                            <div className="relative">
                                <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="javascript, react, typescript (افصل بفواصل)"
                                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">افصل الوسوم بفواصل مثل: javascript, css, html</p>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all"
                            >
                                <Send className="w-4 h-4" />
                                {isPending ? "جار النشر..." : "نشر الموضوع"}
                            </button>
                            <Link href="/community/forums" className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:border-slate-400 transition-colors">
                                إلغاء
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    )
}
