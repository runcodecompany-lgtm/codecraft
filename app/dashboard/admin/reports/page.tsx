"use client"

import React, { useState, useEffect } from "react"
import { Activity, Filter, CheckCircle, XCircle, Eye } from "lucide-react"

export default function AdminReportsPage() {
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch reports from API
        fetch("/api/admin/reports")
            .then(r => r.ok ? r.json() : { reports: [] })
            .then(d => setReports(d.reports || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500"><Activity className="w-5 h-5" /></div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة البلاغات</h1>
            </div>
            {loading ? (
                <div className="py-20 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" /></div>
            ) : (
                <div className="space-y-3">
                    {reports.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 text-sm">لا توجد بلاغات حالياً.</div>
                    ) : (
                        reports.map((r: any) => (
                            <div key={r.id} className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{r.title || r.reason || "بلاغ"}</h3>
                                    <p className="text-[10px] text-gray-400 mt-1">{r.description || r.details || ""}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === "PENDING" ? "bg-amber-500/10 text-amber-600" : r.status === "RESOLVED" ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                                        {r.status === "PENDING" ? "قيد المراجعة" : r.status === "RESOLVED" ? "تم الحل" : r.status || "جديد"}
                                    </span>
                                    <div className="flex gap-1">
                                        <button className="p-1.5 rounded-lg border border-emerald-200 text-emerald-500 hover:bg-emerald-50" title="حل البلاغ"><CheckCircle className="w-3.5 h-3.5" /></button>
                                        <button className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50" title="رفض"><XCircle className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}