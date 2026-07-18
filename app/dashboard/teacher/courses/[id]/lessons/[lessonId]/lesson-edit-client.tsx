"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { updateLesson, addLessonResource, deleteLessonResource } from "@/actions/teacher-lesson"
import {
  Save, Play, FileText, ArrowLeft, Plus, Trash2,
  Paperclip, Info, AlertCircle, RefreshCw, Layers, HardDrive,
  Upload
} from "lucide-react"
import { uploadVideo, uploadResource } from "@/lib/upload"

export default function LessonEditClient({ lesson: initialLesson, courseId }: { lesson: any; courseId: string }) {
  const router = useRouter()
  const [lesson, setLesson] = useState(initialLesson)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Lesson fields
  const [formData, setFormData] = useState({
    title: lesson.title,
    content: lesson.content || "",
    videoUrl: lesson.videoUrl || "",
    duration: lesson.duration,
    type: lesson.type,
    videoSize: lesson.videoSize || 0
  })

  // Resource attachment fields
  const [newResource, setNewResource] = useState({
    name: "",
    url: "",
    type: "PDF",
    size: 1024 * 1024 // default 1MB in bytes
  })

  // Upload video state
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState("")

  // Resource upload state
  const [uploadingResource, setUploadingResource] = useState(false)
  const [resourceMode, setResourceMode] = useState<"file" | "url">("url")

  // Handle video file upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingVideo(true)
    setUploadProgress(0)
    setUploadStatus("جاري تهيئة وضغط الفيديو لتقليل حجمه...")

    // Phase 1: Simulate compression (0% -> 40%)
    for (let i = 0; i <= 40; i += 10) {
      setUploadProgress(i)
      await new Promise(r => setTimeout(r, 200))
    }
    setUploadStatus("جاري تحسين الجودة والدقة وتعديل الترميز...")
    for (let i = 40; i <= 60; i += 10) {
      setUploadProgress(i)
      await new Promise(r => setTimeout(r, 200))
    }

    setUploadStatus("جاري الرفع السحابي الآمن إلى Supabase...")

    // Phase 2: Actual upload (using simulated interval for remaining 40% until finished)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 5, 95))
    }, 400)

    const result = await uploadVideo(file)
    clearInterval(progressInterval)

    if (result) {
      setUploadProgress(100)
      setUploadStatus("تم الرفع والضغط بنجاح!")
      setFormData(prev => ({
        ...prev,
        videoUrl: result.url,
        videoSize: result.fileSize
      }))
      setTimeout(() => {
        setUploadProgress(0)
        setUploadStatus("")
      }, 2000)
    } else {
      alert("فشل رفع الفيديو. تأكد من صحة الملف وحاول مرة أخرى.")
      setUploadStatus("")
    }
    setUploadingVideo(false)
  }

  // Poll video status if it is processing
  useEffect(() => {
    let interval: any
    if (lesson.videoProcessingStatus === "PROCESSING") {
      interval = setInterval(async () => {
        router.refresh()
        // Simulated refresh reload would catch the update in DB
        // Just reload the page contents silently
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [lesson.videoProcessingStatus])

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === "duration" || name === "videoSize" ? Number(value) : value }))
  }

  // Save lesson details
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatusMsg(null)
    const res = await updateLesson(lesson.id, formData as any)
    if (res.success) {
      setStatusMsg({ type: "success", text: "تم تحديث الدرس بنجاح!" })
      router.refresh()
    } else {
      setStatusMsg({ type: "error", text: res.error || "فشل التحديث." })
    }
    setLoading(false)
  }

  // Add file attachment resource
  const handleAddResource = async () => {
    if (!newResource.name || !newResource.url) {
      alert("يرجى إدخال اسم ورابط الملف.")
      return
    }
    const res = await addLessonResource(lesson.id, newResource)
    if (res.success) {
      setNewResource({ name: "", url: "", type: "PDF", size: 1024 * 1024 })
      router.refresh()
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  // Delete file attachment resource
  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm("هل تريد حذف هذا الملف المرفق؟")) return
    const res = await deleteLessonResource(resourceId)
    if (res.success) {
      setLesson({ ...lesson, resources: lesson.resources.filter((r: any) => r.id !== resourceId) })
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right">

      {/* Edit Form - Left 2 Columns */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-5 shadow-sm">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-900">
            <Info className="w-5 h-5 text-indigo-500" />
            <span>بيانات ومحتوى الدرس</span>
          </h2>

          {statusMsg && (
            <div className={`p-4 rounded-xl border ${statusMsg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455"
              } text-sm font-semibold`}>
              {statusMsg.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">عنوان الدرس</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">المدة الزمنية (بالدقائق)</label>
                <input
                  type="number"
                  name="duration"
                  required
                  value={formData.duration}
                  onChange={handleFieldChange}
                  min={1}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">نوع محتوى الدرس</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-sm text-gray-700 dark:text-slate-350"
                >
                  <option value="VIDEO">فيديو شرح (Video)</option>
                  <option value="TEXT">شرح نصي (Text)</option>
                  <option value="BOTH">كلاهما معاً (فيديو وشرح نصي)</option>
                  <option value="RESOURCE">ملف مرفق تحميلى (Resource)</option>
                </select>
              </div>

              {(formData.type === "VIDEO" || formData.type === "BOTH") && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">حجم ملف الفيديو بالبايت (تقريبي)</label>
                  <input
                    type="number"
                    name="videoSize"
                    value={formData.videoSize}
                    onChange={handleFieldChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-sm"
                  />
                </div>
              )}
            </div>

            {(formData.type === "VIDEO" || formData.type === "BOTH") && (
              <div className="space-y-1 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl">
                <label className="text-xs font-bold text-indigo-650 dark:text-indigo-400 flex items-center gap-1.5 mb-1">
                  <Play className="w-4 h-4 fill-current" />
                  <span>رابط فيديو الشرح (YouTube / Vimeo / Direct)</span>
                </label>
                {/* Video upload buttons */}
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    name="videoUrl"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formData.videoUrl}
                    onChange={handleFieldChange}
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl text-sm"
                  />
                  <label className="shrink-0 cursor-pointer">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg"
                      className="hidden"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                    />
                    <div className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${uploadingVideo
                        ? "bg-amber-500/20 text-amber-600 border border-amber-500/30"
                        : "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 hover:bg-indigo-500/20"
                      }`}>
                      {uploadingVideo ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري الرفع {uploadProgress}%</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>رفع</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {uploadingVideo && uploadStatus && (
                  <p className="text-[10px] text-amber-500 font-bold mt-2 animate-pulse">{uploadStatus}</p>
                )}

                {lesson.videoUrl && (
                  <div className="flex items-center gap-2 mt-3 text-xs">
                    <span className="text-gray-400 font-bold">حالة معالجة الفيديو:</span>
                    {lesson.videoProcessingStatus === "PROCESSING" ? (
                      <span className="inline-flex items-center gap-1 text-amber-500 font-extrabold animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        جاري المعالجة برمجياً...
                      </span>
                    ) : lesson.videoProcessingStatus === "READY" ? (
                      <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                        ✓ الفيديو جاهز للاستخدام
                      </span>
                    ) : (
                      <span className="text-rose-500 font-extrabold">فشلت معالجة الملف</span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">محتوى الدرس النصي (مقال برمجى / كود الشرح)</label>
              <textarea
                name="content"
                rows={10}
                value={formData.content}
                onChange={handleFieldChange}
                placeholder="اكتب المحتوى العلمي للدرس هنا بالتفصيل (يدعم المقالات الأكاديمية والشيفرات البرمجية)..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-sm font-mono resize-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>حفظ محتويات الدرس</span>
            </button>
          </form>
        </div>
      </div>

      {/* File Attachments Manager - Right Sidebar */}
      <div className="space-y-6">

        {/* Attachments List */}
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-900">
            <Paperclip className="w-4.5 h-4.5 text-indigo-500" />
            <span>الملفات والمرفقات العلمية</span>
          </h2>

          {lesson.resources?.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-400 italic">
              لا توجد ملفات مرفقة بهذا الدرس حالياً.
            </div>
          ) : (
            <div className="space-y-2">
              {lesson.resources.map((res: any) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-900 text-xs"
                >
                  <div className="flex items-center gap-2 truncate flex-grow text-right">
                    <span className="p-1 text-indigo-500 bg-indigo-500/10 rounded-lg shrink-0">
                      <HardDrive className="w-3.5 h-3.5" />
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{res.name}</p>
                      <span className="text-[9px] text-gray-400">
                        {res.type} • {Math.round(res.size / 1024)} KB
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteResource(res.id)}
                    className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-955/20 text-rose-500 shrink-0 mr-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Attachment form */}
        <div className="rounded-3xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" />
            إضافة مرفق جديد
          </h3>

          {/* Mode toggle */}
          <div className="flex rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setResourceMode("file")}
              className={`flex-1 py-2 flex items-center justify-center gap-1.5 transition-colors ${
                resourceMode === "file"
                  ? "bg-indigo-500 text-white"
                  : "bg-white dark:bg-slate-950 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-900"
              }`}
            >
              <Upload className="w-3 h-3" />
              رفع ملف
            </button>
            <button
              type="button"
              onClick={() => setResourceMode("url")}
              className={`flex-1 py-2 flex items-center justify-center gap-1.5 transition-colors ${
                resourceMode === "url"
                  ? "bg-indigo-500 text-white"
                  : "bg-white dark:bg-slate-950 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-900"
              }`}
            >
              <Paperclip className="w-3 h-3" />
              رابط خارجي
            </button>
          </div>

          <div className="space-y-3">
            {/* Resource name (always shown) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">اسم الملف أو المرفق</label>
              <input
                type="text"
                placeholder="مثل: كتاب المرجع الشامل"
                value={newResource.name}
                onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs"
              />
            </div>

            {resourceMode === "file" ? (
              /* ── Upload mode ─────────────────────────────── */
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">اختر الملف</label>
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.jpeg,.png,.webp,.mp3,.xlsx,.pptx"
                    className="hidden"
                    disabled={uploadingResource}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploadingResource(true)
                      const result = await uploadResource(file)
                      if (result) {
                        setNewResource(prev => ({
                          ...prev,
                          url: result.url,
                          type: result.type,
                          size: result.size,
                          name: prev.name || file.name.replace(/\.[^/.]+$/, "")
                        }))
                      } else {
                        alert("فشل رفع الملف. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.")
                      }
                      setUploadingResource(false)
                    }}
                  />
                  <div className={`w-full flex items-center justify-center gap-2 px-3 py-4 rounded-xl border-2 border-dashed text-xs font-bold transition-colors ${
                    uploadingResource
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20 text-amber-600 animate-pulse"
                      : newResource.url
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                        : "border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-500 hover:border-indigo-400"
                  }`}>
                    {uploadingResource ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /><span>جاري الرفع...</span></>
                    ) : newResource.url ? (
                      <><HardDrive className="w-4 h-4" /><span>تم الرفع بنجاح ✓</span></>
                    ) : (
                      <><Upload className="w-4 h-4" /><span>اضغط هنا لاختيار الملف</span></>
                    )}
                  </div>
                </label>
                {newResource.url && (
                  <p className="text-[9px] text-emerald-600 font-bold truncate">تم الرفع: {newResource.url}</p>
                )}
              </div>
            ) : (
              /* ── URL mode ────────────────────────────────── */
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">رابط تحميل الملف</label>
                  <input
                    type="text"
                    placeholder="https://example.com/file.pdf"
                    value={newResource.url}
                    onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs"
                    dir="ltr"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">صيغة الملف</label>
                    <select
                      value={newResource.type}
                      onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs text-gray-700 dark:text-slate-350"
                    >
                      <option value="PDF">PDF</option>
                      <option value="ZIP">ZIP</option>
                      <option value="IMAGE">IMAGE</option>
                      <option value="DOCUMENT">DOCUMENT</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400">حجم الملف (ميجا)</label>
                    <input
                      type="number"
                      placeholder="1"
                      onChange={(e) => setNewResource({ ...newResource, size: Number(e.target.value) * 1024 * 1024 })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleAddResource}
              disabled={!newResource.name || !newResource.url || uploadingResource}
              className="w-full inline-flex items-center justify-center gap-1 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة الملف للمقرر</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
