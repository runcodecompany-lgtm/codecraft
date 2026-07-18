"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/components/user-provider'
import { useTheme } from 'next-themes'
import {
  Flame,
  Coins,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Shield,
  GraduationCap,
  Bell,
  Check,
  User as UserIcon,
  ShoppingCart,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  Search,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Button from './button'
import Input from './input'

interface NavItem {
  name: string
  href: string
  icon?: React.ReactNode
}

export default function Navbar() {
  const { user, loading } = useUser()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<any[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [cartCount, setCartCount] = React.useState(0)
  const [scrolled, setScrolled] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const profileRef = React.useRef<HTMLDivElement>(null)
  const notifRef = React.useRef<HTMLDivElement>(null)

  // Track scroll position for navbar elevation effect
  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  React.useEffect(() => {
    const updateCartCount = () => {
      try {
        const cookiesMap = document.cookie.split("; ").reduce((acc, c) => {
          const [key, val] = c.split("=")
          if (key && val) acc[key.trim()] = val.trim()
          return acc
        }, {} as Record<string, string>)
        const cartVal = cookiesMap["ccc_cart_items"]
        if (cartVal) {
          const ids = JSON.parse(decodeURIComponent(cartVal))
          setCartCount(Array.isArray(ids) ? ids.length : 0)
        } else {
          setCartCount(0)
        }
      } catch (e) {
        setCartCount(0)
      }
    }
    updateCartCount()
    const timer = setInterval(updateCartCount, 2000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  // Load and poll notifications
  React.useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    // Mock notification data for now
    const mockNotifications = [
      { id: '1', title: 'مرحباً بك في Code Craft Core!', message: 'ابدأ رحلتك في عالم البرمجة', isRead: false, createdAt: new Date().toISOString() },
      { id: '2', title: 'دورة جديدة', message: 'تم إضافة دورة بايثون للمبتدئين', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: '3', title: 'إنجاز جديد', message: 'لقد أكملت 10 دروس هذا الأسبوع', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
    ]

    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.isRead).length)

    const interval = setInterval(() => {
      // In a real app, this would fetch fresh notifications
    }, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Close dropdowns on outside clicks
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close mobile menu on route change
  React.useEffect(() => { setIsOpen(false) }, [pathname])

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const getDashboardLink = (role: string) => {
    switch (role) {
      case "ADMIN":
      case "SUPER_ADMIN":
      case "MODERATOR":
        return "/dashboard/admin"
      case "TEACHER":
        return "/dashboard/teacher"
      case "STUDENT":
      default:
        return "/dashboard/student"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "مدير عام"
      case "ADMIN": return "مدير النظام"
      case "MODERATOR": return "مشرف"
      case "TEACHER": return "معلم"
      default: return "طالب"
    }
  }

  const publicLinks: NavItem[] = [
    { name: "الرئيسية", href: "/" },
    { name: "سوق الدورات", href: "/courses/marketplace" },
    { name: "خطط الاشتراك", href: "/dashboard/student/subscription" },
    { name: "المعلمون", href: "/teachers" },
    { name: "المدونة", href: "/articles" },
    { name: "من نحن", href: "/about" },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <>
      <nav className={`sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/60 dark:border-gray-700/60 ${scrolled ? 'shadow-lg' : ''}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group shrink-0"
              aria-label="Code Craft Core الصفحة الرئيسية"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 group-hover:scale-105 transition-all duration-300">
                <GraduationCap className="h-5 w-5" />
                <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-base font-black tracking-tight hidden sm:block">
                <span className="text-gray-900 dark:text-white">Code Craft</span>
                {" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Core</span>
              </span>
            </Link>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <form onSubmit={handleSearch} className="w-full">
                <Input
                  type="text"
                  placeholder="ابحث عن دورات، معلمين، مقالات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="pl-10"
                />
              </form>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
              {publicLinks.map((link) => {
                const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${active
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/60 dark:hover:bg-gray-800/60"
                      }`}
                  >
                    {active && (
                      <span className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                    )}
                    {link.name}
                  </Link>
                )
              })}
              {user && (
                <Link
                  href={getDashboardLink(user.role)}
                  className={`relative px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${pathname.startsWith("/dashboard")
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/60 dark:hover:bg-gray-800/60"
                    }`}
                >
                  {pathname.startsWith("/dashboard") && (
                    <span className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                  )}
                  لوحة التحكم
                </Link>
              )}
            </div>

            {/* Desktop Right Controls */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">

              {/* Gamification Pill */}
              {user && (
                <div className="flex items-center gap-2.5 bg-gray-100/80 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/50 rounded-full px-3.5 py-1.5">
                  <div className="flex items-center gap-1.5" title="أيام التعلّم المتتالية">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-black text-orange-600 dark:text-orange-400 tabular-nums">
                      {user.streakCount}
                    </span>
                  </div>
                  <div className="w-px h-3.5 bg-gray-300 dark:bg-gray-600" />
                  <div className="flex items-center gap-1.5" title="رصيد عملات كرافت">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      {(user.craftCoins ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {user && (
                <div className="relative" ref={notifRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsNotificationsOpen(!isNotificationsOpen)
                      setIsProfileOpen(false)
                    }}
                    className="relative p-2"
                    aria-label="الإشعارات"
                    aria-expanded={isNotificationsOpen}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 animate-fade-in">
                      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-xl shadow-gray-200/40 dark:shadow-black/40 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/80 dark:bg-gray-800/30">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-blue-500" />
                            <span className="font-bold text-sm text-gray-900 dark:text-white">
                              الإشعارات
                            </span>
                            {unreadCount > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={handleMarkAllAsRead}
                              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              قراءة الكل
                            </Button>
                          )}
                        </div>

                        {/* Notifications list */}
                        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/50">
                          {notifications.length === 0 ? (
                            <div className="text-center py-10">
                              <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                              <p className="text-xs text-gray-400 dark:text-gray-500">لا توجد إشعارات حالياً.</p>
                            </div>
                          ) : (
                            notifications.slice(0, 8).map((notif) => (
                              <div
                                key={notif.id}
                                className={`px-4 py-3 transition-colors ${notif.isRead
                                  ? "bg-transparent"
                                  : "bg-blue-50/40 dark:bg-blue-950/20"
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  {!notif.isRead && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                  )}
                                  <h4 className={`font-bold text-xs text-gray-900 dark:text-white leading-snug flex-1 ${notif.isRead ? "" : ""}`}>
                                    {notif.title}
                                  </h4>
                                  {!notif.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notif.id)}
                                      className="text-[10px] text-blue-500 hover:text-blue-700 shrink-0 font-semibold"
                                      title="تحديد كمقروء"
                                    >
                                      ✓
                                    </Button>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                  {notif.message}
                                </p>
                                <span className="text-[9px] text-gray-400 dark:text-gray-500 block mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString("ar-EG", {
                                    hour: "numeric",
                                    minute: "numeric",
                                  })}
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        {notifications.length > 0 && (
                          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/80 dark:bg-gray-800/30">
                            <Link
                              href="/dashboard/student/notifications"
                              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 w-full text-center block"
                              onClick={() => setIsNotificationsOpen(false)}
                            >
                              عرض جميع الإشعارات
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/60 transition-all"
                aria-label="سلة المشتريات"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2"
                aria-label="تغيير المظهر"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
                <Moon className="h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              {/* Auth / Profile */}
              {!loading && (
                <>
                  {user ? (
                    <div className="relative" ref={profileRef}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsProfileOpen(!isProfileOpen)
                          setIsNotificationsOpen(false)
                        }}
                        className="flex items-center gap-2 pl-3 pr-2"
                        aria-expanded={isProfileOpen}
                        aria-haspopup="true"
                      >
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="text-sm font-semibold max-w-[90px] truncate text-gray-700 dark:text-gray-300">
                          {user.name}
                        </span>
                        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                      </Button>

                      {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-60 animate-fade-in">
                          <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-xl shadow-gray-200/40 dark:shadow-black/40 overflow-hidden">
                            {/* Profile header */}
                            <div className="px-4 py-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-b border-gray-100 dark:border-gray-800/60">
                              <div className="flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black">
                                  {user.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                    {getRoleLabel(user.role)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="p-2">
                              <Link
                                href={getDashboardLink(user.role)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 hover:text-blue-600 transition-colors"
                                onClick={() => setIsProfileOpen(false)}
                              >
                                <LayoutDashboard className="h-4 w-4" />
                                لوحة التحكم
                              </Link>
                              <Link
                                href="/dashboard/student/profile"
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200 transition-colors"
                                onClick={() => setIsProfileOpen(false)}
                              >
                                <UserIcon className="h-4 w-4" />
                                الملف الشخصي
                              </Link>
                            </div>

                            <div className="p-2 border-t border-gray-100 dark:border-gray-800/60">
                              <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                              >
                                <LogOut className="h-4 w-4" />
                                تسجيل الخروج
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        href="/login"
                        className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-xl transition-all"
                      >
                        دخول
                      </Link>
                      <Link
                        href="/register"
                        className="btn btn-primary btn-md"
                      >
                        <Sparkles className="h-4 w-4" />
                        ابدأ مجاناً
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center gap-1.5 lg:hidden">
              {/* Search Button (Mobile) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // In a real app, this would open a search modal or navigate to search page
                  window.location.href = '/search'
                }}
                className="p-2"
                aria-label="البحث"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Theme Toggle (Mobile) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2"
                aria-label="تغيير المظهر"
              >
                {theme === "dark"
                  ? <Sun className="h-5 w-5" />
                  : <Moon className="h-5 w-5" />
                }
              </Button>

              {/* Cart (Mobile) */}
              <Link
                href="/cart"
                className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/60 transition-all"
                aria-label="سلة المشتريات"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Hamburger */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2"
                aria-label="القائمة الرئيسية"
                aria-expanded={isOpen}
              >
                {isOpen
                  ? <X className="h-6 w-6" />
                  : <Menu className="h-6 w-6" />
                }
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isOpen && (
          <div className="lg:hidden border-t border-gray-200/60 dark:border-gray-800/60 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl animate-fade-in-down">
            <div className="mx-auto max-w-7xl px-4 py-4 space-y-4">

              {/* Search Bar (Mobile) */}
              <form onSubmit={handleSearch} className="mb-4">
                <Input
                  type="text"
                  placeholder="ابحث عن دورات، معلمين، مقالات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="pl-10"
                />
              </form>

              {/* Nav Links */}
              <div className="flex flex-col gap-1">
                {publicLinks.map((link) => {
                  const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-4 py-2.5 rounded-xl text-base font-semibold transition-all ${active
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/60"
                        }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                    </Link>
                  )
                })}
                {user && (
                  <Link
                    href={getDashboardLink(user.role)}
                    className={`px-4 py-2.5 rounded-xl text-base font-semibold transition-all ${pathname.startsWith("/dashboard")
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/60"
                      }`}
                    onClick={() => setIsOpen(false)}
                  >
                    لوحة التحكم
                  </Link>
                )}
              </div>

              {/* Gamification (Mobile) */}
              {user && (
                <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-200/60 dark:border-gray-800/60">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
                      <Flame className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">سلسلة التعلم</p>
                      <p className="text-base font-black text-orange-600 dark:text-orange-400">{user.streakCount} يوم</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                      <Coins className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">عملات كرافت</p>
                      <p className="text-base font-black text-amber-600 dark:text-amber-400">{(user.craftCoins ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* User / Auth (Mobile) */}
              <div className="border-t border-gray-100 dark:border-gray-800/60 pt-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/60">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      تسجيل الخروج
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/login"
                      className="flex items-center justify-center py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      تسجيل الدخول
                    </Link>
                    <Link
                      href="/register"
                      className="btn btn-primary btn-md justify-center"
                      onClick={() => setIsOpen(false)}
                    >
                      ابدأ مجاناً
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
