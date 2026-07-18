"use client"

import React, { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Play, CheckCircle2, Lightbulb, Coins, RotateCcw, AlertTriangle } from "lucide-react"
import { verifyChallenge, purchaseHint, ValidationRule } from "@/actions/challenge"

// Dynamic import of Monaco Editor to avoid Next.js SSR hydration mismatches
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full flex items-center justify-center bg-slate-900 rounded-xl border border-slate-800 text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        <p className="text-sm">جاري تحميل محرر الأكواد...</p>
      </div>
    </div>
  ),
})

interface CodeChallengeProps {
  lessonId: string
  title: string
  instructions: string
  initialCode?: string
  validationRules: ValidationRule[]
  initialCoins: number
  hintText: string
}

export default function CodeChallenge({
  lessonId,
  title,
  instructions,
  initialCode = "<!-- اكتب كود HTML/CSS/JS هنا -->\n<h1>أهلاً بك</h1>",
  validationRules,
  initialCoins,
  hintText,
}: CodeChallengeProps) {
  const [code, setCode] = useState(initialCode)
  const [previewDoc, setPreviewDoc] = useState("")
  const [coins, setCoins] = useState(initialCoins)
  const [hint, setHint] = useState<string | null>(null)
  const [hintError, setHintError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [purchasingHint, setPurchasingHint] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    success?: boolean
    message?: string
  } | null>(null)

  // Run initial code on load
  useEffect(() => {
    setPreviewDoc(initialCode)
  }, [initialCode])

  const handleRun = () => {
    setPreviewDoc(code)
  }

  const handleReset = () => {
    if (confirm("هل أنت متأكد من رغبتك في إعادة تعيين الكود المكتوب؟")) {
      setCode(initialCode)
      setPreviewDoc(initialCode)
      setVerificationResult(null)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    setVerificationResult(null)
    try {
      const result = await verifyChallenge(lessonId, code, validationRules)
      setVerificationResult(result)
      if (result.success) {
        // Refresh coins balance (awards 50 coins)
        if (!result.message?.includes("بالفعل")) {
          setCoins((prev) => prev + 50)
        }
      }
    } catch (err) {
      console.error(err)
      setVerificationResult({
        success: false,
        message: "فشل الاتصال بالخادم للتحقق من الكود.",
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleGetHint = async () => {
    if (coins < 20) {
      setHintError("رصيدك الحالي غير كافٍ لشراء التلميح (تكلفة التلميح 20 عملة).")
      return
    }

    setPurchasingHint(true)
    setHintError(null)

    // Optimistic UI update for coins balance
    const originalCoins = coins
    setCoins((prev) => Math.max(0, prev - 20))

    try {
      const result = await purchaseHint(lessonId, hintText)
      if (result.success && result.hint) {
        setHint(result.hint)
      } else {
        // Rollback coins on failure
        setCoins(originalCoins)
        setHintError(result.error || "فشل الحصول على التلميح.")
      }
    } catch (err) {
      console.error(err)
      setCoins(originalCoins)
      setHintError("حدث خطأ في الاتصال أثناء شراء التلميح.")
    } finally {
      setPurchasingHint(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1 max-w-7xl mx-auto text-white" dir="rtl">
      {/* Left Column: Instructions, Editor & Console */}
      <div className="flex flex-col gap-4">
        {/* Header and Instructions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-l from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              {title}
            </h2>
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 px-4 py-2 rounded-xl">
              <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-sm font-bold text-amber-300">{coins} عملة Craft</span>
            </div>
          </div>

          <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line border-t border-slate-800/60 pt-4">
            {instructions}
          </div>
        </div>

        {/* Editor Area */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
          {/* Editor Header Toolbar */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-slate-500 font-mono mr-2">editor.html</span>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-md transition-all"
              title="إعادة تعيين المحرر"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تعيين</span>
            </button>
          </div>

          {/* Monaco Editor Container */}
          <div className="h-[400px]">
            <MonacoEditor
              height="100%"
              defaultLanguage="html"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                fontSize: 14,
                fontFamily: "var(--font-mono, monospace)",
                minimap: { enabled: false },
                scrollbar: {
                  vertical: "visible",
                  horizontal: "visible",
                },
                automaticLayout: true,
                tabSize: 2,
                cursorBlinking: "smooth",
                lineHeight: 22,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Action Footer */}
          <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 flex flex-wrap items-center gap-3">
            <button
              onClick={handleRun}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl border border-slate-700 transition-all"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>تشغيل العرض</span>
            </button>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="flex items-center gap-2 bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md shadow-violet-500/10"
            >
              {verifying ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>تحقق من الحل</span>
            </button>

            <button
              onClick={handleGetHint}
              disabled={purchasingHint || !!hint}
              className="mr-auto flex items-center gap-2 text-amber-300 hover:text-amber-200 disabled:opacity-50 text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2.5 rounded-xl border border-amber-500/20 transition-all"
            >
              <Lightbulb className="w-4 h-4" />
              <span>تلميح (20 عملة)</span>
            </button>
          </div>
        </div>

        {/* Verification Result Feedback */}
        {verificationResult && (
          <div
            className={`rounded-2xl border p-5 transition-all animate-fadeIn ${
              verificationResult.success
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                : "border-rose-500/20 bg-rose-500/5 text-rose-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  verificationResult.success ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {verificationResult.success ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">
                  {verificationResult.success ? "نجاح التحدي!" : "خطأ في التحقق:"}
                </h4>
                <p className="text-sm leading-relaxed">{verificationResult.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Hint Display Area */}
        {hint && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 animate-fadeIn">
            <div className="flex items-start gap-3 text-amber-300">
              <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
              <div>
                <h4 className="font-bold text-sm mb-1">تلميح لمساعدتك:</h4>
                <p className="text-sm leading-relaxed">{hint}</p>
              </div>
            </div>
          </div>
        )}

        {/* Hint Purchase Error */}
        {hintError && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 animate-fadeIn">
            <div className="flex items-start gap-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{hintError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Live Interactive Preview */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col h-[580px] lg:h-auto">
        <div className="bg-slate-900 px-4 py-3.5 border-b border-slate-800 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-700"></div>
          <span className="text-xs text-slate-400 font-mono">شاشة العرض الحي (Live Preview)</span>
        </div>
        <div className="flex-grow bg-white relative">
          {previewDoc ? (
            <iframe
              srcDoc={previewDoc}
              title="Code Preview"
              sandbox="allow-scripts"
              className="w-full h-full border-none"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-500">
              <p className="text-sm">اضغط على &quot;تشغيل العرض&quot; لتحديث المعاينة.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
