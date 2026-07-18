"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Mail,
  MapPin,
  ArrowUp,
  GraduationCap,
  Sparkles,
  BookOpen,
  Users,
  MessageCircle,
  Shield,
  Heart,
  Map,
  HelpCircle,
  Newspaper,
  Trophy,
  Send,
  ChevronLeft,
} from "lucide-react"

const exploreLinks = [
  { name: "المسارات التعليمية",  href: "/courses/marketplace" },
  { name: "سوق الدورات",         href: "/courses" },
  { name: "المعلمون",            href: "/teachers" },
  { name: "المجتمع",             href: "/community" },
  { name: "المدونة التقنية",     href: "/articles" },
  { name: "لوحة المتصدرين",     href: "/community/leaderboard" },
]

const supportLinks = [
  { name: "من نحن",              href: "/about" },
  { name: "مركز المساعدة",       href: "/help" },
  { name: "تواصل معنا",          href: "/contact" },
  { name: "سياسة الخصوصية",     href: "/privacy" },
  { name: "الشروط والأحكام",     href: "/terms" },
  { name: "الأسعار والباقات",   href: "/pricing" },
]

const socials = [
  { icon: Github,    href: "https://github.com",    label: "GitHub" },
  { icon: Twitter,   href: "https://twitter.com",   label: "Twitter" },
  { icon: Linkedin,  href: "https://linkedin.com",  label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Youtube,   href: "https://youtube.com",   label: "YouTube" },
]

export default function SiteFooter() {
  const pathname = usePathname()
  const year = new Date().getFullYear()
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  if (pathname?.startsWith("/register")) return null

  return (
    <footer className="relative bg-[#F5F7FA] dark:bg-[#141C2F] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/60" dir="rtl">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#2B4C7E]/30 to-transparent dark:via-[#2B4C7E]/50" />

      <div className="border-b border-slate-200 dark:border-slate-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-1">
                جاهز للانطلاق في مسيرتك التعليمية؟
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ابدأ مجاناً اليوم وانضم لأكثر من مليون متعلم عربي.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#2B4C7E] to-[#1c3459] text-white font-bold text-sm hover:opacity-90 hover:scale-[1.03] transition-all shadow-lg shadow-[#2B4C7E]/20"
              >
                <Sparkles className="w-4 h-4" />
                ابدأ مجاناً
              </Link>
              <Link
                href="/courses/marketplace"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-sm transition-all"
              >
                <BookOpen className="w-4 h-4" />
                استكشف الدورات
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-2.5 group" aria-label="Code Craft Core">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2B4C7E] to-[#1c3459] text-white shadow-md shadow-[#2B4C7E]/20 group-hover:scale-105 transition-all">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-slate-50 font-black text-base tracking-tight">Code Craft Core</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">EdTech Platform</p>
              </div>
            </Link>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              منصة تعلّم عربية ذكية تدمج التعليم المنهجي بأساليب التعلم التكيّفي لصناعة الكفاءات العربية في عالم التقنية.
            </p>

            <div className="space-y-2.5">
              <a
                href="mailto:support@codecraftcore.com"
                className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-[#2B4C7E] dark:hover:text-[#7FA8D4] transition-colors group"
              >
                <Mail className="w-4 h-4 text-[#2B4C7E] dark:text-[#7FA8D4] shrink-0" />
                <span>support@codecraftcore.com</span>
              </a>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-[#4A7C59] shrink-0" />
                <span>المنطقة العربية · عالمي</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#2B4C7E] dark:hover:text-[#7FA8D4] hover:border-[#2B4C7E]/30 dark:hover:border-[#2B4C7E]/40 hover:bg-[#2B4C7E]/5 hover:scale-105 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-slate-900 dark:text-slate-100 font-black text-sm mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2B4C7E] dark:text-[#7FA8D4]" />
              روابط سريعة
            </h3>
            <ul className="space-y-3">
              {exploreLinks.map(({ name, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#2B4C7E] dark:hover:text-[#7FA8D4] transition-colors font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-[#2B4C7E] dark:group-hover:bg-[#7FA8D4] transition-colors shrink-0" />
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 dark:text-slate-100 font-black text-sm mb-6 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#4A7C59]" />
              المجتمع والدعم
            </h3>
            <ul className="space-y-3">
              {supportLinks.map(({ name, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#4A7C59] dark:hover:text-[#6AAD7A] transition-colors font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-[#4A7C59] dark:group-hover:bg-[#6AAD7A] transition-colors shrink-0" />
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 dark:text-slate-100 font-black text-sm mb-6 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#2B4C7E] dark:text-[#7FA8D4]" />
              ابقَ على اطلاع
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              اشترك في نشرتنا البريدية للحصول على أحدث الدورات والمقالات والعروض.
            </p>

            <div className="flex gap-2">
              <input
                type="email"
                id="footer-newsletter-email"
                placeholder="بريدك الإلكتروني"
                dir="rtl"
                className="flex-1 min-w-0 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2B4C7E]/60 focus:ring-2 focus:ring-[#2B4C7E]/15 transition-all"
              />
              <button
                aria-label="اشتراك في النشرة البريدية"
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#2B4C7E] to-[#1c3459] text-white text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.03] shadow-md shadow-[#2B4C7E]/20 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
              نحترم خصوصيتك. لا رسائل مزعجة أبداً.
            </p>

            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 mb-3">المجتمع</p>
              <Link
                href="/community"
                className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-[#2B4C7E] dark:hover:text-[#7FA8D4] transition-colors font-semibold"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#2B4C7E] dark:text-[#7FA8D4]" />
                منتدى المجتمع
              </Link>
              <Link
                href="/community/questions"
                className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-[#2B4C7E] dark:hover:text-[#7FA8D4] transition-colors font-semibold"
              >
                <Users className="w-3.5 h-3.5 text-[#2B4C7E] dark:text-[#7FA8D4]" />
                الأسئلة والأجوبة
              </Link>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap justify-center sm:justify-start">
            <span>جميع الحقوق محفوظة ©</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">{year} Code Craft Core</span>
            <span className="hidden sm:inline">· صُنع بكل</span>
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 hidden sm:inline-flex" />
            <span className="hidden sm:inline">لمجتمعنا العربي</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium">الخصوصية</Link>
              <span>·</span>
              <Link href="/terms"   className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium">الشروط</Link>
              <span>·</span>
              <Link href="/sitemap.xml" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium">خريطة الموقع</Link>
            </div>

            <button
              onClick={scrollToTop}
              aria-label="العودة لأعلى الصفحة"
              className="group flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-[#2B4C7E] dark:hover:text-[#7FA8D4] transition-colors"
            >
              <span className="hidden sm:inline">أعلى الصفحة</span>
              <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

        </div>
      </div>
    </footer>
  )
}
