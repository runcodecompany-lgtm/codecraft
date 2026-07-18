"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { verifyEmailAction } from "@/actions/auth"
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react"

export default function VerifyEmailPage() {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const initialToken = new URLSearchParams(window.location.search).get("token")
    if (initialToken) setToken(initialToken)
  }, [])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const value = formData.get("token")?.toString().trim() || token.trim()
    const result = await verifyEmailAction({ token: value })
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(result.message || "تم تأكيد البريد الإلكتروني بنجاح.")
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white" dir="rtl">
      <div className="mx-auto max-w-lg rounded-lg border border-white/10 bg-white/5 p-8">
        <div className="mb-6 flex items-center gap-3">
          <Mail className="h-5 w-5 text-indigo-300" />
          <h1 className="text-2xl font-black">تأكيد البريد الإلكتروني</h1>
        </div>

        <p className="mb-6 text-sm leading-7 text-slate-300">
          أدخل رمز التأكيد المرسل إلى بريدك الإلكتروني لإكمال تنشيط الحساب.
        </p>

        {error && (
          <div className="mb-4 flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {success}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-200">رمز التأكيد</span>
            <input
              name="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="h-11 w-full rounded-lg border border-white/10 bg-slate-900 px-3 text-sm outline-none focus:border-indigo-400"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            تأكيد البريد
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          <Link className="font-bold text-indigo-300 hover:underline" href="/login">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </main>
  )
}
