"use client"

import React from "react"
import Link from "next/link"
import {
  Sparkles,
  GraduationCap,
  ArrowLeft,
  BookOpen,
  Search,
  CheckCircle,
  Briefcase,
} from "lucide-react"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-[#F5F7FA] dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100" dir="rtl">
      {/* Decorative Blur Orbs */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-1/4 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none z-0 opacity-20 dark:opacity-10"
        style={{ background: "radial-gradient(circle, #2B4C7E 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-10 left-1/4 w-[500px] h-[300px] rounded-full blur-[100px] pointer-events-none z-0 opacity-15 dark:opacity-5"
        style={{ background: "radial-gradient(circle, #4A7C59 0%, transparent 75%)" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Right Column: Billboard Card (55% width on desktop) */}
          <div className="lg:col-span-7 space-y-8 text-right">
            
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2B4C7E]/20 bg-[#2B4C7E]/6 dark:bg-[#2B4C7E]/12 px-4 py-2 text-xs font-bold text-[#2B4C7E] dark:text-[#7FA8D4] shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>منصة كود كرافت كرو التعليمية العالمية</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15]">
                تعلم بلا حدود.
                <span className="block mt-2 bg-gradient-to-l from-[#2B4C7E] via-[#3d68a6] to-[#4A7C59] bg-clip-text text-transparent">
                  مهارات تصنع مستقبلك.
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl font-medium">
                انضم لأكثر من ١٫٢ مليون متعلم واكتسب المهارات التقنية الأكثر طلباً في سوق العمل. اختر من بين مئات الدورات الاحترافية بأسعار مناسبة.
              </p>
            </div>

            {/* Udemy-Style Floating Search Bar */}
            <div className="bg-white dark:bg-[#141C2F] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl">
              <form action="/courses/marketplace" method="GET" className="relative flex items-center">
                <div className="absolute right-4 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="query"
                  placeholder="ماذا تريد أن تتعلم اليوم؟ ابحث عن لغات البرمجة، الذكاء الاصطناعي..."
                  className="w-full pl-24 pr-11 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-850 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2B4C7E] focus:ring-2 focus:ring-[#2B4C7E]/15 transition-all text-right"
                  dir="rtl"
                />
                <button
                  type="submit"
                  className="absolute left-1.5 top-1.5 bottom-1.5 px-6 rounded-lg bg-[#2B4C7E] text-white hover:bg-[#1c3459] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>ابحث</span>
                </button>
              </form>
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-slate-400 dark:text-slate-500">
                <span>مسارات شائعة:</span>
                <Link href="/courses/marketplace?query=python" className="hover:text-[#2B4C7E] underline">بايثون</Link>
                <span>·</span>
                <Link href="/courses/marketplace?query=react" className="hover:text-[#2B4C7E] underline">تطوير الويب</Link>
                <span>·</span>
                <Link href="/courses/marketplace?query=security" className="hover:text-[#2B4C7E] underline">الأمن السيبراني</Link>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#2B4C7E] text-white font-extrabold text-sm shadow-md hover:bg-[#1c3459] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <GraduationCap className="w-4 h-4" />
                <span>ابدأ التعلم مجاناً</span>
              </Link>
              <Link
                href="/courses/marketplace"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/85 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850 font-bold text-sm transition-all duration-200"
              >
                <span>استكشف الدورات</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>

          </div>

          {/* Left Column: Graphic Feature & Badges (45% width on desktop) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl bg-gradient-to-tr from-[#2B4C7E]/10 to-[#4A7C59]/10 border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-inner overflow-hidden flex flex-col justify-between">
              
              {/* Decorative grid pattern inside */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(148,163,184,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.15) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Floating badges */}
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3 bg-white/90 dark:bg-[#141C2F]/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-850/50 shadow-md w-fit">
                  <div className="h-9 w-9 rounded-xl bg-[#4A7C59]/10 flex items-center justify-center text-[#4A7C59]">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">دروس تفاعلية بالكامل</p>
                    <p className="text-[10px] text-slate-500">تطبيق عملي وتحديات حية</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/90 dark:bg-[#141C2F]/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-850/50 shadow-md w-fit mr-auto">
                  <div className="h-9 w-9 rounded-xl bg-[#2B4C7E]/10 flex items-center justify-center text-[#2B4C7E]">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">مسارات مهنية جاهزة</p>
                    <p className="text-[10px] text-slate-500">أعدّ نفسك لوظيفتك القادمة</p>
                  </div>
                </div>
              </div>

              {/* Central Premium Graduation Illustration Overlay */}
              <div className="flex flex-col items-center justify-center py-6 text-center z-10">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-[#2B4C7E] to-[#1c3459] flex items-center justify-center text-white shadow-xl shadow-[#2B4C7E]/25">
                  <GraduationCap className="w-12 h-12" />
                </div>
                <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-4 leading-none">Code Craft Core</h4>
                <p className="text-[11px] text-[#4A7C59] font-bold mt-1.5">شعارنا: تعلّم وتنافس وابتكر</p>
              </div>

              {/* Bottom statistics overlay */}
              <div className="relative z-10 grid grid-cols-3 bg-white/70 dark:bg-[#141C2F]/70 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 divide-x divide-x-reverse divide-slate-200/50 dark:divide-slate-800/50 py-3 text-center">
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">+1.2M</p>
                  <p className="text-[9px] text-slate-400">طالب نشط</p>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">+800</p>
                  <p className="text-[9px] text-slate-400">دورة ومسار</p>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">4.9</p>
                  <p className="text-[9px] text-slate-400">تقييم المنصة</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
