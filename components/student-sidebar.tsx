// components/student-sidebar.tsx
"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, BookOpen, FileQuestion, Gamepad2, Trophy,
  Wallet, Bell, Award, User, Users, Target, Sparkles, Brain,
  Layers, ChevronLeft, Menu, X, GraduationCap, Star, ChevronDown,
  Zap, Gift, Shield, ScrollText, ExternalLink, Flame, MessageSquare,
  Activity, BarChart3, Map,
} from "lucide-react"


interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: number
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export default function StudentSidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({ ...prev, [title]: !prev[title] }))
  }

  const mainGroups: NavGroup[] = [
    {
      title: "الرئيسية",
      items: [
        { name: "لوحة التحكم", href: "/dashboard/student", icon: LayoutDashboard },
        { name: "مقرراتي", href: "/dashboard/student/courses", icon: BookOpen },
        { name: "خريطة التعلم", href: "/dashboard/student/roadmap", icon: Map },
        { name: "تحديد المستوى", href: "/dashboard/student/placement", icon: Target },
      ]
    },
    {
      title: "التعلم والتقييم",
      items: [
        { name: "الاختبارات", href: "/dashboard/student/quizzes", icon: FileQuestion },
        { name: "ساحة البرمجة", href: "/dashboard/student/games", icon: Gamepad2 },
        { name: "بطاقات المراجعة", href: "/dashboard/student/flashcards", icon: Layers },
        { name: "الإنجازات", href: "/dashboard/student/achievements", icon: Award },
      ]
    },
    {
      title: "المكافآت والمالية",
      items: [
        { name: "المحفظة الرقمية", href: "/dashboard/student/wallet", icon: Wallet },
        { name: "لوحة الصدارة", href: "/dashboard/student/leaderboard", icon: Trophy },
        { name: "التسويق والإحالات", href: "/dashboard/student/referrals", icon: Gift },
        { name: "الاشتراكات", href: "/dashboard/student/subscription", icon: Shield },
      ]
    },
    {
      title: "الذكاء الاصطناعي",
      items: [
        { name: "المساعد الذكي", href: "/dashboard/student/ai-assistant", icon: Sparkles },
        { name: "تحليلات AI", href: "/dashboard/student/ai-insights", icon: Brain },
      ]
    },
  ]

  const bottomItems: NavItem[] = [
    { name: "الشهادات", href: "/dashboard/student/certificates", icon: ScrollText },
    { name: "الملف الشخصي", href: "/dashboard/student/profile", icon: User },
    { name: "الإشعارات", href: "/dashboard/student/notifications", icon: Bell, badge: 3 },
    { name: "المنصة الاجتماعية", href: "/community", icon: Users },
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard/student") return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="ccc-sidebar-toggle fixed top-4 right-4 z-50 w-10 h-10 items-center justify-center"
        style={{
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--ccn-200)",
          borderRadius: "var(--ccc-radius-lg)",
          boxShadow: "var(--ccc-shadow-md)",
          color: "var(--ccn-800)",
        }}
        aria-label={isMobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 md:top-[72px] right-0 z-40 overflow-y-auto overflow-x-hidden sidebar-scrollbar`}
        style={{
          width: "280px",
          height: "100dvh",
          background: "var(--ccn-50)",
          borderLeft: "1px solid var(--ccn-200)",
          transform: isMobileOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div className="md:hidden" style={{ height: "72px" }} />

        {/* ── Brand Section ── */}
        <div
          className="sticky top-0 z-10"
          style={{
            background: "var(--ccn-50)",
            borderBottom: "1px solid var(--ccn-200)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ padding: "var(--ccc-space-md) var(--ccc-space-lg)" }}>
            <div className="flex items-center gap-3">
              <div style={{
                width: 40, height: 40, borderRadius: "var(--ccc-radius-lg)",
                background: "linear-gradient(135deg, var(--ccc-500), var(--ccs-500))",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(43,76,126,0.2)",
              }}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div style={{ font: "var(--ccc-label)", color: "var(--ccn-900)" }}>مساحة الطالب</div>
                <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-500)" }}>Code Craft Core</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Stats Card ── */}
        <div style={{
          margin: "var(--ccc-space-md)",
          padding: "var(--ccc-space-md)",
          borderRadius: "var(--ccc-radius-lg)",
          background: "linear-gradient(135deg, color-mix(in srgb, var(--ccc-500) 6%, transparent), color-mix(in srgb, var(--ccs-500) 4%, transparent))",
          border: "1px solid color-mix(in srgb, var(--ccc-500) 12%, transparent)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -16, right: -16, width: 64, height: 64, background: "color-mix(in srgb, var(--ccc-500) 8%, transparent)", borderRadius: "50%", filter: "blur(20px)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ width: 32, height: 32, borderRadius: "var(--ccc-radius-md)", background: "linear-gradient(135deg, var(--cca-500), #E08500)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 2px 8px rgba(255,159,28,0.2)" }}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div style={{ font: "var(--ccc-micro)", color: "var(--ccn-500)" }}>المستوى</div>
                  <div style={{ font: "var(--ccc-label)", color: "var(--ccn-900)", fontWeight: 700 }}>5</div>
                </div>
              </div>
              <div style={{ width: 1, height: 32, background: "var(--ccn-200)" }} />
              <div className="flex items-center gap-2">
                <div style={{ width: 32, height: 32, borderRadius: "var(--ccc-radius-md)", background: "linear-gradient(135deg, #F97316, #DC2626)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 2px 8px rgba(249,115,22,0.2)" }}>
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div style={{ font: "var(--ccc-micro)", color: "var(--ccn-500)" }}>التتابع</div>
                  <div style={{ font: "var(--ccc-label)", color: "var(--ccn-900)", fontWeight: 700 }}>12</div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "var(--ccc-space-sm)" }}>
              <div className="flex justify-between" style={{ font: "var(--ccc-micro)", color: "var(--ccn-500)", marginBottom: 4 }}>
                <span>XP</span>
                <span><span style={{ color: "var(--ccc-500)", fontWeight: 700 }}>450</span> / 500</span>
              </div>
              <div style={{ height: 4, background: "var(--ccn-200)", borderRadius: "var(--ccc-radius-full)", overflow: "hidden" }}>
                <div style={{ width: "90%", height: "100%", background: "linear-gradient(90deg, var(--ccc-500), var(--ccs-500))", borderRadius: "var(--ccc-radius-full)", transition: "width 0.7s" }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ padding: "var(--ccc-space-sm) var(--ccc-space-md)" }}>
          {mainGroups.map((group) => {
            const isCollapsed = collapsedGroups[group.title]
            return (
              <div key={group.title} style={{ marginBottom: 2 }}>
                <button
                  onClick={() => toggleGroup(group.title)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "8px 12px", border: "none", background: "transparent",
                    borderRadius: "var(--ccc-radius-md)", cursor: "pointer",
                    font: "var(--ccc-micro)", color: "var(--ccn-500)", letterSpacing: "0.05em",
                    transition: "color 0.15s",
                  }}
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <span>{group.title}</span>
                  <ChevronDown className="w-3.5 h-3.5" style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                </button>

                <div style={{ overflow: "hidden", maxHeight: isCollapsed ? 0 : 400, opacity: isCollapsed ? 0 : 1, transition: "all 0.25s var(--ccc-ease-out)" }}>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px",
                          padding: "10px 12px", borderRadius: "var(--ccc-radius-lg)",
                          textDecoration: "none", position: "relative",
                          background: active ? "color-mix(in srgb, var(--ccc-500) 10%, transparent)" : "transparent",
                          color: active ? "var(--ccc-500)" : "var(--ccn-600)",
                          fontWeight: active ? 600 : 500,
                          fontSize: "14px",
                          transition: "all 0.2s",
                        }}
                        className="group"
                      >
                        {/* Active Indicator */}
                        {active && (
                          <span style={{
                            position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
                            width: 3, height: 20, background: "var(--ccc-500)",
                            borderRadius: "0 var(--ccc-radius-full) var(--ccc-radius-full) 0",
                            boxShadow: "0 0 8px color-mix(in srgb, var(--ccc-500) 40%, transparent)",
                          }} />
                        )}
                        <div style={{
                          width: 36, height: 36, borderRadius: "var(--ccc-radius-lg)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          background: active ? "var(--ccn-50)" : "color-mix(in srgb, var(--ccn-900) 3%, transparent)",
                          boxShadow: active ? "var(--ccc-shadow-xs)" : "none",
                          transition: "all 0.2s",
                        }}
                          className="group-hover:scale-105"
                        >
                          <Icon className="w-[18px] h-[18px]" />
                        </div>
                        <span style={{ flex: 1 }}>{item.name}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span style={{
                            minWidth: 20, height: 20, padding: "0 6px",
                            borderRadius: "var(--ccc-radius-full)",
                            background: "var(--ccr-500)", color: "#fff",
                            font: "var(--ccc-micro)", display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 2px 4px rgba(217,48,37,0.2)",
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        <div style={{ margin: "var(--ccc-space-sm) var(--ccc-space-lg)", borderTop: "1px solid var(--ccn-200)" }} />

        {/* ── Bottom Items ── */}
        <nav style={{ padding: "var(--ccc-space-sm) var(--ccc-space-md)" }}>
          {bottomItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 12px", borderRadius: "var(--ccc-radius-lg)",
                  textDecoration: "none", position: "relative",
                  background: active ? "color-mix(in srgb, var(--ccs-500) 10%, transparent)" : "transparent",
                  color: active ? "var(--ccs-500)" : "var(--ccn-600)",
                  fontWeight: active ? 600 : 500,
                  fontSize: "14px",
                  transition: "all 0.2s",
                }}
                className="group"
              >
                {active && (
                  <span style={{
                    position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: 20, background: "var(--ccs-500)",
                    borderRadius: "0 var(--ccc-radius-full) var(--ccc-radius-full) 0",
                    boxShadow: "0 0 8px color-mix(in srgb, var(--ccs-500) 40%, transparent)",
                  }} />
                )}
                <div style={{
                  width: 36, height: 36, borderRadius: "var(--ccc-radius-lg)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: active ? "var(--ccn-50)" : "color-mix(in srgb, var(--ccn-900) 3%, transparent)",
                  boxShadow: active ? "var(--ccc-shadow-xs)" : "none",
                  transition: "all 0.2s",
                }}
                  className="group-hover:scale-105"
                >
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <span style={{ flex: 1 }}>{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    minWidth: 20, height: 20, padding: "0 6px",
                    borderRadius: "var(--ccc-radius-full)",
                    background: "var(--ccr-500)", color: "#fff",
                    font: "var(--ccc-micro)", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(217,48,37,0.2)",
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── Footer CTA ── */}
        <div style={{
          margin: "var(--ccc-space-md)", padding: "var(--ccc-space-md)",
          borderRadius: "var(--ccc-radius-lg)",
          background: "linear-gradient(135deg, var(--ccc-500), var(--ccc-700))",
          color: "#fff", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -20, left: -20, width: 80, height: 80, background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none", filter: "blur(12px)" }} />
          <div style={{ position: "absolute", bottom: -16, right: -16, width: 60, height: 60, background: "rgba(74,124,89,0.2)", borderRadius: "50%", pointerEvents: "none", filter: "blur(12px)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: "var(--ccc-space-sm)" }}>
              <div style={{ width: 28, height: 28, borderRadius: "var(--ccc-radius-md)", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                <Star className="w-3.5 h-3.5" />
              </div>
              <div style={{ font: "var(--ccc-label)", opacity: 0.9 }}>الوصول السريع</div>
            </div>
            <Link
              href="/courses/marketplace"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "8px 12px", borderRadius: "var(--ccc-radius-md)",
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", textDecoration: "none", font: "var(--ccc-body-sm)",
                transition: "all 0.15s",
                backdropFilter: "blur(4px)",
              }}
              className="hover:bg-white/20"
            >
              <span style={{ fontWeight: 600 }}>تصفح الدورات</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Sidebar padding bottom */}
        <div style={{ height: 24 }} />
      </aside>
    </>
  )
}