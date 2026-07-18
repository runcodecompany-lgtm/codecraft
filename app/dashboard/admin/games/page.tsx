"use client"

import React, { useState, useEffect } from "react"
import { Gamepad2, Trash2, Power, PowerOff } from "lucide-react"

export default function AdminGamesPage() {
    const [games, setGames] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/admin/games").then(r => r.ok ? r.json() : { games: [] })
            .then(d => setGames(d.games || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500"><Gamepad2 className="w-5 h-5" /></div>
                <div><h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة الألعاب</h1><p className="text-xs text-gray-500">إجمالي {games.length} لعبة</p></div>
            </div>
            {loading ? <div className="py-20 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" /></div>
                : games.length === 0 ? <div className="text-center py-20 text-gray-400 text-sm">لا توجد ألعاب في النظام حالياً.</div>
                    : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {games.map((g: any) => (
                            <div key={g.id} className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold text-sm">🎮</div>
                                    <div><h3 className="font-bold text-sm text-gray-900 dark:text-white">{g.title || g.name || "لعبة"}</h3><p className="text-[10px] text-gray-400">{g.type || "code-challenge"}</p></div>
                                </div>
                                <div className="text-xs text-gray-500 space-y-1"><p>النقاط: {g.points || 0}</p><p>المستوى: {g.level || "متوسط"}</p></div>
                                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-900">
                                    <button className="flex-1 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 text-xs font-bold hover:bg-gray-50">تعديل</button>
                                    <button className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>}
        </div>
    )
}