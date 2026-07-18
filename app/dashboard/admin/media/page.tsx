"use client"

import React, { useState, useEffect } from "react"
import { Image, Trash2, Archive } from "lucide-react"

export default function AdminMediaPage() {
    const [files, setFiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/admin/media")
            .then(r => r.ok ? r.json() : { files: [] })
            .then(d => setFiles(d.files || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500"><Image className="w-5 h-5" /></div>
                <div><h1 className="text-2xl font-black text-gray-900 dark:text-white">الملفات والوسائط</h1><p className="text-xs text-gray-500">إجمالي {files.length} ملف</p></div>
            </div>
            {loading ? <div className="py-20 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" /></div>
                : files.length === 0 ? <div className="text-center py-20 text-gray-400 text-sm">لا توجد ملفات حالياً.</div>
                    : <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {files.map((f: any) => (
                            <div key={f.id || f.name} className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2">
                                <div className="w-full h-24 rounded-xl bg-gray-100 dark:bg-slate-900 flex items-center justify-center text-2xl text-gray-400">📁</div>
                                <p className="font-bold text-[10px] truncate text-gray-900 dark:text-white">{f.name || f.filename || "ملف"}</p>
                                <div className="flex gap-1">
                                    <button className="flex-1 py-1 rounded-lg border border-gray-200 text-xs">حذف</button>
                                    <button className="flex-1 py-1 rounded-lg border border-gray-200 text-xs">أرشفة</button>
                                </div>
                            </div>
                        ))}
                    </div>}
        </div>
    )
}