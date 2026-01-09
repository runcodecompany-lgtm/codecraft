export const dynamic = 'force-dynamic';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe } from "lucide-react";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "تواصل معنا | أخبارنا",
  description: "نحن هنا للاستماع إليك. تواصل معنا لأي استفسار أو اقتراح أو تعاون إخباري.",
};

export default async function ContactPage() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' }
  });

  return (
    <main className="min-h-screen bg-gray-50 py-16 lg:py-24" dir="rtl">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">تواصل <span className="text-blue-600">معنا</span></h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            نحن نقدر تواصلكم معنا. سواء كان لديكم خبر عاجل، استفسار إعلاني، أو اقتراح لتحسين تجربتكم، فريقنا جاهز للرد عليكم.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-6 group hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">البريد الإلكتروني</h3>
                <p className="text-gray-500 text-sm mb-3">راسلنا في أي وقت وسنرد عليك خلال 24 ساعة.</p>
                <a href={`mailto:${settings?.contactEmail || 'info@news-site.com'}`} className="text-blue-600 font-bold hover:underline">
                  {settings?.contactEmail || 'info@news-site.com'}
                </a>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-6 group hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">رقم الهاتف</h3>
                <p className="text-gray-500 text-sm mb-3">متاحون للرد على اتصالاتكم خلال ساعات العمل.</p>
                <a href={`tel:${settings?.phoneNumber || '+966500000000'}`} dir="ltr" className="text-green-600 font-bold hover:underline inline-block">
                  {settings?.phoneNumber || '+966 50 000 0000'}
                </a>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-6 group hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">المقر الرئيسي</h3>
                <p className="text-gray-500 text-sm mb-3">تفضل بزيارتنا في مكتبنا الرسمي.</p>
                <p className="text-gray-900 font-bold">
                  {settings?.officeAddress || 'الرياض، المملكة العربية السعودية'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white p-8 lg:p-12 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              أرسل لنا رسالة
            </h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 mr-1">الاسم الكامل</label>
                <input 
                  type="text" 
                  placeholder="أدخل اسمك هنا..."
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 mr-1">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  placeholder="email@example.com"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-700 mr-1">الموضوع</label>
                <input 
                  type="text" 
                  placeholder="ما الذي تود مراسلتنا بشأنه؟"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-700 mr-1">الرسالة</label>
                <textarea 
                  rows={5}
                  placeholder="اكتب رسالتك بالتفصيل هنا..."
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <button className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  إرسال الرسالة الآن
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Map Section */}
        {settings?.googleMapsEmbedUrl && (
          <div className="mt-16 max-w-7xl mx-auto h-[450px] rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            <iframe 
              src={settings.googleMapsEmbedUrl}
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        )}
      </div>
    </main>
  );
}
