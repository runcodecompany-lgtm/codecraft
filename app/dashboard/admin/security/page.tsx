"use client"

import React, { useState, useEffect } from "react"
import { ShieldAlert, AlertTriangle, Lock, Eye } from "lucide-react"

export default function AdminSecurityPage() {
    const [stats, setStats] = useState<any>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/admin/security")
            .then(r => r.ok ? r.json() : {})
            .then(d => setStats(d))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500"><ShieldAlert className="w-5 h-5" /></div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">مراقبة الأمان</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "محاولات فاشلة اليوم", value: stats.failedAttempts || 0, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10" },
                    { label: "حسابات مشبوهة", value: stats.suspiciousAccounts || 0, icon: Lock, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { label: "نشاط غير طبيعي", value: stats.abnormalActivity || 0, icon: Eye, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                ].map(s => {
                    const Icon = s.icon
                    return (
                        <div key={s.label} className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-3">
                            <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.color} flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
                            <p className="text-[10px] font-bold text-gray-400">{s.label}</p>
                        </div>
                    )
                })}
            </div>

            <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
                <h3 className="font-black text-sm mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-500" />سجل محاولات الدخول</h3>
                {loading ? (
                    <div className="py-10 text-center"><div className="h-6 w-6 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mx-auto" /></div>
                ) : (
                    <div className="space-y-2 text-xs">
                        {[
                            { ip: "192.168.1.1", user: "admin@codecraft.com", time: "منذ 5 دقائق", status: "نجاح" },
                            { ip: "10.0.0.5", user: "unknown@mail.com", time: "منذ 12 دقيقة", status: "فشل" },
                            { ip: "172.16.0.1", user: "teacher@codecraft.com", time: "منذ 30 دقيقة", status: "نجاح" },
                        ].map((entry, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-[10px] text-gray-400">{entry.ip}</span>
                                    <span className="text-gray-900 dark:text-white font-bold">{entry.user}</span>
                                    <span className="text-gray-400">{entry.time}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${entry.status === "نجاح" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                                    {entry.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}