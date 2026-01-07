export const dynamic = 'force-dynamic';
import { Users, Target, Award, Globe, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "من نحن | أخبارنا",
  description: "تعرف على قصة موقع أخبارنا ورؤيتنا في تقديم المحتوى الإخباري العربي.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Hero Section */}
      <section className="relative py-20 bg-blue-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
        </div>
        <div className="container mx-auto px-4 relative text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">قصتنا ورؤيتنا</h1>
          <p className="text-blue-100 text-xl max-w-3xl mx-auto leading-relaxed">
            منذ انطلاقتنا، وهدفنا هو تقديم الخبر بصدق وموضوعية، لنكون نافذتكم الموثوقة على العالم.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">مهمتنا</h3>
              <p className="text-gray-600 leading-relaxed">
                تقديم تغطية إخبارية شاملة ودقيقة تلتزم بأعلى معايير المهنية والنزاهة الصحفية.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">قيمنا</h3>
              <p className="text-gray-600 leading-relaxed">
                الشفافية، المصداقية، واحترام عقل القارئ هي الركائز الأساسية التي نبني عليها كل حرف نكتبه.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">رؤيتنا</h3>
              <p className="text-gray-600 leading-relaxed">
                أن نكون المنصة الإخبارية الأولى والملهمة للجمهور العربي في جميع أنحاء العالم.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section Placeholder */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 order-2 md:order-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-2 h-10 bg-blue-600 rounded-full"></div>
                فريق العمل
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                نضم نخبة من الصحفيين والمحررين والتقنيين المبدعين الذين يعملون بشغف لتقديم محتوى إخباري متميز يواكب العصر الرقمي.
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-blue-600">+10</div>
                  <div className="text-gray-500 text-sm font-medium">صحفي محترف</div>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-3xl font-black text-blue-600">+500</div>
                  <div className="text-gray-500 text-sm font-medium">مقال شهري</div>
                </div>
              </div>
            </div>
            <div className="flex-1 order-1 md:order-2">
              <div className="relative aspect-square w-full bg-gray-100 rounded-full overflow-hidden border-8 border-gray-50 shadow-inner">
                <div className="absolute inset-0 flex items-center justify-center">
                   <Users className="w-32 h-32 text-gray-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-20 bg-gray-900 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-8">كن جزءاً من مجتمعنا الإخباري</h2>
          <Link 
            href="/contact" 
            className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-4 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
          >
            تواصل معنا الآن <ChevronRight className="w-5 h-5 rotate-180" />
          </Link>
        </div>
      </section>
    </div>
  );
}
