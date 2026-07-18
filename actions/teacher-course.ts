"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { guardAction } from "@/lib/action-guard"
import { randomBytes } from "crypto"
import { DifficultyLevel } from "@prisma/client"

// Generate unique course slug
async function generateUniqueCourseSlug(title: string): Promise<string> {
  const baseSlug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "") // support Arabic
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

  let uniqueSlug = baseSlug
  let count = 0

  while (true) {
    const existing = await prisma.course.findUnique({
      where: { slug: uniqueSlug },
    })

    if (!existing) {
      break
    }

    count++
    uniqueSlug = `${baseSlug}-${count}-${randomBytes(2).toString("hex")}`
  }

  return uniqueSlug
}

async function validateTrackHierarchy(data: {
  trackId?: string
}) {
  if (!data.trackId) {
    return { valid: false, error: "يجب ربط الدورة بمسار تعليمي." }
  }

  const track = await prisma.learningTrack.findUnique({
    where: { id: data.trackId },
    select: { id: true },
  })

  if (!track) {
    return { valid: false, error: "المسار التعليمي المحدد غير موجود." }
  }

  return { valid: true }
}

// Fetch all courses owned by current teacher
export async function getTeacherCourses() {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN", "SUPER_ADMIN"], requireApprovedTeacher: true, cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    // Admin can view all, Teacher only their own
    const user = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    const isSystemAdmin = user?.role === "ADMIN"

    const courses = await prisma.course.findMany({
      where: isSystemAdmin ? {} : { teacherId: guard.userId },
      include: {
        modules: {
          include: {
            lessons: true
          }
        },
        reviews: true,
        enrollments: true
      },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, courses }
  } catch (error) {
    console.error("Error in getTeacherCourses:", error)
    return { success: false, error: "فشل جلب الدورات التعليمية." }
  }
}

// Create course with comprehensive fields
export async function createDetailedCourse(data: {
  title: string
  description: string
  coverImage?: string
  priceInCoins: number
  price?: number
  trackId?: string
  level: DifficultyLevel
  language?: string
  requirements?: string
  learningObjectives?: string
  status?: string
}) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN", "SUPER_ADMIN"], requireApprovedTeacher: true, cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    if (!data.title || !data.description) {
      return { success: false, error: "عنوان الدورة والوصف حقول إجبارية." }
    }

    const hierarchyValidation = await validateTrackHierarchy(data)
    if (!hierarchyValidation.valid) {
      return { success: false, error: hierarchyValidation.error }
    }

    const slug = await generateUniqueCourseSlug(data.title)
    const isPublished = data.status === "PUBLISHED"

    const course = await prisma.course.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        coverImage: data.coverImage || null,
        priceInCoins: Number(data.priceInCoins) || 0,
        price: Number(data.price) || 0.0,
        trackId: data.trackId || null,
        level: data.level,
        language: data.language || "العربية",
        requirements: data.requirements || null,
        learningObjectives: data.learningObjectives || null,
        status: data.status || "DRAFT",
        isPublished,
        teacherId: guard.userId
      }
    })

    revalidatePath("/dashboard/teacher/courses")
    revalidatePath("/courses")
    revalidatePath("/")

    return { success: true, courseId: course.id, slug: course.slug }
  } catch (error) {
    console.error("Error in createDetailedCourse:", error)
    return { success: false, error: "فشل إنشاء الدورة التعليمية." }
  }
}

// Update course details
export async function updateCourseDetails(
  courseId: string,
  data: {
    title: string
    description: string
    coverImage?: string
    priceInCoins: number
    price?: number
    trackId?: string
    level: DifficultyLevel
    language?: string
    requirements?: string
    learningObjectives?: string
    status?: string
  }
) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN", "SUPER_ADMIN"], requireApprovedTeacher: true, cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    // Owner validation
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true, isPublished: true }
    })

    if (!existingCourse) {
      return { success: false, error: "الدورة غير موجودة." }
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (existingCourse.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "عذراً، لا تملك صلاحية تعديل هذه الدورة." }
    }

    const isPublished = data.status === "PUBLISHED"

    const hierarchyValidation = await validateTrackHierarchy(data)
    if (!hierarchyValidation.valid) {
      return { success: false, error: hierarchyValidation.error }
    }

    await prisma.course.update({
      where: { id: courseId },
      data: {
        title: data.title,
        description: data.description,
        coverImage: data.coverImage || null,
        priceInCoins: Number(data.priceInCoins) || 0,
        price: Number(data.price) || 0.0,
        trackId: data.trackId || null,
        level: data.level,
        language: data.language || "العربية",
        requirements: data.requirements || null,
        learningObjectives: data.learningObjectives || null,
        status: data.status || "DRAFT",
        isPublished
      }
    })

    revalidatePath(`/courses/${courseId}`)
    revalidatePath("/dashboard/teacher/courses")
    revalidatePath("/courses")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error in updateCourseDetails:", error)
    return { success: false, error: "فشل تحديث بيانات الدورة." }
  }
}

