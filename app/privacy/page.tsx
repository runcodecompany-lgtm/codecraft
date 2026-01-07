import { ShieldCheck, Lock, Eye, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "سياسة الخصوصية | أخبارنا",
  description: "تعرف على كيفية حماية بياناتك ومعلوماتك الشخصية في موقع أخبارنا.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">سياسة الخصوصية</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            نحن نلتزم بحماية خصوصيتك وضمان أمان معلوماتك الشخصية بأعلى المعايير.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="space-y-12">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">جمع المعلومات</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل في الموقع أو الاشتراك في النشرة البريدية. تشمل هذه المعلومات الاسم والبريد الإلكتروني.
              </p>
              <p className="text-gray-600 leading-relaxed">
                كما نقوم بجمع بعض المعلومات تقنياً بشكل تلقائي مثل عنوان البروتوكول (IP) ونوع المتصفح لتحسين تجربة المستخدم.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">استخدام المعلومات</h2>
              </div>
              <ul className="space-y-4 text-gray-600">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 shrink-0"></div>
                  <span>تخصيص تجربتك وتقديم المحتوى الذي يهمك.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 shrink-0"></div>
                  <span>تحسين جودة الموقع والخدمات المقدمة.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 shrink-0"></div>
                  <span>إرسال إشعارات بالأخبار العاجلة أو التحديثات الهامة.</span>
                </li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">ملفات تعريف الارتباط (Cookies)</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                نستخدم ملفات تعريف الارتباط لتحسين أداء الموقع وتذكر تفضيلاتك. يمكنك اختيار تعطيل ملفات تعريف الارتباط من خلال إعدادات متصفحك، ولكن قد يؤثر ذلك على بعض وظائف الموقع.
              </p>
            </section>

            <div className="pt-12 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm mb-6">آخر تحديث: 7 يناير 2026</p>
              <Link href="/contact" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-2">
                لديك استفسار؟ تواصل معنا <ChevronRight className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
