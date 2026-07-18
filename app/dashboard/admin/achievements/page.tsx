"use client"

import React, { useState, useEffect } from "react"
import { Star, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react"

export default function AdminAchievementsPage() {
    const [achievements, setAchievements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setTimeout(() => setLoading(false), 500)
    }, [])

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><Star className="w-5 h-5" /></div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة الإنجازات</h1>
            </div>
            <p className="text-sm text-gray-400">يمكنك إدارة إنجازات المنصة من هنا. قريباً سيتم دعم الإضافة والتعديل المباشر.</p>
        </div>
    )
}