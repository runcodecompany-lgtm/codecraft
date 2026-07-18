// app/dashboard/teacher/layout.tsx
import React from "react"
import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import TeacherSidebar from "@/components/teacher-sidebar"

export const dynamic = "force-dynamic"

export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  // Enforce teacher authentication check
  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/login?unauthorized=true")
  }

  if (session.role === "TEACHER" && session.teacherProfile?.applicationStatus !== "APPROVED") {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 p-6 dark:bg-slate-900/10" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">طلب المعلم قيد المراجعة</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            لا يمكن إنشاء الدورات أو الاختبارات أو نشر المحتوى قبل اعتماد الإدارة. يمكنك تحديث ملفك ورفع الوثائق المطلوبة ثم انتظار قرار المراجعة.
          </p>
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            الحالة الحالية: {session.teacherProfile?.applicationStatus || "PENDING"}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 dark:bg-slate-900/10" dir="rtl">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row gap-0">
        <TeacherSidebar />
        <main className="flex-grow p-6 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
