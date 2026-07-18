"use server"

import prisma from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"
import { evaluateAccess } from "@/lib/identity-governance"

export interface LessonInput {
  title: string
  content?: string
  videoUrl?: string
  duration: number
}

export interface ModuleInput {
  title: string
  lessons: LessonInput[]
}

export interface CourseInput {
  title: string
  description: string
  coverImage?: string
  priceInCoins: number
  isPublished?: boolean
  modules: ModuleInput[]
}

// Generate an elegant, URL-friendly slug and guarantee uniqueness
async function generateUniqueCourseSlug(title: string): Promise<string> {
  const baseSlug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "") // support Arabic characters
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

/**
 * Server Action to create a full nested Course structure (Course -> Modules -> Lessons)
 * Access restricted to GUEST/STUDENT: only TEACHER & ADMIN are allowed.
 */
export async function createNestedCourse(input: CourseInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "يجب تسجيل الدخول أولاً لإجراء هذه العملية." }
    }

    // Auth role validation
    const access = await evaluateAccess(user.id, {
      allowedRoles: ["TEACHER", "ADMIN", "SUPER_ADMIN"],
      requireEmailVerified: true,
      requireApprovedTeacher: true,
    })

    if (!access.ok) {
      return { success: false, error: access.error }
    }

    if (!input.title || !input.description) {
      return { success: false, error: "عنوان الدورة والوصف حقول إجبارية." }
    }

    const uniqueSlug = await generateUniqueCourseSlug(input.title)

    // Insert within a transaction
    const newCourse = await prisma.course.create({
      data: {
        title: input.title,
        slug: uniqueSlug,
        description: input.description,
        coverImage: input.coverImage || null,
        priceInCoins: input.priceInCoins || 0,
        isPublished: input.isPublished || false,
        teacherId: user.id,
        modules: {
          create: input.modules.map((mod, modIdx) => ({
            title: mod.title,
            order: modIdx + 1,
            lessons: {
              create: mod.lessons.map((les, lesIdx) => ({
                title: les.title,
                content: les.content || null,
                videoUrl: les.videoUrl || null,
                order: lesIdx + 1,
                duration: les.duration || 10,
              })),
            },
          })),
        },
      },
      select: { id: true, slug: true },
    })

    revalidatePath("/dashboard/teacher/courses")
    revalidatePath("/")

    return { success: true, courseId: newCourse.id, slug: newCourse.slug }
  } catch (error) {
    console.error("Error creating nested course:", error)
    return { success: false, error: "حدث خطأ أثناء حفظ الدورة في قاعدة البيانات." }
  }
}
