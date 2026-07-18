import React from "react"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import LessonEditClient from "./lesson-edit-client"

interface Props {
  params: Promise<{ id: string; lessonId: string }>
}

export const dynamic = "force-dynamic"

export default async function LessonDetailPage({ params }: Props) {
  const { id, lessonId } = await params
  const session = await getServerSession()

  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    redirect("/login?unauthorized=true")
  }

  // Fetch lesson with attached resources
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      resources: true,
      module: {
        select: {
          id: true,
          title: true,
          course: {
            select: {
              id: true,
              title: true,
              teacherId: true
            }
          }
        }
      }
    }
  })

  if (!lesson) notFound()

  // Validate teacher ownership
  if (lesson.module.course.teacherId !== session.id && session.role !== "ADMIN") {
    redirect("/dashboard/teacher/courses?unauthorized=true")
  }

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
        <Link href="/dashboard/teacher/courses" className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors">
          إدارة الدورات
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/dashboard/teacher/courses/${id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors">
          {lesson.module.course.title}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-800 dark:text-slate-200">
          تعديل الدرس: {lesson.title}
        </span>
      </div>

      {/* Lesson Edit Client Workspace */}
      <LessonEditClient lesson={lesson} courseId={id} />
      
    </div>
  )
}
