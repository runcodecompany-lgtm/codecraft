import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react"

export const metadata = {
  title: "تواصل معنا | Code Craft Core",
  description: "نحن هنا للاستماع إليك. تواصل معنا لأي استفسار أو اقتراح أو تعاون.",
}

const CONTACT_EMAIL = "support@codecraftcore.com"
const CONTACT_PHONE = "+966 50 000 0000"
const OFFICE_ADDRESS = "الرياض، المملكة العربية السعودية"

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 py-16 lg:py-24 text-white" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-black mb-6">
            تواصل{" "}
            <span className="bg-gradient-to-l from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              معنا
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            سواء كان لديك استفسار عن المحتوى، اقتراح لتحسين المنصة، أو طلب تعاون — فريقنا جاهز للرد عليك.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="space-y-5">
            {[
              {
                icon: Mail,
                color: "text-violet-400 bg-violet-500/10",
                title: "البريد الإلكتروني",
                desc: "راسلنا في أي وقت وسنرد خلال 24 ساعة.",
                value: CONTACT_EMAIL,
                href: `mailto:${CONTACT_EMAIL}`,
              },
              {
                icon: Phone,
                color: "text-emerald-400 bg-emerald-500/10",
                title: "رقم الهاتف",
                desc: "متاحون للرد خلال ساعات العمل الرسمية.",
                value: CONTACT_PHONE,
                href: `tel:${CONTACT_PHONE.replace(/\s/g, "")}`,
              },
              {
                icon: MapPin,
                color: "text-amber-400 bg-amber-500/10",
                title: "المقر الرئيسي",
                desc: "تفضل بزيارتنا في مكتبنا الرسمي.",
                value: OFFICE_ADDRESS,
                href: null,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex items-start gap-5 hover:border-slate-700 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-slate-500 text-sm mb-2">{item.desc}</p>
                  {item.href ? (
                    <a href={item.href} className="text-violet-400 font-bold text-sm hover:text-violet-300 transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-white font-bold text-sm">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-8 lg:p-10">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-violet-400" />
              أرسل لنا رسالة
            </h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 block">الاسم الكامل</label>
                <input
                  type="text"
                  placeholder="أدخل اسمك..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-white placeholder-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 block">البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-white placeholder-slate-500"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-300 block">الموضوع</label>
                <input
                  type="text"
                  placeholder="ما الذي تود مراسلتنا بشأنه؟"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-white placeholder-slate-500"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-300 block">الرسالة</label>
                <textarea
                  rows={5}
                  placeholder="اكتب رسالتك بالتفصيل هنا..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none text-white placeholder-slate-500"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-violet-600 to-indigo-600 px-8 py-4 font-bold hover:scale-105 transition-all shadow-lg shadow-violet-500/20"
                >
                  <Send className="w-5 h-5" />
                  إرسال الرسالة الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
