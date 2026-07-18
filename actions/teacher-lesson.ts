"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { guardAction } from "@/lib/action-guard"

// Create Lesson
export async function createLesson(
  moduleId: string,
  data: {
    title: string
    content?: string
    videoUrl?: string
    duration: number
    type: "VIDEO" | "TEXT" | "RESOURCE" | "BOTH"
    videoSize?: number
  }
) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: { select: { teacherId: true } } }
    })

    if (!mod) return { success: false, error: "الوحدة التعليمية غير موجودة." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (mod.course.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بإضافة دروس إلى هذه الدورة." }
    }

    // Determine order
    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      select: { order: true }
    })
    const nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order)) + 1 : 1

    const videoProcessingStatus = data.videoUrl ? "PROCESSING" : "READY"

    const lesson = await prisma.lesson.create({
      data: {
        title: data.title,
        content: data.content || null,
        videoUrl: data.videoUrl || null,
        duration: Number(data.duration) || 10,
        type: data.type || "VIDEO",
        videoSize: data.videoSize ? Number(data.videoSize) : null,
        videoDuration: data.type === "VIDEO" && data.videoUrl ? Number(data.duration) * 60 : null,
        videoProcessingStatus,
        order: nextOrder,
        moduleId
      }
    })

    // Simulate async video processing if URL is provided
    if (data.videoUrl) {
      // Background simulation to set READY in database after a short delay
      setTimeout(async () => {
        try {
          await prisma.lesson.update({
            where: { id: lesson.id },
            data: { videoProcessingStatus: "READY" }
          })
        } catch (e) {
          console.error("Simulation error", e)
        }
      }, 5000)
    }

    revalidatePath("/dashboard/teacher/courses")
    return { success: true, lessonId: lesson.id }
  } catch (error) {
    console.error("Error in createLesson:", error)
    return { success: false, error: "فشل إنشاء الدرس." }
  }
}

// Update Lesson
export async function updateLesson(
  lessonId: string,
  data: {
    title: string
    content?: string
    videoUrl?: string
    duration: number
    type: "VIDEO" | "TEXT" | "RESOURCE" | "BOTH"
    videoSize?: number
    videoProcessingStatus?: string
  }
) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: { select: { teacherId: true } } } } }
    })

    if (!lesson) return { success: false, error: "الدرس غير موجود." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (lesson.module.course.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بتعديل هذا الدرس." }
    }

    // Determine processing status: if video URL changed, reprocess
    let processingStatus = data.videoProcessingStatus || lesson.videoProcessingStatus
    if (data.videoUrl && data.videoUrl !== lesson.videoUrl) {
      processingStatus = "PROCESSING"

      // Trigger simulation
      setTimeout(async () => {
        try {
          await prisma.lesson.update({
            where: { id: lessonId },
            data: { videoProcessingStatus: "READY" }
          })
        } catch (e) {
          console.error("Simulation error", e)
        }
      }, 5000)
    }

    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: data.title,
        content: data.content || null,
        videoUrl: data.videoUrl || null,
        duration: Number(data.duration) || 10,
        type: data.type,
        videoSize: data.videoSize ? Number(data.videoSize) : null,
        videoDuration: data.type === "VIDEO" && data.videoUrl ? Number(data.duration) * 60 : null,
        videoProcessingStatus: processingStatus
      }
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Error in updateLesson:", error)
    return { success: false, error: "فشل تحديث الدرس." }
  }
}

// Delete Lesson
export async function deleteLesson(lessonId: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: { select: { teacherId: true } } } } }
    })

    if (!lesson) return { success: false, error: "الدرس غير موجود." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (lesson.module.course.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بحذف هذا الدرس." }
    }

    await prisma.lesson.delete({
      where: { id: lessonId }
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteLesson:", error)
    return { success: false, error: "فشل حذف الدرس." }
  }
}

// Lesson Resources (File attachments CRUD)
export async function addLessonResource(
  lessonId: string,
  data: {
    name: string
    url: string
    type: string
    size: number
  }
) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: { select: { teacherId: true } } } } }
    })

    if (!lesson) return { success: false, error: "الدرس غير موجود." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (lesson.module.course.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بإضافة ملفات مرفقة لهذا الدرس." }
    }

    const resource = await prisma.lessonResource.create({
      data: {
        lessonId,
        name: data.name,
        url: data.url,
        type: data.type,
        size: Number(data.size) || 0
      }
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true, resourceId: resource.id }
  } catch (error) {
    console.error("Error in addLessonResource:", error)
    return { success: false, error: "فشل إضافة الملف المرفق." }
  }
}

// Delete Lesson Resource
export async function deleteLessonResource(resourceId: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const resource = await prisma.lessonResource.findUnique({
      where: { id: resourceId },
      include: { lesson: { include: { module: { include: { course: { select: { teacherId: true } } } } } } }
    })

    if (!resource) return { success: false, error: "الملف المرفق غير موجود." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (resource.lesson.module.course.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بحذف ملفات هذا الدرس." }
    }

    await prisma.lessonResource.delete({
      where: { id: resourceId }
    })

    revalidatePath("/dashboard/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteLessonResource:", error)
    return { success: false, error: "فشل حذف الملف المرفق." }
  }
}
