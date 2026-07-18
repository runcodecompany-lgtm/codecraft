// app/register/design-system/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Code2, Palette, Type, LayoutGrid, CheckCircle2,
  AlertCircle, Star, Moon, Sun, ArrowRight
} from 'lucide-react'

export default function DesignSystemPage() {
  const [dark, setDark] = useState(false)

  const colors = [
    { name: 'Primary (Royal Blue)', hex: '#2446B0', desc: 'الأزرار الأساسية، العناوين الهامة، العناصر البارزة في النمط الحيوي', usage: 'bg-[#2446B0] text-white' },
    { name: 'Primary Night (Light Blue)', hex: '#3B63D6', desc: 'بديل اللون الأساسي في الوضع الليلي لضمان التباين ووضوح الرؤية', usage: 'bg-[#3B63D6] text-white' },
    { name: 'Secondary (Emerald Green)', hex: '#0FA986', desc: 'عناصر النجاح، علامات الاختيار، الأزرار الثانوية المميزة', usage: 'bg-[#0FA986] text-white' },
    { name: 'Accent (Amber)', hex: '#FF9F1C', desc: 'الإجراءات الصغيرة (Micro-CTAs)، التنبيهات الداعمة، وحالة التركيز', usage: 'bg-[#FF9F1C] text-black' },
    { name: 'Neutral Text (نهار)', hex: '#0F1724', desc: 'النصوص الرئيسية والعناوين الكبيرة في الوضع النهاري', usage: 'bg-[#0F1724] text-white' },
    { name: 'Neutral Text (ليلي)', hex: '#E6EEF6', desc: 'النصوص الرئيسية والعناوين الكبيرة في الوضع الليلي', usage: 'bg-[#E6EEF6] text-black' },
  ]

  const corporateColors = [
    { name: 'Corporate Primary (Slate Blue)', hex: '#2B4C7E', desc: 'اللون الأساسي للنمط المؤسسي/المحترف أقل حدة وتشبعاً', usage: 'bg-[#2B4C7E] text-white' },
    { name: 'Corporate Secondary (Sage Green)', hex: '#4A7C59', desc: 'عناصر التأكيد والنجاح الهادئة للشركات والمؤسسات', usage: 'bg-[#4A7C59] text-white' },
    { name: 'Corporate BG Day', hex: '#F5F7FA', desc: 'الخلفية الهادئة والمريحة للصفحات في النمط المؤسسي', usage: 'bg-[#F5F7FA] text-slate-800' },
    { name: 'Corporate Card Night', hex: '#141C2F', desc: 'خلفية البطاقات في الوضع الداكن المؤسسي', usage: 'bg-[#141C2F] text-slate-200' },
  ]

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${dark ? 'bg-[#0B1220] text-[#E6EEF6]' : 'bg-[#F6F8FB] text-[#0F1724]'}`} dir="rtl">
      
      {/* Design System Header */}
      <header className={`max-w-6xl mx-auto flex items-center justify-between p-6 rounded-2xl mb-8 border transition-all ${dark ? 'bg-[#0F1724] border-slate-800 shadow-xl' : 'bg-white border-[#E6EDF4] shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2446B0] flex items-center justify-center">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black">Code Craft Core</h1>
            <p className="text-xs opacity-60">نظام التصميم المصغر · شاشة التسجيل</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setDark(!dark)}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-current opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Toggle Theme Preview"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            href="/register"
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl text-white bg-[#2446B0] hover:bg-[#1d3a9a] transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" /> العودة للتسجيل
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-12">

        {/* Section 1: Colors & Gradients */}
        <section className={`p-8 rounded-2xl border ${dark ? 'bg-[#0F1724] border-slate-800' : 'bg-white border-[#E6EDF4]'}`}>
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-[#2446B0]" />
            <h2 className="text-xl font-bold">لوحة الألوان والرموز (Color Tokens)</h2>
          </div>
          
          <h3 className="text-sm font-bold mb-4 opacity-75">النمط أ: أسلوب حيوي ومشرق (Vibrant Style)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {colors.map((c, i) => (
              <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between h-40 ${dark ? 'border-slate-800 bg-[#0B1220]/50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold">{c.name}</p>
                    <p className="text-[10px] font-mono opacity-65">{c.hex}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-lg shadow-sm border border-black/10 ${c.usage}`} style={{ backgroundColor: c.hex }} />
                </div>
                <p className="text-xs opacity-75 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-bold mb-4 opacity-75">النمط ب: أسلوب مؤسسي ومحترف (Corporate Style)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {corporateColors.map((c, i) => (
              <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between h-40 ${dark ? 'border-slate-800 bg-[#0B1220]/50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold">{c.name}</p>
                    <p className="text-[10px] font-mono opacity-65">{c.hex}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg shadow-sm border border-black/10" style={{ backgroundColor: c.hex }} />
                </div>
                <p className="text-xs opacity-75 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Typography */}
        <section className={`p-8 rounded-2xl border ${dark ? 'bg-[#0F1724] border-slate-800' : 'bg-white border-[#E6EDF4]'}`}>
          <div className="flex items-center gap-3 mb-6">
            <Type className="w-6 h-6 text-[#0FA986]" />
            <h2 className="text-xl font-bold">الطباعة وحجم النصوص (Typography scale)</h2>
          </div>
          
          <div className="space-y-6">
            <div className="border-b border-dashed border-slate-200/50 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono opacity-60">H1 (Desktop) — 28–32px · Weight: 900</span>
                <span className="text-xs font-bold text-[#2446B0]">Cairo / Alexandria</span>
              </div>
              <p className="text-3xl font-black">إنشاء حساب جديد</p>
            </div>

            <div className="border-b border-dashed border-slate-200/50 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono opacity-60">H2 (Subtitle) — 22–24px · Weight: 700</span>
                <span className="text-xs font-bold text-[#2446B0]">Cairo / Alexandria</span>
              </div>
              <p className="text-2xl font-bold">أدخل بياناتك الأساسية</p>
            </div>

            <div className="border-b border-dashed border-slate-200/50 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono opacity-60">Body Text — 16px · Weight: 500 · LineHeight: 1.4</span>
                <span className="text-xs font-bold text-[#0FA986]">Alexandria / Noto Sans Arabic</span>
              </div>
              <p className="text-base font-medium leading-relaxed">
                انضم إلى Code Craft Core واختر مسارك التعليمي المخصص لبناء مهاراتك البرمجية والعملية.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono opacity-60">Small/Label Text — 14px · Weight: 400</span>
                <span className="text-xs font-bold text-[#FF9F1C]">Alexandria</span>
              </div>
              <p className="text-sm">هذا النص مستخدم للتعليمات المساعدة والتنبيهات الفرعية أسفل الحقول.</p>
            </div>
          </div>
        </section>

        {/* Section 3: Buttons & Inputs */}
        <section className={`p-8 rounded-2xl border ${dark ? 'bg-[#0F1724] border-slate-800' : 'bg-white border-[#E6EDF4]'}`}>
          <div className="flex items-center gap-3 mb-6">
            <LayoutGrid className="w-6 h-6 text-[#FF9F1C]" />
            <h2 className="text-xl font-bold">عناصر الواجهة التفاعلية (Buttons & Inputs)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Column A: Buttons */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold opacity-60 border-b pb-2 border-slate-200/50">أنماط الأزرار (Button Styles)</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs mb-2 opacity-75">الزر الرئيسي الممتلئ (Primary CTA):</p>
                  <button className="w-full h-11 bg-[#2446B0] hover:bg-[#1d3a9a] text-white rounded-xl font-bold text-sm shadow-[0_4px_16px_rgba(36,70,176,0.28)] transition-all hover:scale-[1.02]">
                    متابعة
                  </button>
                </div>

                <div>
                  <p className="text-xs mb-2 opacity-75">الزر الفرعي المحدد (Secondary Outline):</p>
                  <button className="w-full h-11 border-2 border-[#0FA986] text-[#0FA986] bg-transparent hover:bg-[#0FA986]/10 rounded-xl font-bold text-sm transition-all hover:translate-y-[-1px]">
                    السابق
                  </button>
                </div>

                <div>
                  <p className="text-xs mb-2 opacity-75">الزر البسيط بدون حواف (Micro-CTA):</p>
                  <button className="text-[#FF9F1C] hover:text-[#e8850a] font-bold text-xs bg-transparent border-none cursor-pointer">
                    هل تحتاج إلى مساعدة؟
                  </button>
                </div>
              </div>
            </div>

            {/* Column B: Inputs */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold opacity-60 border-b pb-2 border-slate-200/50">حالات الحقول (Field States)</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5">الحقل الافتراضي (مع أيقونة على اليسار RTL):</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                    <input
                      type="text"
                      readOnly
                      value="example@email.com"
                      className={`w-full h-11 px-4 pl-10 text-sm rounded-xl border outline-none ${dark ? 'bg-[#0d1929] border-slate-700 text-[#E6EEF6]' : 'bg-[#F6F8FB] border-[#E6EDF4] text-[#0F1724]'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">الحالة النشطة (Focus State):</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2446B0]">★</span>
                    <input
                      type="text"
                      readOnly
                      value="نص التركيز..."
                      className={`w-full h-11 px-4 pl-10 text-sm rounded-xl border outline-none border-[#2446B0] shadow-[0_0_0_3px_rgba(36,70,176,0.15)] ${dark ? 'bg-[#0d1929] text-[#E6EEF6]' : 'bg-[#F6F8FB] text-[#0F1724]'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-[#0FA986] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> حالة النجاح (Success State):
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="الاسم متاح"
                    className={`w-full h-11 px-4 text-sm rounded-xl border outline-none border-[#0FA986] ${dark ? 'bg-[#0d1929] text-[#E6EEF6]' : 'bg-[#F6F8FB] text-[#0F1724]'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-red-500 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> حالة الخطأ (Error State):
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="يرجى إدخال بريد إلكتروني صحيح"
                    className={`w-full h-11 px-4 text-sm rounded-xl border outline-none border-red-500 ${dark ? 'bg-[#0d1929] text-red-400' : 'bg-[#F6F8FB] text-red-500'}`}
                  />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 4: Spacing & UI Specs */}
        <section className={`p-8 rounded-2xl border ${dark ? 'bg-[#0F1724] border-slate-800' : 'bg-white border-[#E6EDF4]'}`}>
          <h2 className="text-xl font-bold mb-6">مواصفات التباعد والتصميم المتجاوب (Layout & Accessibility)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#2446B0]">محيط البطاقة (Card Padding)</p>
              <p className="text-xs opacity-75 leading-relaxed">
                يتم تطبيق حشوة (Padding) تتراوح بين **28–32px** داخل البطاقات المركزية لضمان توازن بصري ممتاز ومساحة كافية للعناصر.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#0FA986]">التباعد بين الحقول (Field Spacing)</p>
              <p className="text-xs opacity-75 leading-relaxed">
                استخدام تباعد عمودي ثابت **16–20px** بين كل حقل إدخال لراحة العين وسهولة القراءة على الهواتف والأجهزة اللوحية.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#FF9F1C]">الاستجابة وسهولة الوصول (Accessibility)</p>
              <p className="text-xs opacity-75 leading-relaxed">
                جميع أزرار اللمس مصممة بارتفاع لا يقل عن **44px** لتتوافق مع معايير WCAG AA، مع توافق كامل ومرونة مع النصوص الطويلة بالإنجليزية.
              </p>
            </div>
          </div>
        </section>

      </main>

      <footer className="max-w-6xl mx-auto text-center mt-12 mb-6 text-xs opacity-50">
        Code Craft Core © {new Date().getFullYear()} · نظام التصميم المصغر
      </footer>
    </div>
  )
}
