"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { guardAction } from "@/lib/action-guard"

// Fetch teacher profile
export async function getTeacherProfile(userId: string) {
  try {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId }
    })
    return { success: true, profile }
  } catch (error) {
    console.error("Error in getTeacherProfile:", error)
    return { success: false, error: "فشل جلب الملف الشخصي للمعلم." }
  }
}

// Create or update teacher profile
export async function updateTeacherProfile(data: {
  title?: string
  bio?: string
  skills?: string // Comma-separated
  experience?: Array<{ period: string; role: string }>
  achievements?: string[]
  socialLinks?: { github?: string; linkedin?: string; twitter?: string; website?: string }
  avatar?: string
}) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const userId = guard.userId

    const existing = await prisma.teacherProfile.findUnique({
      where: { userId }
    })

    // Update user avatar if provided
    if (data.avatar) {
      await prisma.user.update({
        where: { id: userId },
        data: { avatar: data.avatar }
      })
    }

    if (existing) {
      await prisma.teacherProfile.update({
        where: { userId },
        data: {
          title: data.title || null,
          bio: data.bio || null,
          skills: data.skills || null,
          experience: data.experience ? JSON.parse(JSON.stringify(data.experience)) : null,
          achievements: data.achievements ? JSON.parse(JSON.stringify(data.achievements)) : null,
          socialLinks: data.socialLinks ? JSON.parse(JSON.stringify(data.socialLinks)) : null
        }
      })
    } else {
      await prisma.teacherProfile.create({
        data: {
          userId,
          title: data.title || null,
          bio: data.bio || null,
          skills: data.skills || null,
          experience: data.experience ? JSON.parse(JSON.stringify(data.experience)) : null,
          achievements: data.achievements ? JSON.parse(JSON.stringify(data.achievements)) : null,
          socialLinks: data.socialLinks ? JSON.parse(JSON.stringify(data.socialLinks)) : null
        }
      })
    }

    revalidatePath("/teachers")
    revalidatePath(`/teachers/${userId}`)
    revalidatePath("/dashboard/teacher/profile")

    return { success: true }
  } catch (error) {
    console.error("Error in updateTeacherProfile:", error)
    return { success: false, error: "فشل تحديث ملف المعلم." }
  }
}
