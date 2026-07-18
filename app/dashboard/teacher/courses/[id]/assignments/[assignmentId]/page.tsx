import React from "react"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import AssignmentEditClient from "./assignment-edit-client"

interface Props {
  params: Promise<{ id: string; assignmentId: string }>
}

export const dynamic = "force-dynamic"

export default async function AssignmentDetailPage({ params }: Props) {
  const { id, assignmentId } = await params
  const session = await getServerSession()

  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    redirect("/login?unauthorized=true")
  }

  // Fetch assignment details
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
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

  if (!assignment) notFound()

  const teacherId = assignment.module?.course.teacherId || ""
  if (teacherId !== session.id && session.role !== "ADMIN") {
    redirect("/dashboard/teacher/courses?unauthorized=true")
  }

  // Fetch student submissions
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          avatar: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
        <Link href="/dashboard/teacher/courses" className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors">
          إدارة الدورات
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/dashboard/teacher/courses/${id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors">
          {assignment.module?.course.title}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-800 dark:text-slate-200">
          إدارة الواجب الدراسي: {assignment.title}
        </span>
      </div>

      {/* Assignment workspace client component */}
      <AssignmentEditClient 
        assignment={assignment} 
        submissions={submissions}
        courseId={id} 
      />
      
    </div>
  )
}
