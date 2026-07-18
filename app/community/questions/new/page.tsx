"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { askQuestion } from "@/actions/community"
import { getLearningTracks } from "@/actions/tracks"
import { HelpCircle, Send, Tag, ChevronRight, GraduationCap } from "lucide-react"
import Link from "next/link"

export default function NewQuestionClient() {
    const router = useRouter()
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [tags, setTags] = useState("")
    const [trackId, setTrackId] = useState("")
    const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([])
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        async function loadTracks() {
            const result = await getLearningTracks()
            if (result.success && result.tracks) {
                setTracks(result.tracks.map((track) => ({ id: track.id, name: track.name })))
            }
        }

        void loadTracks()
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            const result = await askQuestion({ title, content, tags: tags || undefined, trackId: trackId || undefined })
            if (result.error) {
                setError(result.error)
            } else if (result.question) {
                router.push(`/community/questions/${result.question.id}`)
            }
        })
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <Link href="/community" className="hover:text-emerald-600 transition-colors">المجتمع</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href="/community/questions" className="hover:text-emerald-600 transition-colors">الأسئلة والأجوبة</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-slate-900 dark:text-white font-bold">سؤال جديد</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                            <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black">طرح سؤال جديد</h1>
                            <p className="text-sm text-slate-500">سيحصل السائل على +15 XP</p>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-300">
                        <p className="font-bold mb-1">💡 نصائح لسؤال جيد:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>كن محدداً وواضحاً في وصف مشكلتك</li>
                            <li>أضف الكود الذي جربته</li>
                            <li>اذكر رسائل الخطأ التي تظهر لك</li>
                            <li>استخدم وسوم (tags) مناسبة</li>
                        </ul>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                عنوان السؤال <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="ما هو سؤالك بشكل محدد؟"
                                required
                                minLength={10}
                                maxLength={300}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                تفاصيل السؤال <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="اشرح مشكلتك بالتفصيل... أضف الكود والأخطاء التي تواجهها..."
                                required
                                minLength={20}
                                rows={8}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                المسار المرتبط بالسؤال
                            </label>
                            <div className="relative">
                                <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    value={trackId}
                                    onChange={(e) => setTrackId(e.target.value)}
                                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">سؤال عام غير مرتبط بمسار</option>
                                    {tracks.map((track) => (
                                        <option key={track.id} value={track.id}>
                                            {track.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

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
                                    placeholder="javascript, react, css"
                                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
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
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all"
                            >
                                <Send className="w-4 h-4" />
                                {isPending ? "جار النشر..." : "نشر السؤال"}
                            </button>
                            <Link href="/community/questions" className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:border-slate-400 transition-colors">
                                إلغاء
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    )
}
