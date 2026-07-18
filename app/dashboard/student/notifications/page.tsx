// app/dashboard/student/notifications/page.tsx
"use client"

import React, { useEffect, useState } from "react"
import { Bell, Check, CheckCheck, Loader2, AlertCircle, Calendar } from "lucide-react"
import { fetchMyNotificationsAction, markAsReadAction, markAllAsReadAction } from "@/actions/notifications"

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date | string
}

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadNotifications = async () => {
    try {
      const res = await fetchMyNotificationsAction()
      if (res.error) {
        setError(res.error)
      } else if (res.notifications) {
        setNotifications(res.notifications as NotificationItem[])
      }
    } catch {
      setError("فشل في تحميل الإشعارات.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await markAsReadAction(id)
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllAsRead = async () => {
    setActionLoading(true)
    try {
      const res = await markAllAsReadAction()
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            مركز الإشعارات
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            تابع آخر تنبيهات وتحديثات حسابك في منصة Code Craft Core.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200/80 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Main notifications container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            جاري تحميل الإشعارات...
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-16 text-center dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center dark:bg-slate-800 mb-4">
            <Bell className="w-6 h-6 text-gray-400 dark:text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            لا توجد إشعارات حالياً
          </h3>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            سنقوم بإعلامك فور وصول تحديثات جديدة أو إنجازات.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start justify-between gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                notification.isRead
                  ? "bg-white/50 border-gray-200/70 text-slate-700 dark:bg-slate-900/30 dark:border-slate-800/60 dark:text-slate-300"
                  : "bg-white border-indigo-200 dark:bg-slate-900 dark:border-indigo-900/40 shadow-sm"
              }`}
            >
              <div className="flex gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    notification.isRead
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-sm font-bold ${
                        notification.isRead
                          ? "text-slate-700 dark:text-slate-300"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {notification.title}
                    </h4>
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(notification.createdAt).toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {!notification.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  title="تحديد كمقروء"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all dark:border-slate-800 dark:text-slate-500 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
