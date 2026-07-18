"use client"

import React, { useEffect, useState, useTransition } from "react"
import {
  MessageSquare, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Layers, Save, X, Hash, AlignLeft, Tag, SortAsc, Loader2, CheckCircle, AlertCircle
} from "lucide-react"
import {
  getAdminForums,
  getAdminTrackOptions,
  createForum,
  updateForum,
  deleteForum,
} from "@/actions/admin"

// Available icons for forum sections
const ICON_OPTIONS = [
  "MessageSquare", "Code2", "Brain", "Database", "Globe",
  "Layout", "Cpu", "Terminal", "Layers", "Zap", "BookOpen",
  "Trophy", "Star", "Flame", "Heart", "Shield"
]

type Forum = {
  id: string
  title: string
  description: string | null
  slug: string
  icon: string | null
  order: number
  isActive: boolean
  createdAt: Date
  track: { id: string; name: string } | null
  _count: { topics: number }
}

type FormState = {
  title: string
  description: string
  slug: string
  icon: string
  order: string
  trackId: string
}

const emptyForm: FormState = { title: "", description: "", slug: "", icon: "MessageSquare", order: "0", trackId: "" }

function toSlug(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s\u0600-\u06FF]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export default function AdminForumsPage() {
  const [forums, setForums] = useState<Forum[]>([])
  const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadForums = async () => {
    setLoading(true)
    const [forumsRes, tracksRes] = await Promise.all([getAdminForums(), getAdminTrackOptions()])
    if (forumsRes.success && forumsRes.forums) setForums(forumsRes.forums as Forum[])
    if (tracksRes.success && tracksRes.tracks) setTracks(tracksRes.tracks)
    setLoading(false)
  }

  useEffect(() => { loadForums() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (f: Forum) => {
    setEditingId(f.id)
    setForm({
      title: f.title,
      description: f.description || "",
      slug: f.slug,
      icon: f.icon || "MessageSquare",
      order: String(f.order),
      trackId: f.track?.id || "",
    })
    setShowModal(true)
  }

  const handleTitleChange = (val: string) => {
    setForm(prev => ({
      ...prev,
      title: val,
      slug: editingId ? prev.slug : toSlug(val),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.slug.trim()) {
      showToast("اسم القسم والرابط المختصر مطلوبان.", "error")
      return
    }

    startTransition(async () => {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        slug: form.slug.trim(),
        icon: form.icon,
        order: Number(form.order) || 0,
        trackId: form.trackId || undefined,
      }

      const res = editingId
        ? await updateForum(editingId, payload)
        : await createForum(payload)

      if (res.success) {
        showToast(editingId ? "تم تحديث القسم بنجاح." : "تم إنشاء القسم بنجاح.", "success")
        setShowModal(false)
        loadForums()
      } else {
        showToast(res.error || "حدث خطأ.", "error")
      }
    })
  }

  const handleToggle = async (f: Forum) => {
    setTogglingId(f.id)
    const res = await updateForum(f.id, { isActive: !f.isActive })
    if (res.success) {
      showToast(f.isActive ? "تم تعطيل القسم." : "تم تفعيل القسم.", "success")
      loadForums()
    } else {
      showToast(res.error || "فشل تغيير الحالة.", "error")
    }
    setTogglingId(null)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف قسم "${title}"؟ سيتم حذف جميع مواضيعه أيضاً.`)) return
    setDeletingId(id)
    const res = await deleteForum(id)
    if (res.success) {
      showToast("تم حذف القسم بنجاح.", "success")
      loadForums()
    } else {
      showToast(res.error || "فشل الحذف.", "error")
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold border transition-all ${
          toast.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300"
            : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            إدارة أقسام المنتدى
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            أضف وعدّل وحذف الأقسام التي تظهر في صفحة المنتديات.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          إضافة قسم جديد
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي الأقسام", value: forums.length, color: "indigo" },
          { label: "الأقسام النشطة", value: forums.filter(f => f.isActive).length, color: "emerald" },
          { label: "إجمالي المواضيع", value: forums.reduce((s, f) => s + f._count.topics, 0), color: "amber" },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 text-center">
            <div className={`text-2xl font-black text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</div>
            <div className="text-xs text-gray-400 font-semibold mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">جار التحميل...</span>
          </div>
        ) : forums.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-gray-400 dark:text-slate-500 font-semibold text-sm">لا توجد أقسام بعد.</p>
            <button onClick={openCreate} className="mt-4 text-indigo-600 hover:text-indigo-500 text-sm font-bold">
              + إضافة أول قسم
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/60">
                  <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">#</th>
                  <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">القسم</th>
                  <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">الرابط</th>
                  <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">المسار</th>
                  <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">المواضيع</th>
                  <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">الترتيب</th>
                  <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">الحالة</th>
                  <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
                {forums.map((f, i) => (
                  <tr key={f.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-gray-400 text-xs">{i + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{f.title}</p>
                          {f.description && (
                            <p className="text-xs text-gray-400 dark:text-slate-500 truncate max-w-[200px]">{f.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-mono bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-gray-600 dark:text-slate-400">
                        /{f.slug}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                        {f.track?.name || "عام"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-gray-700 dark:text-slate-300">{f._count.topics}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-500 dark:text-slate-400 font-semibold">{f.order}</span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggle(f)}
                        disabled={togglingId === f.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                          f.isActive
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-500 border border-gray-200 dark:border-slate-700"
                        }`}
                      >
                        {togglingId === f.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : f.isActive ? (
                          <ToggleRight className="w-3.5 h-3.5" />
                        ) : (
                          <ToggleLeft className="w-3.5 h-3.5" />
                        )}
                        {f.isActive ? "نشط" : "معطّل"}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(f)}
                          className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
                          title="تعديل"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id, f.title)}
                          disabled={deletingId === f.id}
                          className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50"
                          title="حذف"
                        >
                          {deletingId === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {editingId ? "تعديل القسم" : "إضافة قسم جديد"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1.5">
                  <Tag className="w-3.5 h-3.5 inline ml-1" />
                  اسم القسم *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="مثال: البرمجة العامة"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1.5">
                  <AlignLeft className="w-3.5 h-3.5 inline ml-1" />
                  الوصف (اختياري)
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="وصف مختصر لهذا القسم..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1.5">
                  <Hash className="w-3.5 h-3.5 inline ml-1" />
                  الرابط المختصر (slug) *
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                  placeholder="general-programming"
                  required
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono dark:text-white"
                />
                <p className="text-[11px] text-gray-400 mt-1">يُستخدم في رابط الصفحة. حروف إنجليزية وشرطات فقط.</p>
              </div>

              {/* Icon + Order Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1.5">
                    الأيقونة
                  </label>
                  <select
                    value={form.icon}
                    onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    {ICON_OPTIONS.map(ic => (
                      <option key={ic} value={ic}>{ic}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1.5">
                    <SortAsc className="w-3.5 h-3.5 inline ml-1" />
                    الترتيب
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.order}
                    onChange={e => setForm(p => ({ ...p, order: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1.5">
                  ربط القسم بمسار تعليمي
                </label>
                <select
                  value={form.trackId}
                  onChange={e => setForm(p => ({ ...p, trackId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="">قسم عام غير مرتبط بمسار</option>
                  {tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">يساعد ذلك في تصفية المجتمع حسب المسار التعليمي.</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isPending ? "جار الحفظ..." : editingId ? "حفظ التعديلات" : "إنشاء القسم"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
