// app/not-found.tsx
import Link from "next/link"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
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
                        background: 'radial-gradient(circle, #6366f1, transparent)',
                        top: '-100px',
                        left: '-100px',
                    }}
                />
                <div
                    className="absolute rounded-full opacity-10 blur-3xl"
                    style={{
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle, #8b5cf6, transparent)',
                        bottom: '-80px',
                        right: '-80px',
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
                {/* 404 Illustration */}
                <div className="flex justify-center mb-6">
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl"
                        style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)',
                        }}
                    >
                        <FileQuestion className="w-10 h-10 text-indigo-400" />
                    </div>
                </div>

                <h1 className="text-6xl font-black text-white mb-2">404</h1>
                <h2 className="text-2xl font-bold text-white mb-3">الصفحة غير موجودة</h2>
                <p className="text-slate-300 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                    عذراً، الصفحة التي تبحث عنها غير موجودة أو قد تم نقلها أو حذفها.
                    تأكد من الرابط أو عد إلى الصفحة الرئيسية.
                </p>

                {/* Control actions */}
                <div className="grid grid-cols-2 gap-4">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                        }}
                    >
                        <Home className="w-4 h-4" />
                        الصفحة الرئيسية
                    </Link>

                    <Link
                        href="/courses"
                        className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-bold text-slate-300 transition-colors hover:text-white"
                        style={{
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        تصفح الدورات
                    </Link>
                </div>
            </div>
        </div>
    )
}