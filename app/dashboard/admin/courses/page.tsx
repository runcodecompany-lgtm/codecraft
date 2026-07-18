"use client"

import React, { useState, useEffect, useCallback } from "react"
import { getAdminCourses, adminUpdateCourseStatus } from "@/actions/admin"
import { BookOpen, Search, ChevronLeft, ChevronRight, Eye, EyeOff, Archive, Trash2, X } from "lucide-react"

const STATUSES = ["ALL", "DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]
const STATUS_LABELS: Record<string, string> = { DRAFT: "مسودة", REVIEW: "قيد المراجعة", PUBLISHED: "منشورة", ARCHIVED: "مؤرشفة" }

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [pages, setPages] = useState(1)
    const [page, setPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await getAdminCourses(statusFilter === "ALL" ? undefined : statusFilter, page)
        if (res.success && res.courses) { setCourses(res.courses); setTotal(res.total || 0); setPages(res.pages || 1) }
        setLoading(false)
    }, [statusFilter, page])

    useEffect(() => { load() }, [load])

    const handleStatus = async (id: string, status: string) => {
        await adminUpdateCourseStatus(id, status); load()
    }

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500"><BookOpen className="w-5 h-5" /></div>
                <div><h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة الدورات</h1><p className="text-xs text-gray-500">إجمالي {total} دورة</p></div>
            </div>

            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="text-xs bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none">
                {STATUSES.map(s => <option key={s} value={s}>{s === "ALL" ? "كل الحالات" : STATUS_LABELS[s]}</option>)}
            </select>

            {loading ? <div className="py-20 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" /></div>
                : <div className="space-y-3">
                    {courses.map(c => (
                        <div key={c.id} className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{c.title}</h3>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                                    <span>المعلم: {c.teacher?.name}</span>
                                    <span>المسار: {c.track?.name || "غير مصنف"}</span>
                                    <span>التصنيف: {c.category?.name || "غير محدد"}</span>
                                    <span>التصنيف الفرعي: {c.subcategory?.name || "غير محدد"}</span>
                                    <span>{c._count?.enrollments || 0} طالب</span>
                                    <span>{c._count?.modules || 0} وحدة</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-600" : c.status === "REVIEW" ? "bg-amber-500/10 text-amber-600" : c.status === "ARCHIVED" ? "bg-gray-100 text-gray-500" : "bg-blue-500/10 text-blue-600"}`}>
                                    {STATUS_LABELS[c.status]}
                                </span>
                                <div className="flex gap-1 mr-3">
                                    {c.status !== "PUBLISHED" && <button onClick={() => handleStatus(c.id, "PUBLISHED")} className="p-1.5 rounded-lg border border-emerald-200 text-emerald-500 hover:bg-emerald-50" title="نشر"><Eye className="w-3.5 h-3.5" /></button>}
                                    {c.status === "PUBLISHED" && <button onClick={() => handleStatus(c.id, "DRAFT")} className="p-1.5 rounded-lg border border-amber-200 text-amber-500 hover:bg-amber-50" title="إلغاء نشر"><EyeOff className="w-3.5 h-3.5" /></button>}
                                    {c.status !== "ARCHIVED" && <button onClick={() => handleStatus(c.id, "ARCHIVED")} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100" title="أرشفة"><Archive className="w-3.5 h-3.5" /></button>}
                                </div>
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
        </div>
    )
}
