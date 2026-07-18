"use client"

import React, { useState } from "react"
import { Bell, Send } from "lucide-react"
import { sendNotification } from "@/actions/admin"

export default function AdminNotificationsPage() {
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const [target, setTarget] = useState("all")
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState("")

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) return
        setLoading(true)
        const res = await sendNotification([], title, message, "SYSTEM")
        setLoading(false)
        setStatus(res.success ? "تم الإرسال بنجاح!" : "فشل الإرسال")
        if (res.success) { setTitle(""); setMessage("") }
        setTimeout(() => setStatus(""), 3000)
    }

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500"><Bell className="w-5 h-5" /></div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة الإشعارات</h1>
            </div>
            <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4 max-w-2xl">
                <h2 className="font-bold text-sm">إرسال إشعار جديد</h2>
                {status && <div className={`text-sm p-3 rounded-xl ${status.includes("نجاح") ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{status}</div>}
                <input type="text" placeholder="عنوان الإشعار" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none" />
                <textarea rows={3} placeholder="محتوى الإشعار" value={message} onChange={e => setMessage(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none resize-none" />
                <select value={target} onChange={e => setTarget(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm">
                    <option value="all">جميع المستخدمين</option>
                    <option value="students">جميع الطلاب</option>
                    <option value="teachers">جميع المعلمين</option>
                </select>
                <button onClick={handleSend} disabled={loading || !title.trim()} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-50">
                    <Send className="w-4 h-4" />{loading ? "جاري الإرسال..." : "إرسال الإشعار"}
                </button>
            </div>
        </div>
    )
}