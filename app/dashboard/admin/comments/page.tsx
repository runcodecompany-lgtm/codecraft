"use client"

import React, { useState, useEffect } from "react"
import { MessageSquare, Trash2, Eye, EyeOff } from "lucide-react"

export default function AdminCommentsPage() {
    const [comments, setComments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/admin/comments")
            .then(r => r.ok ? r.json() : { comments: [] })
            .then(d => setComments(d.comments || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500"><MessageSquare className="w-5 h-5" /></div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة التعليقات</h1>
            </div>
            {loading ? <div className="py-20 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" /></div>
                : comments.length === 0 ? <div className="text-center py-20 text-gray-400 text-sm">لا توجد تعليقات حالياً.</div>
                    : <div className="space-y-3">
                        {comments.map((c: any) => (
                            <div key={c.id} className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{c.user?.fullName || c.user?.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{c.content || c.text}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button className="p-1.5 rounded-lg border border-gray-200 text-gray-500"><EyeOff className="w-3.5 h-3.5" /></button>
                                    <button className="p-1.5 rounded-lg border border-rose-200 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>}
        </div>
    )
}