// Change Course Status
export async function changeCourseStatus(courseId: string, status: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN", "SUPER_ADMIN"], requireApprovedTeacher: true, cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true }
    })

    if (!course) return { success: false, error: "الدورة غير موجودة." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (course.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بتغيير حالة هذه الدورة." }
    }

    const isPublished = status === "PUBLISHED"

    await prisma.course.update({
      where: { id: courseId },
      data: { status, isPublished }
    })

    revalidatePath("/dashboard/teacher/courses")
    revalidatePath("/courses")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error in changeCourseStatus:", error)
    return { success: false, error: "فشل تغيير حالة الدورة." }
  }
}

// Delete Course
export async function deleteCourse(courseId: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN", "SUPER_ADMIN"], requireApprovedTeacher: true, cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true }
    })

    if (!course) return { success: false, error: "الدورة غير موجودة." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (course.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بحذف هذه الدورة." }
    }

    await prisma.course.delete({
      where: { id: courseId }
    })

    revalidatePath("/dashboard/teacher/courses")
    revalidatePath("/courses")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error in deleteCourse:", error)
    return { success: false, error: "فشل حذف الدورة التعليمية." }
  }
}

// Module / Section actions
export async function createModule(courseId: string, title: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN", "SUPER_ADMIN"], requireApprovedTeacher: true, cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true, modules: { select: { order: true } } }
    })

    if (!course) return { success: false, error: "الدورة غير موجودة." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (course.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بإضافة وحدات لهذه الدورة." }
    }

    const nextOrder = course.modules.length > 0 
      ? Math.max(...course.modules.map(m => m.order)) + 1 
      : 1

    const newModule = await prisma.module.create({
      data: {
        title,
        order: nextOrder,
        courseId
      }
    })

    revalidatePath("/dashboard/teacher/courses")

    return { success: true, moduleId: newModule.id }
  } catch (error) {
    console.error("Error in createModule:", error)
    return { success: false, error: "فشل إضافة الوحدة." }
  }
}

export async function updateModule(moduleId: string, title: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN", "SUPER_ADMIN"], requireApprovedTeacher: true, cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: { select: { teacherId: true } } }
    })

    if (!mod) return { success: false, error: "الوحدة غير موجودة." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (mod.course.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بتعديل هذه الوحدة." }
    }

    await prisma.module.update({
      where: { id: moduleId },
      data: { title }
    })

    revalidatePath("/dashboard/teacher/courses")

    return { success: true }
  } catch (error) {
    console.error("Error in updateModule:", error)
    return { success: false, error: "فشل تعديل الوحدة." }
  }
}

export async function deleteModule(moduleId: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN", "SUPER_ADMIN"], requireApprovedTeacher: true, cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: { select: { teacherId: true } } }
    })

    if (!mod) return { success: false, error: "الوحدة غير موجودة." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (mod.course.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بحذف هذه الوحدة." }
    }

    await prisma.module.delete({
      where: { id: moduleId }
    })

    revalidatePath("/dashboard/teacher/courses")

    return { success: true }
  } catch (error) {
    console.error("Error in deleteModule:", error)
    return { success: false, error: "فشل حذف الوحدة." }
  }
}

// Reordering Sections
export async function updateModuleOrder(courseId: string, moduleIds: string[]) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN", "SUPER_ADMIN"], requireApprovedTeacher: true, cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true }
    })

    if (!course) return { success: false, error: "الدورة غير موجودة." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (course.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بإعادة ترتيب هذه الدورة." }
    }

    // Update using transaction
    await prisma.$transaction(
      moduleIds.map((id, index) =>
        prisma.module.update({
          where: { id },
          data: { order: index + 1 }
        })
      )
    )

    revalidatePath("/dashboard/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Error in updateModuleOrder:", error)
    return { success: false, error: "فشل إعادة ترتيب الوحدات." }
  }
}

// Reordering Lessons
export async function updateLessonOrder(moduleId: string, lessonIds: string[]) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN", "SUPER_ADMIN"], requireApprovedTeacher: true, cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: { select: { teacherId: true } } }
    })

    if (!mod) return { success: false, error: "الوحدة غير موجودة." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (mod.course.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بإعادة ترتيب الدروس." }
    }

    // Update using transaction
    await prisma.$transaction(
      lessonIds.map((id, index) =>
        prisma.lesson.update({
          where: { id },
          data: { order: index + 1 }
        })
      )
    )

    revalidatePath("/dashboard/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Error in updateLessonOrder:", error)
    return { success: false, error: "فشل إعادة ترتيب الدروس." }
  }
}
