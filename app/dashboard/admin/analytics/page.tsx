"use client"

import React, { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Users, BookOpen, HelpCircle } from "lucide-react"

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState<any>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/admin/analytics")
            .then(r => r.ok ? r.json() : {})
            .then(d => setStats(d))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><BarChart3 className="w-5 h-5" /></div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">التحليلات والتقارير</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "نمو المستخدمين", value: stats.userGrowth || "—", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { label: "معدل إكمال الدورات", value: `${stats.completionRate || 0}%`, icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { label: "معدل نجاح الاختبارات", value: `${stats.passRate || 0}%`, icon: HelpCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
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
                <h3 className="font-black text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" />نشاط المنصة</h3>
                <p className="text-xs text-gray-400">سيتم عرض رسوم بيانية تفاعلية قريباً.</p>
            </div>
        </div>
    )
}