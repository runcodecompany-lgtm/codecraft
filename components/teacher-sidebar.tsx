// components/teacher-sidebar.tsx
"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Users,
  Star,
  BarChart3,
  UserSquare2,
  Bell,
  Sparkles,
  Brain,
  Wallet
} from "lucide-react"

export default function TeacherSidebar() {
  const pathname = usePathname()

  const menuItems = [
    { name: "الرئيسية", href: "/dashboard/teacher", icon: LayoutDashboard },
    { name: "إدارة الدورات", href: "/dashboard/teacher/courses", icon: BookOpen },
    { name: "بنك الأسئلة", href: "/dashboard/teacher/question-bank", icon: HelpCircle },
    { name: "متابعة الطلاب", href: "/dashboard/teacher/students", icon: Users },
    { name: "التقييمات والمراجعات", href: "/dashboard/teacher/reviews", icon: Star },
    { name: "الإحصائيات والتحليلات", href: "/dashboard/teacher/analytics", icon: BarChart3 },
    { name: "الإشعارات", href: "/dashboard/teacher/notifications", icon: Bell },
    { name: "الملف الشخصي", href: "/dashboard/teacher/profile", icon: UserSquare2 },
    { name: "الأرباح والمحفظة", href: "/dashboard/teacher/earnings", icon: Wallet },
  ]

  const aiItems = [
    { name: "أدوات الذكاء الاصطناعي", href: "/dashboard/teacher/ai-tools", icon: Sparkles },
    { name: "تحليل الطلاب بالذكاء الاصطناعي", href: "/dashboard/teacher/ai-analytics", icon: Brain },
  ]

  return (
    <aside className="w-full md:w-64 flex-shrink-0 border-l border-gray-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-950 md:min-h-[calc(100vh-4rem)] transition-all">
      <div className="p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          لوحة تحكم المعلم
        </p>
      </div>

      <nav className="px-4 pb-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === "/dashboard/teacher"
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-slate-200"
                }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-6 border-t border-gray-100 dark:border-slate-900/60">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          الذكاء الاصطناعي
        </p>
      </div>
      <nav className="px-4 pb-6 space-y-1">
        {aiItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                ? "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-slate-200"
                }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
