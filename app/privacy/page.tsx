// app/privacy/page.tsx
export const dynamic = "force-dynamic"

import React from "react"
import { ShieldCheck, Lock, Eye, FileText, ChevronRight, Sparkles } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "سياسة الخصوصية | Code Craft Core",
  description: "تعرف على كيفية حماية بياناتك ومعلوماتك الشخصية وتفاصيل رصيدك وتقدمك في منصة Code Craft Core.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24" dir="rtl">
      
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border-b border-slate-800 py-16 text-center">
        <div className="container mx-auto px-4">
          <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">سياسة الخصوصية وأمن البيانات</h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base">
            تلتزم منصة Code Craft Core بحماية خصوصية بياناتك وتوفير بيئة تعليمية آمنة وموثوقة بالكامل.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-slate-900/40 rounded-3xl border border-slate-850 p-8 md:p-12 space-y-12 leading-relaxed text-slate-350">
          
          <div className="space-y-12">
            
            {/* Collection */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-550/10 text-indigo-450 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">1. ما هي البيانات التي نجمعها؟</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                لحسابك وتقدمك التعليمي، نقوم بجمع المعلومات التالية:
              </p>
              <ul className="list-disc pr-6 space-y-2 text-slate-400 text-sm">
                <li>معلومات الحساب: الاسم الكامل، البريد الإلكتروني، وتاريخ إنشاء الحساب.</li>
                <li>بيانات التقدّم المنهجي: الدروس المكتملة، نقاط الإنجازات (XP)، ونتائج الكويزات القصيرة والاختبارات التكيفية.</li>
                <li>المعاملات المالية: رصيد عملات Craft Coins وسجلات الحصول عليها وصرفها (مثل شراء التلميحات أو فتح المسارات).</li>
                <li>المعلومات التقنية: مثل عنوان الـ IP ونوع المتصفح وملفات تعريف الارتباط لإبقاء جلسة الدخول نشطة وتأمينها.</li>
              </ul>
            </section>

            {/* Use of data */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-550/10 text-indigo-450 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">2. كيف نستخدم بياناتك؟</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                نستخدم هذه البيانات حصرياً من أجل:
              </p>
              <ul className="list-disc pr-6 space-y-2 text-slate-400 text-sm">
                <li>إدارة وتحديث حسابك ومزامنة لوحة التحكم الخاصة بك.</li>
                <li>حساب وترتيب الطلاب في لوحات الشرف والترتيب العام بشكل عادل.</li>
                <li>إصدار وتوثيق شهادات إتمام المسارات والتحقق من صحتها.</li>
                <li>تأمين الحسابات ومراقبة محاولات التلاعب أو اختراق نزاهة التحديات.</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-550/10 text-indigo-450 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">3. ملفات تعريف الارتباط (Cookies)</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                نستخدم ملفات تعريف الارتباط لإدارة جلسات تسجيل الدخول وتذكر خيار "تذكرني" عند الدخول، بالإضافة إلى تذكر السمات البصرية المختارة (مثل الوضع المظلم). يمكنك حظر ملفات تعريف الارتباط عبر إعدادات متصفحك، ولكن هذا سيمنعك من البقاء مسجلاً في حسابك التعليمي.
              </p>
            </section>

            <div className="pt-12 border-t border-slate-800 text-center">
              <p className="text-slate-500 text-xs mb-6">آخر تحديث: 13 يونيو 2026</p>
              <Link href="/contact" className="text-indigo-400 font-bold hover:underline inline-flex items-center gap-1 text-sm">
                لديك استفسار؟ تواصل معنا <ChevronRight className="w-4 h-4 rotate-180" />
              </Link>
            </div>

          </div>

        </div>
      </main>
    </div>
  )
}
