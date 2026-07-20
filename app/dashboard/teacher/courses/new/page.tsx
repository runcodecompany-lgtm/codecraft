"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createDetailedCourse } from "@/actions/teacher-course"
import type { DifficultyLevel } from "@prisma/client"
import { getLearningTracks } from "@/actions/tracks"
import { 
  ArrowLeft, Save, Sparkles, BookOpen, Coins, 
  Layers, Info, FileText, ChevronRight, Upload, Loader2
} from "lucide-react"
import { uploadCourseCover } from "@/lib/upload"

export default function NewCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [tracks, setTracks] = useState<any[]>([])
  const [uploadingCover, setUploadingCover] = useState(false)
  
  useEffect(() => {
    getLearningTracks().then(res => {
      if (res.success && res.tracks) {
        setTracks(res.tracks)
      }
    })
  }, [])

  const [selectedRootId, setSelectedRootId] = useState("")
  const [selectedSubId, setSelectedSubId] = useState("")
  const [selectedLeafId, setSelectedLeafId] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImage: "",
    priceInCoins: 0,
    price: 0,
    level: "BEGINNER",
    language: "العربية",
    requirements: "",
    learningObjectives: "",
    status: "DRAFT"
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === "priceInCoins" || name === "price" ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const finalTrackId = selectedLeafId || selectedSubId || selectedRootId

    if (!formData.title || !formData.description || !finalTrackId) {
      setError("يرجى ملء الحقول الإلزامية: عنوان الدورة والوصف والمسار التعليمي.")
      setLoading(false)
      return
    }

    const res = await createDetailedCourse({
      ...formData,
      level: formData.level as DifficultyLevel,
      trackId: finalTrackId
    })
    if (res.success) {
      router.push(`/dashboard/teacher/courses/${res.courseId}`)
    } else {
      setError(res.error || "فشل إنشاء الدورة. حاول مرة أخرى.")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-right" dir="rtl">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-900 text-gray-500 dark:text-slate-400 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">إنشاء دورة جديدة</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">ابدأ ببناء مقرر تعليمي متميز لطلاب المنصة.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455 text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Basic Info */}
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2">
            <Info className="w-4.5 h-4.5" />
            <span>البيانات الأساسية</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">عنوان الدورة <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="أدخل عنواناً جذاباً..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">السعر بالعملات (CC)</label>
              <input
                type="number"
                name="priceInCoins"
                value={formData.priceInCoins}
                onChange={handleChange}
                min={0}
                placeholder="250"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">السعر بالدولار ($ USD)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min={0}
                step="0.01"
                placeholder="9.99"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">القسم الرئيسي <span className="text-rose-500">*</span></label>
              <select
                value={selectedRootId}
                onChange={(e) => {
                  setSelectedRootId(e.target.value)
                  setSelectedSubId("")
                  setSelectedLeafId("")
                }}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700 dark:text-slate-300"
              >
                <option value="">اختر القسم الرئيسي</option>
                {tracks.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {selectedRootId && tracks.find(t => t.id === selectedRootId)?.children?.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">المسار التعليمي الفرعي <span className="text-rose-500">*</span></label>
                <select
                  value={selectedSubId}
                  onChange={(e) => {
                    setSelectedSubId(e.target.value)
                    setSelectedLeafId("")
                  }}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700 dark:text-slate-300"
                >
                  <option value="">اختر المسار الفرعي</option>
                  {tracks.find(t => t.id === selectedRootId)?.children.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedSubId && tracks.find(t => t.id === selectedRootId)?.children?.find((sub: any) => sub.id === selectedSubId)?.children?.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">مستوى المسار <span className="text-rose-500">*</span></label>
                <select
                  value={selectedLeafId}
                  onChange={(e) => setSelectedLeafId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700 dark:text-slate-300"
                >
                  <option value="">اختر مستوى المسار</option>
                  {tracks.find(t => t.id === selectedRootId)?.children?.find((sub: any) => sub.id === selectedSubId)?.children?.map((leaf: any) => (
                    <option key={leaf.id} value={leaf.id}>{leaf.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">مستوى الدورة</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700 dark:text-slate-300"
              >
                <option value="BEGINNER">مبتدئ</option>
                <option value="INTERMEDIATE">متوسط</option>
                <option value="ADVANCED">متقدم</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">لغة الدورة</label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">صورة غلاف الدورة</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="رابط الصورة أو اختر ملفاً للرفع..."
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  dir="ltr"
                />
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingCover}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploadingCover(true)
                    setError("")
                    const url = await uploadCourseCover(file)
                    if (url) {
                      setFormData(prev => ({ ...prev, coverImage: url }))
                    } else {
                      setError("فشل رفع صورة الغلاف، حاول مرة أخرى.")
                    }
                    setUploadingCover(false)
                  }}
                  className="hidden"
                  id="cover-file-upload"
                />
                <label
                  htmlFor="cover-file-upload"
                  className="px-4 py-3 bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer flex-shrink-0 transition-colors border border-indigo-100 dark:border-indigo-900/40"
                >
                  {uploadingCover ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{uploadingCover ? "جاري الرفع..." : "رفع غلاف"}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-slate-300">وصف الدورة <span className="text-rose-500">*</span></label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="اكتب وصفاً تفصيلياً يوضح محتويات هذه الدورة..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
            />
          </div>
        </div>

        {/* Step 2: Advanced Info */}
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-black text-violet-600 dark:text-violet-400 flex items-center gap-2 mb-2">
            <Layers className="w-4.5 h-4.5" />
            <span>المتطلبات والأهداف التعليمية</span>
          </h2>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">متطلبات الدورة (ضع كل متطلب في سطر منفصل)</label>
              <textarea
                name="requirements"
                rows={3}
                value={formData.requirements}
                onChange={handleChange}
                placeholder="مثال: معرفة أساسية بأساسيات HTML&#10;شغف بتعلم البرمجة"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">الأهداف التعليمية (ضع كل هدف في سطر منفصل)</label>
              <textarea
                name="learningObjectives"
                rows={3}
                value={formData.learningObjectives}
                onChange={handleChange}
                placeholder="مثال: بناء مواقع ويب كاملة ومتجاوبة&#10;فهم عميق لنماذج وتخطيط الصفحات"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">الحالة المبدئية</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700 dark:text-slate-300"
              >
                <option value="DRAFT">مسودة (Draft)</option>
                <option value="REVIEW">قيد المراجعة (Review)</option>
                <option value="PUBLISHED">نشر مباشر (Published)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-indigo-600 to-violet-600 px-8 py-4 font-bold hover:scale-[1.01] hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white transition-all shadow-md"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>إنشاء المقرر والذهاب للمخطط الهيكلي</span>
        </button>
      </form>
      
    </div>
  )
}
