"use client"

import React from "react"
import { Shield, Plus, Trash2 } from "lucide-react"

export default function AdminRolesPage() {
    const roles = [
        { id: "1", name: "مدير عام (SUPER_ADMIN)", permissions: ["كل الصلاحيات", "إدارة النظام", "إدارة الأدوار"], userCount: 1 },
        { id: "2", name: "مشرف (ADMIN)", permissions: ["إدارة المستخدمين", "إدارة الدورات", "إدارة الشهادات"], userCount: 2 },
        { id: "3", name: "مشرف مجتمع (MODERATOR)", permissions: ["إدارة المجتمع", "مراجعة المحتوى", "حظر المخالفات"], userCount: 3 },
        { id: "4", name: "معلم معتمد (TEACHER)", permissions: ["إنشاء دورات", "إدارة الدروس", "إنشاء اختبارات", "متابعة الطلاب"], userCount: 5 },
        { id: "5", name: "طالب (STUDENT)", permissions: ["التسجيل في الدورات", "حل الاختبارات", "الحصول على شهادات", "الألعاب"], userCount: 150 },
        { id: "6", name: "زائر (GUEST)", permissions: ["تصفح الدورات العامة", "مشاهدة المقالات"], userCount: 10 },
    ]

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><Shield className="w-5 h-5" /></div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة الأدوار والصلاحيات</h1>
            </div>

            <div className="space-y-4">
                {roles.map(r => (
                    <div key={r.id} className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white">{r.name}</h3>
                            <span className="text-[10px] text-gray-400">{r.userCount} مستخدم</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {r.permissions.map(p => (
                                <span key={p} className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">{p}</span>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-900">
                            <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50">تعديل</button>
                            {r.id !== "1" && <button className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 text-xs font-bold hover:bg-rose-50"><Trash2 className="w-3 h-3 inline-block ml-1" />حذف</button>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
