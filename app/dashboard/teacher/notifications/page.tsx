import React from "react"
import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { Bell, CheckCircle, Info, Award, BookOpen, Star, Users, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TeacherNotificationsPage() {
    const session = await getServerSession()

    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        redirect("/login?unauthorized=true")
    }

    const notifications = await prisma.notification.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        take: 50
    })

    const unreadCount = notifications.filter(n => !n.isRead).length

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "COURSE": return <BookOpen className="w-4 h-4 text-indigo-500" />
            case "COIN": return <Award className="w-4 h-4 text-amber-500" />
            case "SYSTEM": return <Info className="w-4 h-4 text-slate-500" />
            case "CERTIFICATE": return <Star className="w-4 h-4 text-emerald-500" />
            default: return <Bell className="w-4 h-4 text-gray-500" />
        }
    }

    return (
        <div className="space-y-8 text-right" dir="rtl">

            {/* Title */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-7 h-7 text-indigo-500" />
                        <span>الإشعارات</span>
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {unreadCount > 0
                            ? `لديك ${unreadCount} إشعار غير مقروء`
                            : "جميع الإشعارات مقروءة"}
                    </p>
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                    <Bell className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto" />
                    <p className="text-sm font-bold text-gray-400 dark:text-slate-500">لا توجد إشعارات حتى الآن</p>
                    <p className="text-xs text-gray-400 dark:text-slate-600">ستظهر هنا الإشعارات المتعلقة بدوراتك وطلابك وتقييماتهم.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`rounded-2xl border p-5 transition-all ${notif.isRead
                                    ? "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950"
                                    : "border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm"
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-900 flex items-center justify-center shrink-0">
                                    {getTypeIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-sm leading-snug ${notif.isRead ? "font-semibold text-gray-700 dark:text-slate-300" : "font-black text-gray-900 dark:text-white"}`}>
                                        {notif.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed">{notif.message}</p>
                                    <span className="block text-[10px] text-gray-400 dark:text-slate-600 mt-2">
                                        {new Date(notif.createdAt).toLocaleDateString("ar-EG", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </span>
                                </div>
                                {!notif.isRead && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    )
}