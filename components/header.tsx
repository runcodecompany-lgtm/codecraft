'use client'
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ChevronDown, Search, Home, Info, Phone, LayoutGrid, BookOpen, GraduationCap, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface HeaderProps {
  categories: Category[]
}

export default function Header({ categories }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  // تغيير ستايل الهيدر عند التمرير
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // إغلاق القائمة عند تغيير المسار
  useEffect(() => {
    // Close mobile menu when route changes by updating state in a microtask
    // This avoids the synchronous setState call inside the effect body
    queueMicrotask(() => setIsOpen(false))
  }, [pathname])

  const navLinks = [
    { name: 'الرئيسية', href: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'من نحن', href: '/about', icon: <Info className="w-4 h-4" /> },
    { name: 'اتصل بنا', href: '/contact', icon: <Phone className="w-4 h-4" /> },
  ]

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-2' : 'bg-white py-4'
      }`}
      dir="rtl"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform">
              <span className="text-xl font-bold italic">N</span>
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tight">أخبار<span className="text-blue-600">نا</span></span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  pathname === link.href 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}

            {/* Categories Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all">
                <LayoutGrid className="w-4 h-4" />
                الأقسام
                <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
              </button>
              
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right group-hover:translate-y-0 translate-y-2">
                <div className="grid grid-cols-1 gap-1 px-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <div className={`relative flex items-center transition-all duration-300 ${isSearchOpen ? 'w-48 md:w-64' : 'w-10'}`}>
              <form onSubmit={handleSearch} className="w-full flex items-center">
                <input
                  type="text"
                  placeholder="ابحث عن خبر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full bg-gray-100 rounded-full py-2 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    isSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                  }`}
                />
                <button 
                  type="button"
                  onClick={() => {
                    if (isSearchOpen && searchQuery.trim()) {
                      handleSearch({ preventDefault: () => {} } as any)
                    } else {
                      setIsSearchOpen(!isSearchOpen)
                    }
                  }}
                  className={`absolute right-0 p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors ${isSearchOpen ? 'text-blue-600' : ''}`}
                  aria-label="بحث في الموقع"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>
            
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={isOpen ? "إغلاق القائمة الرئيسية" : "فتح القائمة الرئيسية"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 top-[72px] z-40 bg-white lg:hidden transition-all duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className="container mx-auto px-4 py-8 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-72px)]">
          {/* Mobile Search */}
          <div className="px-2">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="ابحث عن خبر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pr-12 pl-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <button type="submit" className="hidden">بحث</button>
            </form>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">القائمة الرئيسية</p>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold transition-all ${
                  pathname === link.href 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${pathname === link.href ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  {link.icon}
                </div>
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">أقسام الأخبار</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="p-4 rounded-2xl bg-gray-50 text-gray-700 font-bold hover:bg-blue-50 hover:text-blue-600 transition-all text-center"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
