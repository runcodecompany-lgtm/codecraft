"use client"

import React, { useState } from "react"
import { Coins, Plus, Minus, Search } from "lucide-react"
import { adjustUserCoins } from "@/actions/admin"

export default function AdminCoinsPage() {
    const [userId, setUserId] = useState("")
    const [amount, setAmount] = useState(0)
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState("")

    const handleAdjust = async (type: "add" | "deduct") => {
        if (!userId.trim() || amount <= 0) return
        setLoading(true)
        const res = await adjustUserCoins(userId, type === "add" ? amount : -amount, description || (type === "add" ? "إضافة عملات من الإدارة" : "خصم عملات من الإدارة"))
        setLoading(false)
        setStatus(res.success ? "تم بنجاح!" : res.error || "فشل")
        if (res.success) { setUserId(""); setAmount(0); setDescription("") }
        setTimeout(() => setStatus(""), 3000)
    }

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><Coins className="w-5 h-5" /></div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة العملات</h1>
            </div>
            <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4 max-w-lg">
                <h2 className="font-bold text-sm">تعديل العملات</h2>
                {status && <div className={`text-sm p-3 rounded-xl ${status.includes("نجاح") ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{status}</div>}
                <input type="text" placeholder="ID المستخدم" value={userId} onChange={e => setUserId(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none" />
                <input type="number" placeholder="العدد" value={amount || ""} onChange={e => setAmount(Number(e.target.value))} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none" />
                <input type="text" placeholder="السبب" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none" />
                <div className="flex gap-3">
                    <button onClick={() => handleAdjust("add")} disabled={loading} className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm"><Plus className="w-4 h-4" />إضافة</button>
                    <button onClick={() => handleAdjust("deduct")} disabled={loading} className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm"><Minus className="w-4 h-4" />خصم</button>
                </div>
            </div>
        </div>
    )
}