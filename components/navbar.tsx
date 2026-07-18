"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/components/user-provider"
import { useTheme } from "next-themes"
import {
  Flame,
  Coins,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  GraduationCap,
  Bell,
  Check,
  User as UserIcon,
  ShoppingCart,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  Map,
  Users,
  Globe,
  MessageSquare,
  Mail,
  Home,
  HelpCircle,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { fetchMyNotificationsAction, markAsReadAction, markAllAsReadAction } from "@/actions/notifications"

const publicLinks = [
  { name: "الرئيسية", href: "/", icon: Home },
  { name: "المسارات", href: "/courses/marketplace", icon: Map },
  { name: "الدورات", href: "/courses", icon: BookOpen },
  { name: "المجتمع", href: "/community", icon: MessageCircle },
  { name: "المعلمون", href: "/teachers", icon: Users },
  { name: "الأسئلة الشائعة", href: "/faq", icon: HelpCircle },
  { name: "تواصل معنا", href: "/contact", icon: Mail },
]

export default function Navbar() {
  const { user, loading } = useUser()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [lang, setLang] = useState<"ar" | "en">("ar")

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  // Track scroll position for header glassmorphic effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Shopping cart cookie check
  useEffect(() => {
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
      } catch {
        setCartCount(0)
      }
    }
    updateCartCount()
    const timer = setInterval(updateCartCount, 2000)
    return () => clearInterval(timer)
  }, [])

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  // Load notifications
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    const loadNotifications = async () => {
      const res = await fetchMyNotificationsAction()
      if (res.success && res.notifications) {
        setNotifications(res.notifications)
        setUnreadCount(res.notifications.filter((n: any) => !n.isRead).length)
      }
    }
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Close dropdowns on outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (profileRef.current && !profileRef.current.contains(target)) setIsProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(target)) setIsNotificationsOpen(false)
      if (langRef.current && !langRef.current.contains(target)) setIsLangOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close mobile drawer on navigation
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleMarkAsRead = async (id: string) => {
    const res = await markAsReadAction(id)
    if (res.success) {
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    const res = await markAllAsReadAction()
    if (res.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    }
  }

  const getDashboardLink = (role: string) => {
    switch (role) {
      case "ADMIN":
      case "SUPER_ADMIN":
      case "MODERATOR":
        return "/dashboard/admin"
      case "TEACHER":
        return "/dashboard/teacher"
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

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-md lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Primary Sticky Header */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
            ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-850/50 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] h-16"
            : "bg-white/40 dark:bg-slate-900/30 backdrop-blur-md border-b border-transparent h-20"
          }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex h-full items-center justify-between gap-4">

            {/* Logo Section */}
            <Link
              href="/"
              className="flex items-center gap-3 group shrink-0"
              aria-label="الصفحة الرئيسية لمنصة Code Craft Core"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2B4C7E] to-[#1c3459] text-white shadow-md shadow-[#2B4C7E]/20 group-hover:scale-105 transition-all duration-300 ring-2 ring-[#2B4C7E]/10">
                <GraduationCap className="h-6 w-6 transform group-hover:rotate-12 transition-transform duration-300" />
                <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-[#4A7C59] rounded-full ring-2 ring-white dark:ring-slate-950 animate-pulse" />
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-[17px] font-black tracking-tight text-slate-900 dark:text-slate-50">
                  Code Craft{" "}
                  <span className="bg-gradient-to-r from-[#2B4C7E] to-[#4A7C59] bg-clip-text text-transparent">Core</span>
                </span>
                <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 tracking-wider uppercase">منصة التعليم التفاعلي</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5 flex-1 justify-center" aria-label="التنقل الرئيسي">
              {publicLinks.map((link) => {
                const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${active
                        ? "text-[#2B4C7E] dark:text-[#7FA8D4] bg-[#2B4C7E]/8 dark:bg-[#2B4C7E]/15 border border-[#2B4C7E]/15 dark:border-[#2B4C7E]/20"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/40 dark:hover:bg-slate-800/40"
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-[#2B4C7E] dark:text-[#7FA8D4]" : "text-slate-400 dark:text-slate-550"}`} />
                    <span>{link.name}</span>
                    {active && (
                      <span className="absolute -bottom-0.5 inset-x-5 h-0.5 rounded-full bg-gradient-to-r from-[#2B4C7E] to-[#4A7C59]" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Desktop Right Settings & Actions */}
            <div className="hidden lg:flex items-center gap-2.5 shrink-0">

              {/* Gamification Stats (Streaks & Coins) */}
              {user && (
                <div className="flex items-center gap-2.5 bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-full px-3.5 py-1.5 shadow-sm">
                  <div className="flex items-center gap-1.5" title="أيام التعلّم المتتالية">
                    <Flame className="h-4 w-4 text-orange-500 animate-bounce delay-100" />
                    <span className="text-xs font-black text-orange-600 dark:text-orange-400 tabular-nums">{user.streakCount}</span>
                  </div>
                  <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-center gap-1.5" title="رصيد عملات كرافت">
                    <Coins className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 tabular-nums">{(user.craftCoins ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Language Switcher */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => { setIsLangOpen(!isLangOpen); setIsNotificationsOpen(false); setIsProfileOpen(false) }}
                  className="flex items-center gap-1.5 p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200/30 dark:hover:border-slate-700/30 transition-all outline-none"
                  aria-label="تغيير اللغة"
                  aria-expanded={isLangOpen}
                >
                  <Globe className="h-5 w-5 text-slate-500" />
                  <span className="text-xs font-bold uppercase">{lang === "ar" ? "AR" : "EN"}</span>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isLangOpen ? "rotate-180" : ""}`} />
                </button>
                {isLangOpen && (
                  <div className="absolute left-0 mt-2 w-32 origin-top-left rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-scale-in z-50">
                    <div className="p-1 space-y-0.5">
                      <button
                        onClick={() => { setLang("ar"); setIsLangOpen(false) }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${lang === "ar"
                            ? "bg-[#2B4C7E]/8 text-[#2B4C7E] dark:bg-[#2B4C7E]/20 dark:text-[#7FA8D4]"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                      >
                        <span>العربية</span>
                        {lang === "ar" && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => { setLang("en"); setIsLangOpen(false) }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${lang === "en"
                            ? "bg-[#2B4C7E]/8 text-[#2B4C7E] dark:bg-[#2B4C7E]/20 dark:text-[#7FA8D4]"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                      >
                        <span>English</span>
                        {lang === "en" && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Private Messages (If Logged In) */}
              {user && (
                <Link
                  href="/community/messages"
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200/30 dark:hover:border-slate-700/30 transition-all"
                  aria-label="الرسائل الخاصة"
                  title="الرسائل الخاصة"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-950" />
                </Link>
              )}

              {/* Notifications Dropdown (If Logged In) */}
              {user && (
                <div className="relative" ref={notifRef}>
                  <button
                    id="notifications-btn"
                    onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); setIsLangOpen(false) }}
                    className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200/30 dark:hover:border-slate-700/30 transition-all outline-none"
                    aria-label="الإشعارات"
                    aria-expanded={isNotificationsOpen}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-950 animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute left-0 mt-2 w-80 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-scale-in z-50">
                      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-[#2B4C7E]/5 to-[#4A7C59]/5 dark:from-[#2B4C7E]/10 dark:to-[#4A7C59]/10">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4.5 w-4.5 text-[#2B4C7E] dark:text-[#7FA8D4]" />
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">الإشعارات</span>
                          {unreadCount > 0 && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#2B4C7E]/10 text-[#2B4C7E] dark:bg-[#2B4C7E]/20 dark:text-[#7FA8D4]">{unreadCount} جديد</span>}
                        </div>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllAsRead} className="text-xs font-bold text-[#2B4C7E] dark:text-[#7FA8D4] hover:opacity-85 flex items-center gap-1 transition-colors">
                            <Check className="w-3.5 h-3.5" /> قراءة الكل
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.length === 0 ? (
                          <div className="text-center py-10">
                            <Bell className="w-9 h-9 text-slate-300 dark:text-slate-655 mx-auto mb-2" />
                            <p className="text-xs text-slate-500">لا توجد إشعارات حالياً.</p>
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((notif) => (
                            <div key={notif.id} className={`px-4 py-3 transition-colors ${notif.isRead ? "bg-transparent" : "bg-[#2B4C7E]/5 dark:bg-[#2B4C7E]/10"}`}>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#2B4C7E] mt-1.5 shrink-0" />}
                                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 leading-snug flex-1">{notif.title}</h4>
                                {!notif.isRead && (
                                  <button onClick={() => handleMarkAsRead(notif.id)} className="text-[10px] text-[#2B4C7E] hover:text-[#1c3459] dark:text-[#7FA8D4] shrink-0 font-semibold" title="تحديد كمقروء">✓</button>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{notif.message}</p>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1.5">
                                {new Date(notif.createdAt).toLocaleDateString("ar-EG", { hour: "numeric", minute: "numeric" })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                          <Link href="/dashboard/student/notifications" className="text-xs font-bold text-[#2B4C7E] dark:text-[#7FA8D4] hover:underline" onClick={() => setIsNotificationsOpen(false)}>
                            عرض جميع الإشعارات
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Shopping Cart */}
              <Link
                href="/cart"
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200/30 dark:hover:border-slate-700/30 transition-all"
                aria-label="سلة المشتريات"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-r from-[#2B4C7E] to-[#1c3459] text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-950">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/55 border border-transparent hover:border-slate-200/30 dark:hover:border-slate-700/30 transition-all outline-none"
                aria-label="تغيير المظهر"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute inset-2" />
                <Moon className="h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </button>

              {/* User Account / Profile Dropdown (If Logged In) or Auth Buttons (If Logged Out) */}
              {!loading && (
                <>
                  {user ? (
                    <div className="relative" ref={profileRef}>
                      <button
                        id="profile-btn"
                        onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); setIsLangOpen(false) }}
                        className="flex items-center gap-2 pr-3 pl-2 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100/40 dark:hover:bg-slate-800/40 transition-all outline-none ring-1 ring-slate-200/10"
                        aria-expanded={isProfileOpen}
                      >
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-[#2B4C7E] to-[#1c3459] flex items-center justify-center text-white font-black text-sm shadow-sm ring-1 ring-white/10">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="text-sm font-bold max-w-[88px] truncate text-slate-800 dark:text-slate-200">{user.name}</span>
                        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isProfileOpen && (
                        <div className="absolute left-0 mt-2 w-60 origin-top-left rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-scale-in z-50">
                          <div className="px-4 py-4 bg-gradient-to-br from-[#2B4C7E]/5 to-[#4A7C59]/5 dark:from-[#2B4C7E]/10 dark:to-[#4A7C59]/10 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#2B4C7E] to-[#1c3459] flex items-center justify-center text-white font-black text-base shadow-inner">
                                {user.name?.[0]?.toUpperCase() || "U"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50 truncate">{user.name}</p>
                                <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2B4C7E]/10 text-[#2B4C7E] dark:bg-[#2B4C7E]/20 dark:text-[#7FA8D4]">
                                  {getRoleLabel(user.role)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-2 space-y-0.5">
                            <Link
                              href={getDashboardLink(user.role)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-[#2B4C7E]/8 dark:hover:bg-[#2B4C7E]/15 hover:text-[#2B4C7E] dark:hover:text-[#7FA8D4] transition-colors"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <LayoutDashboard className="h-4.5 w-4.5 text-slate-400 dark:text-slate-550" />
                              <span>لوحة التحكم</span>
                            </Link>
                            <Link
                              href="/dashboard/student/profile"
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-950 dark:hover:text-white transition-colors"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <UserIcon className="h-4.5 w-4.5 text-slate-400 dark:text-slate-550" />
                              <span>الملف الشخصي</span>
                            </Link>
                          </div>
                          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20">
                            <button
                              onClick={handleLogout}
                              className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <LogOut className="h-4.5 w-4.5" />
                              <span>تسجيل الخروج</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        href="/login"
                        className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/55 rounded-xl transition-all"
                      >
                        تسجيل الدخول
                      </Link>
                      <Link
                        href="/register"
                        className="relative inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-[#2B4C7E] to-[#1c3459] text-white font-bold text-sm shadow-md shadow-[#2B4C7E]/15 hover:shadow-lg hover:shadow-[#2B4C7E]/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>إنشاء حساب</span>
                      </Link>
                    </div>
                  )}
                </>
              )}

            </div>

            {/* Mobile Navigation controls */}
            <div className="flex items-center gap-1 lg:hidden">
              {/* Theme Toggle (Mobile) */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all"
                aria-label="تغيير المظهر"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Cart (Mobile) */}
              <Link
                href="/cart"
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all"
                aria-label="السلة"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-r from-[#2B4C7E] to-[#1c3459] text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-950">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Hamburger Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl text-slate-800 dark:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all outline-none"
                aria-label="القائمة الرئيسية"
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="h-6.5 w-6.5" /> : <Menu className="h-6.5 w-6.5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Slide-in Drawer Container */}
        <div
          className={`lg:hidden fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200/60 dark:border-slate-800/80 shadow-2xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
            }`}
          dir="rtl"
        >
          {/* Drawer Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-850">
            <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-gradient-to-tr from-[#2B4C7E] to-[#1c3459] text-white shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-base font-black text-slate-900 dark:text-slate-50">Code Craft Core</span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="إغلاق القائمة"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-5 flex-1 space-y-6">

            {/* User Stats Card in Mobile Drawer */}
            {user && (
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 shadow-sm space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">إحصائيات التعلم</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-orange-100/50 dark:bg-orange-950/20 flex items-center justify-center">
                      <Flame className="h-4.5 w-4.5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">سلسلة التعلم</p>
                      <p className="text-sm font-black text-orange-600 dark:text-orange-400">{user.streakCount} يوم</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-amber-100/50 dark:bg-amber-950/20 flex items-center justify-center">
                      <Coins className="h-4.5 w-4.5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">عملات كرافت</p>
                      <p className="text-sm font-black text-amber-600 dark:text-amber-400">{(user.craftCoins ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Drawer Settings (Language Switcher) */}
            <div className="grid grid-cols-2 gap-2 pb-2">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase px-1">اللغة / Language</span>
                <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-1">
                  <button
                    onClick={() => setLang("ar")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-all ${lang === "ar" ? "bg-white dark:bg-slate-800 text-[#2B4C7E] dark:text-[#7FA8D4] shadow-sm" : "text-slate-500"
                      }`}
                  >
                    العربية
                  </button>
                  <button
                    onClick={() => setLang("en")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-all ${lang === "en" ? "bg-white dark:bg-slate-800 text-[#2B4C7E] dark:text-[#7FA8D4] shadow-sm" : "text-slate-500"
                      }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase px-1">المظهر / Theme</span>
                <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-1">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-all ${theme === "light" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                      }`}
                  >
                    نهاري
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-all ${theme === "dark" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500"
                      }`}
                  >
                    ليلي
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Drawer Main Navigation Links */}
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-2">روابط الموقع</p>
              {publicLinks.map((link) => {
                const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all ${active
                        ? "text-[#2B4C7E] dark:text-[#7FA8D4] bg-[#2B4C7E]/8 dark:bg-[#2B4C7E]/15 border border-[#2B4C7E]/15 dark:border-[#2B4C7E]/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-855/50 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${active ? "bg-[#2B4C7E]/12 dark:bg-[#2B4C7E]/20 text-[#2B4C7E] dark:text-[#7FA8D4]" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span>{link.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* User Logged In Card / Quick Links */}
            <div className="border-t border-slate-100 dark:border-slate-855 pt-5 space-y-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-800/50">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#2B4C7E] to-[#1c3459] flex items-center justify-center text-white font-black text-base shrink-0 shadow-sm">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={getDashboardLink(user.role)}
                      className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                      onClick={() => setIsOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      <span>لوحة التحكم</span>
                    </Link>
                    <Link
                      href="/community/messages"
                      className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-855"
                      onClick={() => setIsOpen(false)}
                    >
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span>الرسائل</span>
                    </Link>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all border border-transparent hover:border-red-200/30"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2">
                  <Link
                    href="/login"
                    className="flex items-center justify-center py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-850 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#2B4C7E] to-[#1c3459] text-white font-bold text-sm hover:opacity-95 shadow-md shadow-[#2B4C7E]/15"
                    onClick={() => setIsOpen(false)}
                  >
                    <Sparkles className="h-4.5 w-4.5" />
                    <span>إنشاء حساب مجاني</span>
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>
    </>
  )
}
