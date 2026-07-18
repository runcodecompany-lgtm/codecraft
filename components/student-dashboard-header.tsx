// components/student-dashboard-header.tsx
"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell, Search, Settings, LogOut, ChevronLeft,
  Sparkles, Home, ChevronDown, Moon, Sun, User,
  GraduationCap, LayoutDashboard,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState } from "react"

const breadcrumbNames: Record<string, string> = {
  "/dashboard/student": "لوحة التحكم",
  "/dashboard/student/courses": "مقرراتي",
  "/dashboard/student/placement": "تحديد المستوى",
  "/dashboard/student/quizzes": "الاختبارات",
  "/dashboard/student/games": "ساحة البرمجة",
  "/dashboard/student/leaderboard": "لوحة الصدارة",
  "/dashboard/student/certificates": "معرض الشهادات",
  "/dashboard/student/achievements": "الإنجازات",
  "/dashboard/student/wallet": "المحفظة الرقمية",
  "/dashboard/student/referrals": "التسويق والإحالات",
  "/dashboard/student/subscription": "الاشتراكات",
  "/dashboard/student/profile": "الملف الشخصي",
  "/dashboard/student/notifications": "الإشعارات",
  "/dashboard/student/ai-assistant": "المساعد الذكي",
  "/dashboard/student/ai-insights": "تحليلات AI",
  "/dashboard/student/flashcards": "بطاقات المراجعة",
}

