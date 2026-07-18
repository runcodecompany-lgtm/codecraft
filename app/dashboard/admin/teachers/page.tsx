"use client"

import React, { useState, useEffect, useCallback } from "react"
import { getAdminTeachers, toggleUserStatus } from "@/actions/admin"
import { UserCheck, ChevronLeft, ChevronRight, Shield, X } from "lucide-react"

export default function AdminTeachersPage() {
    const [teachers, setTeachers] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [pages, setPages] = useState(1)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await getAdminTeachers(page)
        if (res.success && res.teachers) { setTeachers(res.teachers); setTotal(res.total || 0); setPages(res.pages || 1) }
        setLoading(false)
    }, [page])

    useEffect(() => { load() }, [load])

    const handleSuspend = async (id: string, status: string) => {
        await toggleUserStatus(id, status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"); load()
    }

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><UserCheck className="w-5 h-5" /></div>
                <div><h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة المعلمين</h1><p className="text-xs text-gray-500">إجمالي {total} معلم</p></div>
            </div>

            {loading ? <div className="py-20 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" /></div>
                : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {teachers.map(t => (
                        <div key={t.id} className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm">
                                    {(t.fullName || t.name || "T").charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{t.fullName || t.name}</h3>
                                    <p className="text-[10px] text-gray-400">{t.email}</p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                                <p>الدورات: {t._count?.coursesTaught || 0}</p>
                                <p>المسمى: {t.teacherProfile?.title || "غير محدد"}</p>
                                <p>المهارات: {t.teacherProfile?.skills?.substring(0, 50) || "غير محدد"}</p>
                            </div>
                            <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-900">
                                <button onClick={() => setSelectedTeacher(t)} className="flex-1 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 text-xs font-bold hover:bg-gray-50">عرض الملف</button>
                                <button onClick={() => handleSuspend(t.id, t.status)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${t.status === "ACTIVE" ? "bg-rose-500/10 text-rose-600 border border-rose-200" : "bg-emerald-500/10 text-emerald-600 border border-emerald-200"}`}>
                                    {t.status === "ACTIVE" ? "تعليق" : "إعادة تفعيل"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>}

            {pages > 1 && <div className="flex justify-center gap-2" dir="ltr">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)} className={`min-w-[36px] h-9 rounded-xl text-xs font-bold ${p === page ? "bg-indigo-600 text-white" : "border border-gray-200 dark:border-slate-800 text-gray-600"}`}>{p}</button>
                ))}
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            </div>}

            {selectedTeacher && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedTeacher(null)}>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full space-y-4" onClick={e => e.stopPropagation()}>
                    <h3 className="font-black text-lg">ملف المعلم</h3>
                    <div className="space-y-2 text-sm">
                        <p><strong>الاسم:</strong> {selectedTeacher.fullName || selectedTeacher.name}</p>
                        <p><strong>البريد:</strong> {selectedTeacher.email}</p>
                        <p><strong>المسمى:</strong> {selectedTeacher.teacherProfile?.title || "غير محدد"}</p>
                        <p><strong>المهارات:</strong> {selectedTeacher.teacherProfile?.skills || "غير محدد"}</p>
                        <p><strong>السيرة:</strong> {selectedTeacher.teacherProfile?.bio?.substring(0, 200) || "غير محدد"}</p>
                        <p><strong>الحالة:</strong> {selectedTeacher.status === "ACTIVE" ? "🟢 نشط" : selectedTeacher.status === "SUSPENDED" ? "🔴 موقوف" : "⚪ غير نشط"}</p>
                    </div>
                    <button onClick={() => setSelectedTeacher(null)} className="w-full py-2 rounded-xl bg-gray-100 dark:bg-slate-800 font-bold text-sm">إغلاق</button>
                </div>
            </div>}
        </div>
    )
}