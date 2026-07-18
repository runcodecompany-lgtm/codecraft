"use client"

import React, { useState, useEffect } from "react"
import { FileText, Trash2 } from "lucide-react"
import { getServerSession } from "@/lib/auth"
import prisma from "@/lib/prisma"

export default function AdminArticlesPage() {
    const [articles, setArticles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const res = await fetch("/api/articles")
                const data = await res.json()
                setArticles(data.articles || [])
            } catch (_) { /* ignore */ }
            setLoading(false)
        }
        fetchArticles()
    }, [])

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><FileText className="w-5 h-5" /></div>
                <div><h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة المقالات</h1><p className="text-xs text-gray-500">إجمالي {articles.length} مقال</p></div>
            </div>
            {loading ? <div className="py-20 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" /></div>
                : <div className="space-y-3">
                    {articles.map((a: any) => (
                        <div key={a.id} className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{a.title}</h3>
                                <p className="text-[10px] text-gray-400 mt-1">{a.slug}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.published ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                                    {a.published ? "منشور" : "مسودة"}
                                </span>
                                <button className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                    ))}
                    {articles.length === 0 && <p className="text-center py-10 text-sm text-gray-400">لا توجد مقالات بعد.</p>}
                </div>}
        </div>
    )
}