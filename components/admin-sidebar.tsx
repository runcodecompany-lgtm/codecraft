'use client'

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  HelpCircle,
  Gamepad2,
  Award,
  Bell,
  Star,
  BarChart3,
  Shield,
  Settings,
  Coins,
  Activity,
  MessageSquare,
  Image,
  FolderOpen,
  UserCheck,
  ShieldAlert,
  MessagesSquare,
  Network,
  Brain
} from "lucide-react"

export default function AdminSidebar() {
  const pathname = usePathname()

  const menuGroups = [
    {
      title: "الرئيسية",
      items: [
        { name: "لوحة التحكم", href: "/dashboard/admin", icon: LayoutDashboard },
      ]
    },
    {
      title: "إدارة المستخدمين",
      items: [
        { name: "جميع المستخدمين", href: "/dashboard/admin/users", icon: Users },
        { name: "المعلمون", href: "/dashboard/admin/teachers", icon: UserCheck },
        { name: "طلبات اعتماد المعلمين", href: "/dashboard/admin/teacher-applications", icon: FileText },
        { name: "الأدوار والصلاحيات", href: "/dashboard/admin/roles", icon: Shield },
      ]
    },
    {
      title: "إدارة المحتوى",
      items: [
        { name: "المسارات التعليمية", href: "/dashboard/admin/tracks", icon: Network },
        { name: "الدورات", href: "/dashboard/admin/courses", icon: BookOpen },
        { name: "المقالات", href: "/dashboard/admin/articles", icon: FileText },
        { name: "أقسام المنتدى", href: "/dashboard/admin/forums", icon: MessagesSquare },
        { name: "الملفات والوسائط", href: "/dashboard/admin/media", icon: Image },
      ]
    },
    {
      title: "إدارة التقييم",
      items: [
        { name: "الاختبارات", href: "/dashboard/admin/quizzes", icon: HelpCircle },
        { name: "الألعاب", href: "/dashboard/admin/games", icon: Gamepad2 },
        { name: "الشهادات", href: "/dashboard/admin/certificates", icon: Award },
        { name: "الإنجازات", href: "/dashboard/admin/achievements", icon: Star },
      ]
    },
    {
      title: "الذكاء الاصطناعي",
      items: [
        { name: "تحليلات AI والمراقبة", href: "/dashboard/admin/ai-analytics", icon: Brain },
      ]
    },
    {
      title: "الإدارة المالية",
      items: [
        { name: "المدفوعات والاشتراكات", href: "/dashboard/admin/financials", icon: Coins },
      ]
    },
    {
      title: "النظام والتحكم",
      items: [
        { name: "العملات و XP", href: "/dashboard/admin/coins", icon: Coins },
        { name: "الإشعارات", href: "/dashboard/admin/notifications", icon: Bell },
        { name: "البلاغات", href: "/dashboard/admin/reports", icon: Activity },
        { name: "التعليقات", href: "/dashboard/admin/comments", icon: MessageSquare },
        { name: "سجل التدقيق", href: "/dashboard/admin/audit-logs", icon: FolderOpen },
      ]
    },
    {
      title: "الإعدادات",
      items: [
        { name: "التحليلات", href: "/dashboard/admin/analytics", icon: BarChart3 },
        { name: "مراقبة الأمان", href: "/dashboard/admin/security", icon: ShieldAlert },
        { name: "إعدادات المنصة", href: "/dashboard/admin/settings", icon: Settings },
      ]
    },
  ]

  return (
    <aside className="w-full md:w-72 flex-shrink-0 border-l border-gray-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-950 md:min-h-[calc(100vh-4rem)] overflow-y-auto transition-all">
      <div className="p-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-400/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold mb-2">
          <ShieldAlert className="h-3 w-3" />
          <span>لوحة الإدارة</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          Code Craft Core
        </p>
      </div>

      <nav className="px-4 pb-6 space-y-6">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              {group.title}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = item.href === "/dashboard/admin"
                ? pathname === item.href
                : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-slate-200"
                    }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "text-rose-600 dark:text-rose-400" : "text-gray-500 dark:text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
