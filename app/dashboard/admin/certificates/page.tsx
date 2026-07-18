"use client"

import React, { useState, useEffect, useCallback } from "react"
import { getAdminCertificates, revokeCertificate } from "@/actions/admin"
import { Award, Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"

export default function AdminCertificatesPage() {
    const [certificates, setCertificates] = useState<any[]>([])
    const [total, setTotal] = useState(0); const [pages, setPages] = useState(1)
    const [page, setPage] = useState(1); const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await getAdminCertificates(search || undefined, page)
        if (res.success && res.certificates) { setCertificates(res.certificates); setTotal(res.total || 0); setPages(res.pages || 1) }
        setLoading(false)
    }, [search, page])
    useEffect(() => { load() }, [load])

    const handleRevoke = async (id: string) => {
        if (!confirm("هل أنت متأكد من إلغاء هذه الشهادة؟")) return
        await revokeCertificate(id); load()
    }

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500"><Award className="w-5 h-5" /></div>
                <div><h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة الشهادات</h1><p className="text-xs text-gray-500">إجمالي {total} شهادة</p></div>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 max-w-md">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" placeholder="بحث برقم الشهادة أو اسم المستخدم..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="flex-1 bg-transparent text-sm outline-none" />
            </div>
            {loading ? <div className="py-20 text-center"><div className="h-8 w-8 animate-spin mx-auto border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
                : <div className="overflow-x-auto rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <table className="w-full text-right text-xs">
                        <thead className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold">
                            <tr><th className="p-4">رقم الشهادة</th><th className="p-4">المستخدم</th><th className="p-4">الدورة</th><th className="p-4">تاريخ الإصدار</th><th className="p-4">الإجراءات</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-900">
                            {certificates.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50/50">
                                    <td className="p-4 font-mono font-bold text-indigo-600">{c.certificateNumber}</td>
                                    <td className="p-4 font-bold text-gray-900 dark:text-white">{c.user?.fullName || c.user?.name}</td>
                                    <td className="p-4 text-gray-500">{c.course?.title}</td>
                                    <td className="p-4 text-gray-400">{new Date(c.createdAt).toLocaleDateString("ar-EG")}</td>
                                    <td className="p-4">
                                        <button onClick={() => handleRevoke(c.id)} className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>}
            {pages > 1 && <div className="flex justify-center gap-2" dir="ltr">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-xl border border-gray-200 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)} className={`min-w-[36px] h-9 rounded-xl text-xs font-bold ${p === page ? "bg-indigo-600 text-white" : "border border-gray-200 text-gray-600"}`}>{p}</button>
                ))}
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-xl border border-gray-200 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            </div>}
        </div>
    )
}