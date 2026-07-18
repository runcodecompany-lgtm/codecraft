"use server"

import prisma from "@/lib/prisma"
import { reviewTeacherApplication, submitTeacherApplication } from "@/lib/identity-governance"
import { guardAction } from "@/lib/action-guard"
import { revalidatePath } from "next/cache"

export async function submitCurrentTeacherApplication() {
  const guard = await guardAction({
    allowedRoles: ["TEACHER"],
    requireEmailVerified: true,
    cooldownMs: 0,
  })
  if (!guard.ok) return { success: false, error: guard.error }

  const result = await submitTeacherApplication(guard.userId)
  if (!result.ok) return { success: false, error: result.error }

  revalidatePath("/dashboard/teacher")
  revalidatePath("/dashboard/admin/teacher-applications")
  return { success: true }
}

export async function reviewTeacherApplicationAction(data: {
  applicationId: string
  status: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "SUSPENDED"
  reviewerNotes?: string
  requestedChanges?: string
}) {
  const guard = await guardAction({
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
    requireEmailVerified: false,
    cooldownMs: 0,
  })
  if (!guard.ok) return { success: false, error: guard.error }

  const result = await reviewTeacherApplication({
    applicationId: data.applicationId,
    reviewerId: guard.userId,
    status: data.status,
    reviewerNotes: data.reviewerNotes,
    requestedChanges: data.requestedChanges,
  })

  if (!result.ok) return { success: false, error: result.error }

  revalidatePath("/dashboard/admin/teacher-applications")
  revalidatePath("/teachers")
  return { success: true }
}

export async function getTeacherApplicationsForAdmin(query?: string, status?: string) {
  const guard = await guardAction({
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
    requireEmailVerified: false,
    cooldownMs: 0,
  })
  if (!guard.ok) return { success: false, error: guard.error, applications: [] }

  // Self-healing: Auto-create application records for teachers who only have a profile
  try {
    const teachersWithoutApp = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        teacherProfile: { isNot: null },
        teacherApplications: { none: {} }
      },
      include: {
        teacherProfile: true
      }
    })

    if (teachersWithoutApp.length > 0) {
      for (const teacher of teachersWithoutApp) {
        if (teacher.teacherProfile) {
          await prisma.teacherApplication.create({
            data: {
              teacherId: teacher.id,
              teacherProfileId: teacher.teacherProfile.id,
              status: teacher.teacherProfile.applicationStatus || "PENDING",
              documents: teacher.teacherProfile.cvUrl ? { cvUrl: teacher.teacherProfile.cvUrl } : {},
            }
          }).catch(err => console.error("Self-healing creation failed:", err))
        }
      }
    }
  } catch (err) {
    console.error("Self-healing check failed:", err)
  }

  const applications = await prisma.teacherApplication.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(query
        ? {
            OR: [
              { teacher: { name: { contains: query, mode: "insensitive" } } },
              { teacher: { email: { contains: query, mode: "insensitive" } } },
              { teacherProfile: { specialization: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      teacher: { select: { id: true, name: true, email: true, country: true, emailVerified: true, status: true } },
      teacherProfile: true,
      reviewedBy: { select: { name: true, email: true } },
    },
    orderBy: { submittedAt: "desc" },
  })

  return { success: true, applications }
}
