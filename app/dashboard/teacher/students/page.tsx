import React from "react"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, Search, Percent, Calendar, BookOpen, HelpCircle } from "lucide-react"
import StudentTrackingClient from "./student-tracking-client"

export const dynamic = "force-dynamic"

export default async function TeacherStudentsPage() {
  const session = await getServerSession()

  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    redirect("/login?unauthorized=true")
  }

  const isSystemAdmin = session.role === "ADMIN"

  // Fetch all enrollments for this teacher's courses
  const enrollments = await prisma.enrollment.findMany({
    where: isSystemAdmin ? {} : {
      course: { teacherId: session.id }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          xp: true,
          level: true
        }
      },
      course: {
        select: {
          id: true,
          title: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  // Fetch quiz attempts for the course enrollments users
  const userIds = Array.from(new Set(enrollments.map(e => e.userId)))
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId: { in: userIds } },
    include: {
      quiz: {
        select: {
          title: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      
      {/* Title */}
      <div className="pb-4 border-b border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-7 h-7 text-indigo-500" />
          <span>متابعة الطلاب المسجلين</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">تتبع نسب تقدم طلابك، ونتائج اختباراتهم التفاعلية، وتواريخ تسجيلهم.</p>
      </div>

      {/* Interactive tracking client */}
      <StudentTrackingClient enrollments={enrollments} quizAttempts={quizAttempts} />

    </div>
  )
}
