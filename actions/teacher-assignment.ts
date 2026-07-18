"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { guardAction } from "@/lib/action-guard"

// Create Assignment
export async function createAssignment(
  moduleId: string | null,
  lessonId: string | null,
  data: {
    title: string
    description: string
    dueDate: Date
    points: number
  }
) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    if (!moduleId && !lessonId) {
      return { success: false, error: "يجب ربط الواجب بوحدة أو درس." }
    }

    let courseTeacherId = ""
    if (moduleId) {
      const mod = await prisma.module.findUnique({
        where: { id: moduleId },
        include: { course: { select: { teacherId: true } } }
      })
      courseTeacherId = mod?.course.teacherId || ""
    } else if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId! },
        include: { module: { include: { course: { select: { teacherId: true } } } } }
      })
      courseTeacherId = lesson?.module.course.teacherId || ""
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (courseTeacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بإضافة واجبات إلى هذه الدورة." }
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        points: Number(data.points) || 100,
        moduleId,
        lessonId
      }
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true, assignmentId: assignment.id }
  } catch (error) {
    console.error("Error in createAssignment:", error)
    return { success: false, error: "فشل إنشاء الواجب." }
  }
}

// Update Assignment
export async function updateAssignment(
  assignmentId: string,
  data: {
    title: string
    description: string
    dueDate: Date
    points: number
  }
) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        module: { include: { course: { select: { teacherId: true } } } },
        lesson: { include: { module: { include: { course: { select: { teacherId: true } } } } } }
      }
    })

    if (!assignment) return { success: false, error: "الواجب غير موجود." }

    const teacherId = assignment.module?.course.teacherId || assignment.lesson?.module.course.teacherId || ""
    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بتعديل هذا الواجب." }
    }

    await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        points: Number(data.points) || 100
      }
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Error in updateAssignment:", error)
    return { success: false, error: "فشل تحديث الواجب." }
  }
}

// Delete Assignment
export async function deleteAssignment(assignmentId: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        module: { include: { course: { select: { teacherId: true } } } },
        lesson: { include: { module: { include: { course: { select: { teacherId: true } } } } } }
      }
    })

    if (!assignment) return { success: false, error: "الواجب غير موجود." }

    const teacherId = assignment.module?.course.teacherId || assignment.lesson?.module.course.teacherId || ""
    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بحذف هذا الواجب." }
    }

    await prisma.assignment.delete({
      where: { id: assignmentId }
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteAssignment:", error)
    return { success: false, error: "فشل حذف الواجب." }
  }
}

// Get Assignment Submissions
export async function getAssignmentSubmissions(assignmentId: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, submissions }
  } catch (error) {
    console.error("Error in getAssignmentSubmissions:", error)
    return { success: false, error: "فشل جلب تسسليمات الطلاب." }
  }
}

// Grade Assignment Submission
export async function gradeSubmission(
  submissionId: string,
  grade: number,
  feedback?: string
) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            module: { include: { course: { select: { teacherId: true } } } },
            lesson: { include: { module: { include: { course: { select: { teacherId: true } } } } } }
          }
        }
      }
    })

    if (!submission) return { success: false, error: "التسليم غير موجود." }

    const teacherId = submission.assignment.module?.course.teacherId || submission.assignment.lesson?.module.course.teacherId || ""
    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بتقييم هذا التسليم." }
    }

    if (grade > submission.assignment.points) {
      return { success: false, error: `الدرجة المدخلة أكبر من الدرجة الكلية للواجب وهي ${submission.assignment.points}` }
    }

    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade: Number(grade),
        feedback: feedback || null,
        status: "GRADED"
      }
    })

    // Notify student about grade (using base createNotification function)
    const { createNotification } = await import("@/lib/foundation")
    await createNotification(
      submission.userId,
      `تم تقييم واجبك: ${submission.assignment.title}`,
      `لقد حصلت على درجة ${grade} من ${submission.assignment.points} في الواجب. تفقد الواجب لرؤية ملاحظات المعلم.`,
      "COURSE"
    )

    revalidatePath("/dashboard/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Error in gradeSubmission:", error)
    return { success: false, error: "فشل رصد درجة الواجب." }
  }
}

// Student Action: Submit Assignment
export async function submitAssignment(assignmentId: string, content: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["STUDENT", "TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) return { success: false, error: "الواجب غير موجود." }

    // Create or update submission
    const existing = await prisma.assignmentSubmission.findFirst({
      where: { assignmentId, userId: guard.userId }
    })

    if (existing) {
      await prisma.assignmentSubmission.update({
        where: { id: existing.id },
        data: {
          content,
          status: "SUBMITTED",
          grade: null,
          feedback: null
        }
      })
    } else {
      await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          userId: guard.userId,
          content,
          status: "SUBMITTED"
        }
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error in submitAssignment:", error)
    return { success: false, error: "فشل تسليم الواجب." }
  }
}
