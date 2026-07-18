"use client"

import React, { useState, useEffect, useCallback } from "react"
import { getAdminUsers, updateUserRole, toggleUserStatus, deleteUser } from "@/actions/admin"
import { Users, Search, Filter, ChevronLeft, ChevronRight, Shield, Trash2, X, AlertTriangle } from "lucide-react"

const ROLES = ["ALL", "ADMIN", "TEACHER", "STUDENT", "GUEST"]
const ROLE_LABELS: Record<string, string> = { ADMIN: "مشرف", TEACHER: "معلم", STUDENT: "طالب", GUEST: "زائر" }
const STATUS_LABELS: Record<string, string> = { ACTIVE: "نشط", INACTIVE: "غير نشط", SUSPENDED: "موقوف" }

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [pages, setPages] = useState(1)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("ALL")
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<any | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await getAdminUsers(search || undefined, roleFilter, page)
        if (res.success && res.users) { setUsers(res.users); setTotal(res.total); setPages(res.pages) }
        setLoading(false)
    }, [search, roleFilter, page])

    useEffect(() => { load() }, [load])

    const handleRoleChange = async (userId: string, role: string) => {
        await updateUserRole(userId, role); load()
    }
    const handleStatusToggle = async (userId: string, status: string) => {
        const newStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
        await toggleUserStatus(userId, newStatus); load()
    }
    const handleDelete = async (userId: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return
        await deleteUser(userId); setSelectedUser(null); load()
    }

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><Users className="w-5 h-5" /></div>
                <div><h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة المستخدمين</h1><p className="text-xs text-gray-500">إجمالي {total} مستخدم</p></div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="بحث بالاسم أو البريد..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="flex-1 bg-transparent text-sm outline-none" />
                    {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
                </div>
                <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }} className="text-xs bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none">
                    {ROLES.map(r => <option key={r} value={r}>{r === "ALL" ? "كل الأدوار" : ROLE_LABELS[r]}</option>)}
                </select>
            </div>

            {loading ? <div className="py-20 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" /></div>
                : <div className="overflow-x-auto rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <table className="w-full text-right text-xs">
                        <thead className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold">
                            <tr><th className="p-4">المستخدم</th><th className="p-4">البريد</th><th className="p-4">الدور</th><th className="p-4">الحالة</th><th className="p-4">XP</th><th className="p-4">العملات</th><th className="p-4">الإجراءات</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-900">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/20">
                                    <td className="p-4 font-bold text-gray-900 dark:text-white">{u.fullName || u.name || "غير معروف"}</td>
                                    <td className="p-4 text-gray-500">{u.email}</td>
                                    <td className="p-4">
                                        <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} className="text-[10px] bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg px-2 py-1 outline-none">
                                            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        <button onClick={() => handleStatusToggle(u.id, u.status)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600" : u.status === "SUSPENDED" ? "bg-rose-500/10 text-rose-600" : "bg-gray-100 text-gray-500"}`}>
                                            {STATUS_LABELS[u.status] || u.status}
                                        </button>
                                    </td>
                                    <td className="p-4 text-indigo-500 font-bold">{u.xp}</td>
                                    <td className="p-4 text-amber-500 font-bold">{u.craftCoins}</td>
                                    <td className="p-4">
                                        <div className="flex gap-1">
                                            <button onClick={() => setSelectedUser(u)} className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-500 hover:bg-gray-100">🔍</button>
                                            <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>}

            {pages > 1 && <div className="flex justify-center gap-2" dir="ltr">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)} className={`min-w-[36px] h-9 rounded-xl text-xs font-bold ${p === page ? "bg-indigo-600 text-white" : "border border-gray-200 dark:border-slate-800 text-gray-600"}`}>{p}</button>
                ))}
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            </div>}

            {selectedUser && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedUser(null)}>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4" onClick={e => e.stopPropagation()}>
                    <h3 className="font-black text-lg">تفاصيل المستخدم</h3>
                    <div className="space-y-2 text-sm">
                        <p><strong>الاسم:</strong> {selectedUser.fullName || selectedUser.name}</p>
                        <p><strong>البريد:</strong> {selectedUser.email}</p>
                        <p><strong>الدور:</strong> {ROLE_LABELS[selectedUser.role]}</p>
                        <p><strong>الحالة:</strong> {STATUS_LABELS[selectedUser.status]}</p>
                        <p><strong>XP:</strong> {selectedUser.xp}</p>
                        <p><strong>العملات:</strong> {selectedUser.craftCoins}</p>
                        <p><strong>المستوى:</strong> {selectedUser.level}</p>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="w-full py-2 rounded-xl bg-gray-100 dark:bg-slate-800 font-bold text-sm">إغلاق</button>
                </div>
            </div>}
        </div>
    )
}