export const dynamic = 'force-dynamic';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe } from "lucide-react";

export const metadata = {
  title: "تواصل معنا | أخبارنا",
  description: "نحن هنا للاستماع إليك. تواصل معنا لأي استفسار أو اقتراح أو تعاون إخباري.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">يسعدنا التواصل معك</h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
            سواء كان لديك خبر، استفسار، أو ترغب في الانضمام لفريقنا، فنحن نرحب برسائلك دائماً.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Contact Info Cards */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 group hover:border-blue-200 transition-colors">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">البريد الإلكتروني</h3>
                <p className="text-gray-500 mb-4 text-sm">راسلنا في أي وقت وسنرد عليك خلال 24 ساعة.</p>
                <a href="mailto:contact@yournews.com" className="text-blue-600 font-bold hover:underline">contact@yournews.com</a>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 group hover:border-green-200 transition-colors">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-all">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">اتصل بنا</h3>
                <p className="text-gray-500 mb-4 text-sm">متاحون للرد على اتصالاتكم خلال ساعات العمل.</p>
                <a href="tel:+966000000000" className="text-green-600 font-bold hover:underline" dir="ltr">+966 50 000 0000</a>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 group hover:border-purple-200 transition-colors">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">ساعات العمل</h3>
                <p className="text-gray-500 text-sm">من الأحد إلى الخميس<br />9:00 صباحاً - 5:00 مساءً</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-10">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">أرسل لنا رسالة</h2>
                </div>

                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 mr-1">الاسم الكامل</label>
                      <input 
                        type="text" 
                        placeholder="أدخل اسمك الكريم"
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 mr-1">البريد الإلكتروني</label>
                      <input 
                        type="email" 
                        placeholder="email@example.com"
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 mr-1">الموضوع</label>
                    <input 
                      type="text" 
                      placeholder="كيف يمكننا مساعدتك؟"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 mr-1">الرسالة</label>
                    <textarea 
                      rows={5}
                      placeholder="اكتب تفاصيل رسالتك هنا..."
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="w-full md:w-auto bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/10 group"
                  >
                    <span>إرسال الرسالة</span>
                    <Send className="w-5 h-5 group-hover:translate-x-[-4px] group-hover:translate-y-[-2px] transition-transform" />
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Map/Location Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 h-96 relative overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">خريطة الموقع (قريباً)</p>
          </div>
        </div>
      </section>
    </div>
  );
}
