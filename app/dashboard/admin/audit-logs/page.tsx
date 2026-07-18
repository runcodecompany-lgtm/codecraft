"use client"

import React, { useState, useEffect, useCallback } from "react"
import { getAuditLogs } from "@/actions/admin"
import { FolderOpen, ChevronLeft, ChevronRight, Search } from "lucide-react"

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [pages, setPages] = useState(1)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await getAuditLogs(page)
        if (res.success && res.logs) { setLogs(res.logs); setTotal(res.total || 0); setPages(res.pages || 1) }
        setLoading(false)
    }, [page])

    useEffect(() => { load() }, [load])

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><FolderOpen className="w-5 h-5" /></div>
                <div><h1 className="text-2xl font-black text-gray-900 dark:text-white">سجل التدقيق</h1><p className="text-xs text-gray-500">إجمالي {total} سجل</p></div>
            </div>
            {loading ? <div className="py-20 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" /></div>
                : <div className="overflow-x-auto rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <table className="w-full text-right text-xs">
                        <thead className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold">
                            <tr><th className="p-4">المستخدم</th><th className="p-4">الإجراء</th><th className="p-4">الوصف</th><th className="p-4">التاريخ</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-900">
                            {logs.map((l: any) => (
                                <tr key={l.id} className="hover:bg-gray-50/50">
                                    <td className="p-4 font-bold text-gray-900 dark:text-white">{l.user?.fullName || l.user?.name || "غير معروف"}</td>
                                    <td className="p-4"><span className="font-bold text-indigo-600">{l.action}</span></td>
                                    <td className="p-4 text-gray-500 text-[10px] max-w-xs truncate">{l.details || l.description || "-"}</td>
                                    <td className="p-4 text-gray-400">{new Date(l.createdAt).toLocaleString("ar-EG")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>}
            {pages > 1 && <div className="flex justify-center gap-2" dir="ltr">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-xl border border-gray-200 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)} className={`min-w-[36px] h-9 rounded-xl text-xs font-bold ${p === page ? "bg-indigo-600 text-white" : "border border-gray-200 text-gray-600"}`}>{p}</button>
                ))}
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-xl border border-gray-200 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            </div>}
        </div>
    )
}