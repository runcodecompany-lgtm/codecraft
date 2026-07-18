// app/terms/page.tsx
import React from "react"
import Link from "next/link"
import { ShieldCheck, FileText, ArrowLeft, Info, HelpCircle } from "lucide-react"

export const metadata = {
  title: "الشروط والأحكام | Code Craft Core",
  description: "الشروط والأحكام وقواعد استخدام منصة Code Craft Core التعليمية.",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white pb-24" dir="rtl">
      {/* Header Banner */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            الرئيسية
          </Link>
          <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">الشروط والأحكام</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            مرحباً بك في منصة Code Craft Core. يرجى قراءة الشروط والأحكام بدقة قبل البدء في استخدام خدماتنا.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 md:p-12 space-y-10 leading-relaxed text-slate-350">
          
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              1. قبول الشروط
            </h2>
            <p>
              باستخدامك لمنصة Code Craft Core، فإنك توافق التزاماً تاماً بكافة الشروط وقواعد الاستخدام المدرجة هنا. إذا كنت لا توافق على أي جزء منها، يرجى التوقف عن استخدام المنصة فوراً.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              2. شروط الحساب والتسجيل
            </h2>
            <p>
              يجب على المستخدم تقديم معلومات دقيقة وصحيحة بالكامل أثناء عملية التسجيل، ويتحمل مسؤولية الحفاظ على سرية كلمة المرور وبيانات حسابه. المنصة تحتفظ بالحق الكامل في تعطيل أو تجميد أي حساب يخالف شروط الأمان أو يستخدم بيانات وهمية.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              3. قواعد التلعيب والنزاهة التعليمية (Gamification Fair-Play)
            </h2>
            <p>
              نظام التلعيب (Gamification) على منصة Code Craft Core — والذي يشمل نقاط الخبرة (XP) وعملات الكرافت كوينز (Craft Coins) واللوحات العامة للشرف والترتيب اليومي — مصمم لدعم التعلم التفاعلي. بناءً عليه يمنع منعاً باتاً:
            </p>
            <ul className="list-disc pr-6 space-y-2">
              <li>استخدام برمجيات آلية (Bots) أو نصوص ذكاء اصطناعي بهدف حل التحديات البرمجية بشكل تلقائي لتجميع النقاط.</li>
              <li>محاولة استغلال أي ثغرات برمجية في نظام الاختبارات أو الألعاب التعليمية لتخطي الدروس بشكل غير عادل.</li>
              <li>شراء أو بيع عملات Craft Coins أو استخدام الحسابات لأغراض تجارية خارج نطاق المنصة.</li>
            </ul>
            <p className="text-red-400 font-semibold text-sm">
              ملاحظة: أي محاولة للتلاعب بنزاهة التحديات ستؤدي فوراً إلى تصفير رصيد عملات الحِرف وتجميد الحساب بشكل نهائي.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              4. الملكية الفكرية للمحتوى
            </h2>
            <p>
              جميع المواد التعليمية، المقالات، الدروس، الشيفرات البرمجية، والمناهج المتوفرة على المنصة هي ملك حصري لمنصة Code Craft Core وكتّابها ومعلميها. يمنع نسخها أو إعادة نشرها أو توزيعها تجارياً دون إذن خطي مسبق.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              5. الشهادات والاعتمادات
            </h2>
            <p>
              الشهادات الصادرة من المنصة تمنح فقط عند إتمام كافة دروس ووحدات المسار البرمجي واجتياز الاختبارات المعتمدة بنسب النجاح المحددة. الشهادة توثق الأداء الفردي وتعد دليلاً على الجد والمثابرة الفنية.
            </p>
          </section>

          <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            تاريخ آخر تحديث: 13 يونيو 2026
          </div>
        </div>
      </div>
    </main>
  )
}