export default function StudentDashboardHeader() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [searchFocused, setSearchFocused] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Breadcrumb
  const breadcrumbs: { name: string; href: string }[] = []
  breadcrumbs.push({ name: "الرئيسية", href: "/dashboard/student" })
  const segments = pathname.split("/").filter(Boolean)
  let current = ""
  for (const seg of segments) {
    current += "/" + seg
    if (current !== "/dashboard/student") {
      breadcrumbs.push({ name: breadcrumbNames[current] || seg, href: current })
    }
  }

  return (
    <header
      className="ccc-glass-heavy"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        width: "100%",
        height: 72,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="flex items-center justify-between h-full"
        style={{ padding: "0 var(--ccc-space-xl)", maxWidth: "1600px", margin: "0 auto" }}
      >
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          {/* Breadcrumb */}
          <nav className="hidden md:flex items-center gap-1.5" style={{ font: "var(--ccc-caption)" }}>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.href}>
                {idx > 0 && (
                  <ChevronLeft className="w-3.5 h-3.5" style={{ color: "var(--ccn-300)" }} />
                )}
                <Link
                  href={crumb.href}
                  style={{
                    fontWeight: idx === breadcrumbs.length - 1 ? 700 : 500,
                    color: idx === breadcrumbs.length - 1 ? "var(--ccc-500)" : "var(--ccn-500)",
                    textDecoration: "none",
                    transition: "color 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {idx === 0 && <LayoutDashboard className="w-3.5 h-3.5" />}
                  {crumb.name}
                </Link>
              </React.Fragment>
            ))}
          </nav>

          {/* Search */}
          <div className="hidden sm:flex items-center flex-1" style={{ maxWidth: "320px" }}>
            <div style={{
              position: "relative",
              width: "100%",
              transform: searchFocused ? "scale(1.02)" : "scale(1)",
              transition: "transform 0.2s var(--ccc-ease-out)",
            }}>
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ccn-400)", pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="ابحث عن دورات، دروس..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{
                  width: "100%",
                  height: 40,
                  paddingRight: 40,
                  paddingLeft: 16,
                  border: "2px solid transparent",
                  borderRadius: "var(--ccc-radius-lg)",
                  background: "var(--ccn-100)",
                  outline: "none",
                  fontSize: "13px",
                  color: "var(--ccn-900)",
                  transition: "all 0.2s",
                }}
                className="focus:bg-white focus:border-primary-500/30 dark:focus:bg-gray-800"
              />
              {searchFocused && (
                <kbd
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "none",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 6px",
                    borderRadius: "var(--ccc-radius-sm)",
                    background: "var(--ccn-200)",
                    font: "var(--ccc-micro)",
                    color: "var(--ccn-500)",
                  }}
                  className="sm:inline-flex"
                >
                  ⌘K
                </kbd>
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="ccc-btn-icon"
            aria-label="تبديل الوضع"
          >
            <Sun className="w-[18px] h-[18px] text-amber-500 dark:hidden" />
            <Moon className="w-[18px] h-[18px] text-sky-400 hidden dark:block" />
          </button>

          {/* Notifications */}
          <Link
            href="/dashboard/student/notifications"
            className="ccc-btn-icon"
            style={{ position: "relative", textDecoration: "none" }}
          >
            <Bell className="w-[18px] h-[18px]" />
            <span
              style={{
                position: "absolute", top: -2, right: -2,
                width: 18, height: 18, borderRadius: "var(--ccc-radius-full)",
                background: "var(--ccr-500)", color: "#fff",
                font: "var(--ccc-micro)", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 4px rgba(217,48,37,0.3)",
              }}
            >
              3
            </span>
          </Link>

          {/* Settings */}
          <Link
            href="/dashboard/student/profile"
            className="hidden sm:flex ccc-btn-icon"
            style={{ textDecoration: "none" }}
          >
            <Settings className="w-[18px] h-[18px]" style={{ transition: "transform 0.3s" }} />
          </Link>

          {/* Profile Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                paddingRight: 4, paddingLeft: 12, paddingTop: 4, paddingBottom: 4,
                borderRadius: "var(--ccc-radius-lg)",
                background: "var(--ccn-100)", border: "none", cursor: "pointer",
                transition: "all 0.15s",
              }}
              className="hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
            >
              <div className="flex flex-col items-end">
                <span style={{ font: "var(--ccc-label)", color: "var(--ccn-900)", lineHeight: 1.2 }}>أحمد</span>
                <span style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)" }}>مستوى 5</span>
              </div>
              <div
                style={{
                  width: 32, height: 32, borderRadius: "var(--ccc-radius-md)",
                  background: "linear-gradient(135deg, var(--ccc-500), var(--ccs-500))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", font: "var(--ccc-label)", boxShadow: "var(--ccc-shadow-xs)",
                }}
              >
                أ
              </div>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--ccn-400)", transition: "transform 0.2s", transform: showProfileMenu ? "rotate(180deg)" : "rotate(0)" }} />
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                <div
                  style={{
                    position: "absolute", left: 0, top: "100%", marginTop: 8,
                    width: 224, background: "var(--ccn-50)",
                    borderRadius: "var(--ccc-radius-xl)",
                    border: "1px solid var(--ccn-200)",
                    boxShadow: "var(--ccc-shadow-lg)",
                    zIndex: 20, overflow: "hidden",
                    animation: "fadeIn 0.15s var(--ccc-ease-out)",
                  }}
                >
                  <div style={{ padding: "var(--ccc-space-md)", borderBottom: "1px solid var(--ccn-200)" }}>
                    <div style={{ font: "var(--ccc-label)", color: "var(--ccn-900)" }}>أحمد عبد الله</div>
                    <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)", marginTop: 2 }}>ahmed@example.com</div>
                  </div>
                  <div style={{ padding: 8 }}>
                    {[
                      { icon: User, label: "الملف الشخصي", href: "/dashboard/student/profile" },
                      { icon: Sparkles, label: "الإنجازات", href: "/dashboard/student/achievements" },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowProfileMenu(false)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 12px", borderRadius: "var(--ccc-radius-md)",
                            color: "var(--ccn-700)", fontSize: "13px", fontWeight: 500,
                            textDecoration: "none", transition: "all 0.15s",
                          }}
                          className="hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Icon className="w-4 h-4" style={{ color: "var(--ccn-400)" }} />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                  <div style={{ padding: 8, borderTop: "1px solid var(--ccn-200)" }}>
                    <button
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        width: "100%", padding: "10px 12px", borderRadius: "var(--ccc-radius-md)",
                        color: "var(--ccr-500)", fontSize: "13px", fontWeight: 500,
                        border: "none", background: "transparent", cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      className="hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}