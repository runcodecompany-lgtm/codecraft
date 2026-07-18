"use client"

import { useState } from "react"
import Link from "next/link"
import { registerTeacherUser } from "@/lib/auth"
import { AlertCircle, CheckCircle2, Loader2, FileText } from "lucide-react"
import { uploadCV } from "@/lib/upload"

export default function TeacherRegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [cvUrl, setCvUrl] = useState("")
  const [cvMode, setCvMode] = useState<"file" | "url">("file")
  const [uploadingCv, setUploadingCv] = useState(false)
  const [cvFileName, setCvFileName] = useState("")


  async function handleSubmit(formData: FormData) {
    if (!cvUrl) {
      setError("يرجى رفع ملف السيرة الذاتية أو إدخال الرابط أولاً.")
      return
    }
    setLoading(true)
    setError(null)

    formData.set("cvUrl", cvUrl)

    const result = await registerTeacherUser(formData)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-white" dir="rtl">
        <div className="mx-auto max-w-lg rounded-lg border border-white/10 bg-white/5 p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
          <h1 className="text-2xl font-black">تم إرسال طلب المعلم</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            تم إنشاء حسابك بحالة قيد المراجعة. تحقق من بريدك الإلكتروني، وستظهر صلاحيات التدريس بعد اعتماد الإدارة فقط.
          </p>
          <Link href="/login" className="mt-6 block rounded-lg bg-white px-4 py-3 text-sm font-bold text-slate-950">
            تسجيل الدخول
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white" dir="rtl">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link href="/register" className="text-sm font-bold text-indigo-300 hover:underline">
            تسجيل طالب
          </Link>
          <h1 className="mt-3 text-3xl font-black">تسجيل معلم</h1>
          <p className="mt-2 text-sm text-slate-400">طلبات المعلمين تمر بمراجعة الإدارة قبل تفعيل صلاحيات إنشاء ونشر المحتوى.</p>
        </div>

        {error && (
          <div className="mb-5 flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <form action={handleSubmit} className="grid gap-4 rounded-lg border border-white/10 bg-white/5 p-6 md:grid-cols-2">
          <Field name="name" label="الاسم الكامل" required />
          <Field name="email" label="البريد الإلكتروني" type="email" required />
          <Field name="password" label="كلمة المرور" type="password" required />
          <Field name="country" label="الدولة" required />
          <Field name="specialization" label="التخصص" required />
          <Field name="yearsOfExperience" label="سنوات الخبرة" type="number" required />
          <Field name="linkedin" label="LinkedIn" />
          <Field name="portfolioWebsite" label="الموقع أو معرض الأعمال" />
          {/* CV upload / link - required */}
          <div className="md:col-span-2 space-y-2 text-right">
            <div className="flex justify-between items-center">
              <span className="block text-sm font-bold text-slate-200">السيرة الذاتية (CV) <span className="text-red-500">*</span></span>
              <div className="flex bg-slate-900 rounded-lg p-0.5 text-[10px] font-bold border border-white/10">
                <button
                  type="button"
                  onClick={() => setCvMode("file")}
                  className={`px-3 py-1 rounded-md transition-all ${cvMode === "file" ? "bg-indigo-500 text-white" : "text-slate-400"}`}
                >
                  رفع ملف
                </button>
                <button
                  type="button"
                  onClick={() => setCvMode("url")}
                  className={`px-3 py-1 rounded-md transition-all ${cvMode === "url" ? "bg-indigo-500 text-white" : "text-slate-400"}`}
                >
                  رابط خارجي
                </button>
              </div>
            </div>

            <input type="hidden" name="cvUrl" value={cvUrl} />

            {cvMode === "file" ? (
              <div className={`rounded-lg border-2 border-dashed p-4 text-center transition-all ${
                uploadingCv 
                  ? "border-indigo-500/50 bg-indigo-500/5" 
                  : cvUrl 
                  ? "border-emerald-500/50 bg-emerald-500/5" 
                  : "border-white/10 bg-slate-900 hover:border-white/20"
              }`}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  disabled={uploadingCv}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploadingCv(true)
                    setCvFileName(file.name)
                    setError(null)
                    const url = await uploadCV(file)
                    if (url) {
                      setCvUrl(url)
                    } else {
                      setError("فشل رفع الملف، يرجى المحاولة مرة أخرى.")
                    }
                    setUploadingCv(false)
                  }}
                  className="hidden"
                  id="cv-file-upload-teacher"
                />
                <label htmlFor="cv-file-upload-teacher" className="cursor-pointer block space-y-2">
                  {uploadingCv ? (
                    <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                      <span className="text-xs text-slate-400">جاري الرفع سحابياً ({cvFileName})...</span>
                    </div>
                  ) : cvUrl ? (
                    <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">تم رفع الملف بنجاح!</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-xs">{cvFileName || "ملف السيرة الذاتية"}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <span className="text-xs text-slate-400">انقر هنا لاختيار ملف السيرة الذاتية (PDF, Doc, صور)</span>
                      <span className="text-[10px] text-slate-505">الحد الأقصى للحجم 10 ميجا</span>
                    </div>
                  )}
                </label>
              </div>
            ) : (
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                <input
                  type="url"
                  dir="ltr"
                  required
                  value={cvUrl}
                  onChange={e => setCvUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/..."
                  className="h-11 w-full rounded-lg border border-white/10 bg-slate-900 pl-10 pr-3 text-sm outline-none focus:border-indigo-400 text-left text-[11px]"
                />
              </div>
            )}
          </div>
          <TextArea name="skills" label="المهارات" required />
          <TextArea name="bio" label="السيرة المهنية" required />

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              إرسال طلب المعلم
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

function Field({
  label,
  name,
  type = "text",
  required,
  className = "",
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-bold text-slate-200">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="h-11 w-full rounded-lg border border-white/10 bg-slate-900 px-3 text-sm outline-none focus:border-indigo-400"
      />
    </label>
  )
}

function TextArea({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-1.5 block text-sm font-bold text-slate-200">{label}</span>
      <textarea
        name={name}
        rows={4}
        required={required}
        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-sm outline-none focus:border-indigo-400"
      />
    </label>
  )
}
