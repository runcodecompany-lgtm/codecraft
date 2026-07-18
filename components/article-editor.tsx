"use client"

import React, { useState } from "react"
import { Sparkles, Save, Eye, Edit3, AlertCircle, CheckCircle, BookOpen, Layers } from "lucide-react"
import { createArticle } from "@/actions/article"

interface CourseOption {
  id: string
  title: string
}

interface ArticleEditorProps {
  courses: CourseOption[]
}

export default function ArticleEditor({ courses }: ArticleEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [published, setPublished] = useState(false)
  const [courseId, setCourseId] = useState("")
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    if (!title.trim() || !content.trim()) {
      setErrorMsg("يرجى ملء جميع الحقول المطلوبة (عنوان المقال ومحتواه).")
      setLoading(false)
      return
    }

    try {
      const result = await createArticle({
        title,
        content,
        published,
        courseId: courseId || null,
      })

      if (result.success) {
        setSuccessMsg(`تم إنشاء المقال الفني ونشره بنجاح! الرابط المختصر: /articles/${result.slug}`)
        setTitle("")
        setContent("")
        setPublished(false)
        setCourseId("")
        setActiveTab("edit")
      } else {
        setErrorMsg(result.error || "حدث خطأ أثناء محاولة حفظ المقال.")
      }
    } catch (err) {
      console.error(err)
      setErrorMsg("حدث خطأ في الاتصال بالخادم أثناء حفظ المقال.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/95 backdrop-blur-md p-6 lg:p-8 text-white relative" dir="rtl">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-0 w-36 h-36 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
        <Edit3 className="w-8 h-8 text-violet-400" />
        <div>
          <h2 className="text-2xl font-black">ناشر المقالات الفنية والدروس المصاحبة</h2>
          <p className="text-sm text-slate-400 mt-1">اكتب مقالات غنية وتنسيقات برمجية متطورة لطلابك لتوسيع معارفهم.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Alerts */}
        {errorMsg && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-300 text-sm flex items-start gap-2.5">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl">
          {/* Article Title */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-300">عنوان المقال الفني</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: دليلك الشامل لفهم التزامن والوعود في JavaScript"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-sm placeholder-slate-500 transition-all"
            />
          </div>

          {/* Connect to Course */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>ربطه بـ مقرر تعليمي (اختياري)</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-sm text-slate-200 transition-all"
            >
              <option value="">-- غير مرتبط بمقرر معين --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Article Status */}
          <div className="flex items-center justify-between bg-slate-800/40 border border-slate-700/50 px-4 py-3 rounded-xl">
            <span className="text-sm font-bold text-slate-300">نشر المقال للعامة فوراً؟</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>
        </div>

        {/* Editor Tabs & Workspace */}
        <div className="border border-slate-800 rounded-2xl bg-slate-950/20 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-2.5">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "edit"
                  ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>محرر المقال (Markdown)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "preview"
                  ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>المعاينة الفورية لمظهر المقال</span>
            </button>
          </div>

          {/* Work Area */}
          <div className="p-4 bg-slate-950/60">
            {activeTab === "edit" ? (
              <div className="space-y-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  placeholder={`اكتب المقال هنا باستخدام لغة التنسيق الماركدون (Markdown).
مثال:
# العناوين الرئيسية
يمكنك كتابة أكواد برمجية منسقة:
\`\`\`javascript
const test = "Hello World";
console.log(test);
\`\`\``}
                  className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl focus:ring-1 focus:ring-violet-500 outline-none text-sm placeholder-slate-600 transition-all font-mono leading-relaxed resize-y"
                />
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed p-4 min-h-[280px] bg-slate-900/50 rounded-xl border border-slate-800/80 overflow-y-auto whitespace-pre-wrap">
                {content.trim() ? (
                  content
                ) : (
                  <span className="text-slate-600 italic">لا يوجد محتوى للمعاينة حتى الآن. اكتب شيئاً في المحرر.</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-8 py-4 font-bold hover:scale-[1.01] hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/10"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>حفظ ونشر المقال الفني</span>
        </button>
      </form>
    </div>
  )
}
