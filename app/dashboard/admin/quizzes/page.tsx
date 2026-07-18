"use client"

import React, { useState, useEffect } from "react"
import { HelpCircle, Trash2, CheckCircle, XCircle } from "lucide-react"
import prisma from "@/lib/prisma"

export default function AdminQuizzesPage() {
    const [quizzes, setQuizzes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/admin/quizzes")
                if (res.ok) { const data = await res.json(); setQuizzes(data.quizzes || []) }
            } catch (_e) { /* empty */ }
            setLoading(false)
        }
        fetchData()
    }, [])

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500"><HelpCircle className="w-5 h-5" /></div>
                <div><h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة الاختبارات</h1><p className="text-xs text-gray-500">إجمالي {quizzes.length} اختبار</p></div>
            </div>
            {loading ? <div className="py-20 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" /></div>
                : quizzes.length === 0
                    ? <div className="text-center py-20 text-gray-400 text-sm">لا توجد اختبارات في النظام حالياً.</div>
                    : <div className="space-y-3">
                        {quizzes.map((q: any) => (
                            <div key={q.id} className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{q.title}</h3>
                                    <p className="text-[10px] text-gray-400 mt-1">{q._count?.questions || 0} سؤال • {q.timeLimit || "∞"} دقيقة</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${q.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                                        {q.isActive ? "نشط" : "معطل"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
            }
        </div>
    )
}