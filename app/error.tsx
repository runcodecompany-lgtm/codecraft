// app/error.tsx
'use client'

import { useEffect } from 'react'
import { Code2, AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Safely log the error to console or error-reporting service
    console.error("Application error boundary caught:", error)
  }, [error])

  // Sanitize message: hide internal server paths, DB query details, environment variables, etc.
  const isDev = process.env.NODE_ENV === "development"
  const sanitizedMessage = isDev 
    ? error.message 
    : "حدث خطأ غير متوقع في الخادم أثناء معالجة طلبك. لقد تم تسجيل هذا الخطأ لدى فريق الدعم الفني."

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      }}
    >
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, #ef4444, transparent)',
            top: '-100px',
            right: '-100px',
          }}
        />
        <div
          className="absolute rounded-full opacity-10 blur-3xl"
          style={{
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, #f59e0b, transparent)',
            bottom: '-80px',
            left: '-80px',
          }}
        />
      </div>

      {/* Glassmorphic Error Container */}
      <div
        className="relative z-10 w-full max-w-lg mx-4 text-center"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '48px 40px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Warning Icon with glow */}
        <div className="flex justify-center mb-6">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
            }}
          >
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-white mb-2">عذراً، حدث خلل غير متوقع!</h1>
        <p className="text-slate-300 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
          نواجه صعوبة مؤقتة في معالجة طلبك أو الاتصال بالخادم. يرجى المحاولة مرة أخرى أو العودة للرئيسية.
        </p>

        {/* Sanitized system error info */}
        <div
          className="p-4 rounded-xl text-right mb-8 text-xs font-mono text-slate-400 break-words"
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="font-bold text-red-400 mb-1">رمز الخطأ التقني:</div>
          <div className="opacity-90">{sanitizedMessage}</div>
          {error.digest && (
            <div className="mt-2 pt-2 border-t border-white/5 opacity-85">
              <span className="font-bold text-indigo-400">ID:</span> {error.digest}
            </div>
          )}
        </div>

        {/* Control actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <RefreshCcw className="w-4 h-4" />
            تحديث الصفحة
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-bold text-slate-300 transition-colors hover:text-white"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              textDecoration: 'none',
            }}
          >
            <Home className="w-4 h-4" />
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}
