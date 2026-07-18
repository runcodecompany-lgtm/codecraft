// app/about/page.tsx
export const dynamic = "force-dynamic"

import React from "react"
import { Target, Award, Globe, Users, ChevronLeft, Shield, Sparkles, BookOpen } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "من نحن | Code Craft Core",
  description: "تعرف على قصة منصة Code Craft Core، ورؤيتنا في إعادة ابتكار تعليم البرمجة باللغة العربية.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24" dir="rtl">
      
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border-b border-slate-800 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 relative text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm font-bold text-indigo-300 mb-6">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>نصنع مبرمجي الغد بأسلوب تفاعلي متقدم</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">قصتنا ورؤيتنا</h1>
          <p className="text-slate-450 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            منصة Code Craft Core هي الأولى عربياً في تقديم المحتوى التعليمي والبرمجي المتكامل بأسلوب التلعيب والألعاب التنافسية لضمان متعة التعلم واستدامة الشغف.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Mission */}
            <div className="p-8 bg-slate-900/40 rounded-3xl border border-slate-850 flex flex-col gap-5 hover:border-indigo-500/20 transition-all">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">رسالتنا</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                توفير تعليم برمجيات عالي الكفاءة يدمج الجانب المنهجي بالتطبيقات العملية المباشرة، مما يمهد الطريق لكل طالب ومطور لبناء مستقبله المهني بأسلوب مبتكر.
              </p>
            </div>

            {/* Values */}
            <div className="p-8 bg-slate-900/40 rounded-3xl border border-slate-850 flex flex-col gap-5 hover:border-indigo-500/20 transition-all">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-450 rounded-2xl flex items-center justify-center">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">قيمنا</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                النزاهة التعليمية، التنافس البنّاء، وإتاحة الفرصة للجميع. نؤمن بأن البرمجة مهارة مكتسبة وليست موهبة حكرية، ونصمم أدواتنا لتناسب مستويات التفكير المتفاوتة.
              </p>
            </div>

            {/* Vision */}
            <div className="p-8 bg-slate-900/40 rounded-3xl border border-slate-850 flex flex-col gap-5 hover:border-indigo-500/20 transition-all">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">رؤيتنا</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                بناء أكبر مجتمع عربي للمبرمجين المبدعين، وريادة قطاع التعليم البرمجي الذكي المدعوم بالذكاء الاصطناعي وتقنيات التلعيب لتخريج كفاءات جاهزة لسوق العمل الحقيقي.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Story Details */}
      <section className="py-16 bg-slate-900/20 border-y border-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 order-2 md:order-1 space-y-6">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <span className="w-2 h-8 bg-indigo-500 rounded-full block"></span>
                قصة المشروع
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                انطلقت منصة Code Craft Core من فكرة بسيطة: لماذا يشعر أغلب الطلاب بالملل أثناء تعلم البرمجة رغم متعة كتابة الكود؟ وجدنا أن التعليم التقليدي يركز على التلقين بينما ترتكز البرمجة على البناء وحل الألغاز.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                قمنا بإعادة صياغة التجربة بأكملها. دمجنا المحاضرات بنظام مستويات كالألعاب، حيث يربح الطالب عملات كرافت كوينز (Craft Coins) عند كل كود يكتبه، وينافس في لوحات شرف حية. اليوم، نحن نخدم آلاف الطلاب العرب في مسارات تطوير الويب وهندسة البرمجيات.
              </p>
              
              <div className="flex items-center gap-6 pt-4">
                <div>
                  <div className="text-2xl font-black text-indigo-400">+٥,٠٠٠</div>
                  <div className="text-slate-550 text-xs font-bold">طالب مسجل</div>
                </div>
                <div className="w-px h-10 bg-slate-800" />
                <div>
                  <div className="text-2xl font-black text-indigo-400">+٥٠</div>
                  <div className="text-slate-550 text-xs font-bold">مقرر ومسار برمجي</div>
                </div>
                <div className="w-px h-10 bg-slate-800" />
                <div>
                  <div className="text-2xl font-black text-indigo-400">٩٨٪</div>
                  <div className="text-slate-550 text-xs font-bold">نسبة رضا الطلاب</div>
                </div>
              </div>
            </div>

            <div className="flex-1 order-1 md:order-2">
              <div className="relative aspect-square w-full bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center shadow-2xl">
                <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-2xl animate-pulse" />
                <Users className="w-24 h-24 text-indigo-500/25" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-black text-white mb-6">كن جزءاً من مبرمجي المستقبل اليوم</h2>
          <p className="text-slate-450 text-base mb-8">
            انضم مجاناً وابدأ مسارك البرمجي الأول وحوّل فكرتك التالية إلى واقع ملموس.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register" 
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              ابدأ الآن مجاناً <ChevronLeft className="w-5 h-5 rotate-180" />
            </Link>
            <Link 
              href="/courses" 
              className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-8 py-4 rounded-2xl font-bold transition-all"
            >
              <BookOpen className="w-4 h-4" />
              تصفح المسارات
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
