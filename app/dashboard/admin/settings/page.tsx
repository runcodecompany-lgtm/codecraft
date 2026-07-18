// app/dashboard/admin/settings/page.tsx
"use client"

import React, { useState, useEffect } from "react"
import { Settings, Save, Globe, Bell, Lock, Mail, DollarSign, Loader2 } from "lucide-react"
import { getAdminSettings, updateAdminSettings } from "@/actions/admin"

export default function AdminSettingsPage() {
    const [siteName, setSiteName] = useState("Code Craft Core")
    const [siteEmail, setSiteEmail] = useState("admin@codecraft.com")
    const [coinsPerUsd, setCoinsPerUsd] = useState("100")
    const [allowRegistration, setAllowRegistration] = useState(true)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        getAdminSettings().then(res => {
            if (res.success && res.settings) {
                if (res.settings.SITE_NAME) setSiteName(res.settings.SITE_NAME)
                if (res.settings.SITE_EMAIL) setSiteEmail(res.settings.SITE_EMAIL)
                if (res.settings.COINS_PER_USD) setCoinsPerUsd(res.settings.COINS_PER_USD)
            }
            setLoading(false)
        })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        setError("")
        const res = await updateAdminSettings({
            SITE_NAME: siteName,
            SITE_EMAIL: siteEmail,
            COINS_PER_USD: coinsPerUsd,
        })
        setSaving(false)
        if (res.success) {
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } else {
            setError(res.error || "فشل حفظ الإعدادات.")
        }
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6 text-right" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-gray-500/10 text-gray-500"><Settings className="w-5 h-5" /></div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">إعدادات المنصة</h1>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[
                    { 
                        title: "إعدادات عامة", 
                        icon: Globe, 
                        fields: [
                            { label: "اسم المنصة", value: siteName, setter: setSiteName }, 
                            { label: "البريد الإلكتروني للمنصة", value: siteEmail, setter: setSiteEmail }
                        ] 
                    },
                    { 
                        title: "إعدادات العملات والفوترة", 
                        icon: DollarSign, 
                        fields: [
                            { label: "سعر الصرف (عدد العملات CC مقابل 1 دولار USD)", value: coinsPerUsd, setter: setCoinsPerUsd, type: "number" }
                        ] 
                    },
                    { 
                        title: "إعدادات الإشعارات (تلقائي)", 
                        icon: Bell, 
                        fields: [
                            { label: "تفعيل الإشعارات", value: "مفعل" }, 
                            { label: "إشعارات البريد", value: "مفعل" }
                        ] 
                    },
                    { 
                        title: "إعدادات التسجيل والقبول (تلقائي)", 
                        icon: Lock, 
                        fields: [
                            { label: "التسجيل مفتوح للجميع", value: "نعم" }, 
                            { label: "مراجعة حسابات المعلمين", value: "مفعل تلقائي" }
                        ] 
                    },
                ].map(section => {
                    const Icon = section.icon
                    return (
                        <div key={section.title} className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4">
                            <h3 className="font-black text-sm flex items-center gap-2 text-indigo-650"><Icon className="w-4 h-4 text-indigo-500" />{section.title}</h3>
                            <div className="space-y-3">
                                {section.fields.map((f: any) => (
                                    <div key={f.label} className="flex items-center justify-between gap-4">
                                        <span className="text-xs text-gray-500 dark:text-slate-400">{f.label}</span>
                                        {f.setter ? (
                                            <input 
                                                type={f.type || "text"} 
                                                value={f.value} 
                                                onChange={e => f.setter(e.target.value)} 
                                                className="w-full max-w-[200px] text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 outline-none text-gray-800 dark:text-slate-100" 
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-gray-900 dark:text-white">{f.value}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            <button 
                onClick={handleSave} 
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
                {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Save className="w-4 h-4" />
                )}
                <span>{saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}</span>
            </button>
        </div>
    )
}