'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronLeft,
  ArrowUpCircle
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface FooterProps {
  categories: Category[]
}

export default function Footer({ categories }: FooterProps) {
  const currentYear = new Date().getFullYear()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const quickLinks = [
    { name: 'الرئيسية', href: '/' },
    { name: 'من نحن', href: '/about' },
    { name: 'اتصل بنا', href: '/contact' },
    { name: 'سياسة الخصوصية', href: '/privacy' },
  ]

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <span className="text-xl font-bold italic">N</span>
              </div>
              <span className="text-2xl font-black text-white tracking-tight">أخبار<span className="text-blue-500">نا</span></span>
            </Link>
            <p className="text-gray-400 leading-relaxed text-sm">
              منصتكم الإخبارية الأولى للحصول على أحدث الأخبار والتحليلات العميقة في مختلف المجالات. نلتزم بالمصداقية والسرعة في نقل الخبر.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-400 hover:text-white transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Categories Section */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              أقسام الأخبار
            </h3>
            <ul className="grid grid-cols-2 gap-y-4 gap-x-2">
              {categories.slice(0, 8).map((cat) => (
                <li key={cat.id}>
                  <Link 
                    href={`/category/${cat.slug}`}
                    className="flex items-center gap-2 hover:text-blue-500 transition-colors text-sm group"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600 group-hover:text-blue-500 transition-colors" />
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              روابط سريعة
            </h3>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="flex items-center gap-2 hover:text-blue-500 transition-colors text-sm group"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600 group-hover:text-blue-500 transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              تواصل معنا
            </h3>
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">العنوان</p>
                  <p className="text-gray-400 text-xs mt-1">شارع الصحافة، الطابق الرابع، الرياض، المملكة العربية السعودية</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">البريد الإلكتروني</p>
                  <p className="text-gray-400 text-xs mt-1">info@news-site.com</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">رقم الهاتف</p>
                  <p className="text-gray-400 text-xs mt-1" dir="ltr">+966 50 000 0000</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-gray-500 text-center md:text-right">
            جميع الحقوق محفوظة © {currentYear} <span className="text-blue-500 font-bold">أخبارنا</span>. صنع بكل حب لدعم المحتوى العربي.
          </p>
          
          <button 
            onClick={scrollToTop}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors group"
          >
            العودة للأعلى
            <ArrowUpCircle className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  )
}
