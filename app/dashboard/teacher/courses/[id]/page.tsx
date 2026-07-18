import React from "react"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import CourseStructureClient from "./course-structure-client"

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession()

  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    redirect("/login?unauthorized=true")
  }

  // Fetch course details with modules, lessons, quizzes, and assignments
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      track: {
        select: {
          id: true,
          name: true,
          parentId: true,
          parent: {
            select: { id: true, name: true, parentId: true }
          }
        }
      },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" }
          },
          quizzes: true,
          assignments: true
        }
      }
    }
  })

  if (!course) notFound()

  // Validate teacher ownership
  if (course.teacherId !== session.id && session.role !== "ADMIN") {
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
        <span className="font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[200px]">
          {course.title}
        </span>
      </div>

      {/* Client Structure Builder */}
      <CourseStructureClient course={course} />
      
    </div>
  )
}
