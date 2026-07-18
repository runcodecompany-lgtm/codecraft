"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getLearningTracks() {
  try {
    const allTracks = await prisma.learningTrack.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" }
    })

    // Build hierarchical tree in memory
    const trackMap = new Map<string, any>()
    allTracks.forEach(track => {
      trackMap.set(track.id, { ...track, children: [] })
    })

    const rootTracks: any[] = []
    trackMap.forEach(track => {
      if (track.parentId) {
        const parent = trackMap.get(track.parentId)
        if (parent) {
          parent.children.push(track)
        } else {
          rootTracks.push(track)
        }
      } else {
        rootTracks.push(track)
      }
    })

    return { success: true, tracks: rootTracks }
  } catch (error) {
    console.error("Error fetching tracks:", error)
    return { success: false, error: "فشل جلب المسارات التعليمية." }
  }
}

async function requireAdmin() {
  const session = await getServerSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    throw new Error("غير مصرح لك بإدارة المسارات التعليمية.")
  }

  return session
}

export async function getAdminTrackHierarchy() {
  try {
    await requireAdmin()
    const allTracks = await prisma.learningTrack.findMany({
      include: {
        placementTests: {
          include: {
            testQuestions: {
              include: {
                question: true,
              },
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        _count: {
          select: {
            courses: true,
            userTracks: true,
            forums: true,
            qaQuestions: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    // Build hierarchical tree in memory
    const trackMap = new Map<string, any>()
    allTracks.forEach(track => {
      trackMap.set(track.id, { ...track, children: [] })
    })

    const rootTracks: any[] = []
    trackMap.forEach(track => {
      if (track.parentId) {
        const parent = trackMap.get(track.parentId)
        if (parent) {
          parent.children.push(track)
        } else {
          rootTracks.push(track)
        }
      } else {
        rootTracks.push(track)
      }
    })

    return { success: true, tracks: rootTracks }
  } catch (error: any) {
    return { success: false, error: error.message || "فشل جلب شجرة المسارات." }
  }
}

export async function createLearningTrackAction(data: {
  name: string
  description?: string
  icon?: string
  parentId?: string
}) {
  try {
    await requireAdmin()

    if (!data.name?.trim()) {
      return { success: false, error: "اسم المسار مطلوب." }
    }

    const track = await prisma.learningTrack.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        icon: data.icon?.trim() || null,
        parentId: data.parentId || null,
        isActive: true,
      },
    })

    revalidatePath("/dashboard/admin/tracks")
    revalidatePath("/register")
    return { success: true, track }
  } catch (error: any) {
    return { success: false, error: error.message || "فشل إنشاء المسار التعليمي." }
  }
}

export async function updateLearningTrackAction(
  trackId: string,
  data: {
    name?: string
    description?: string
    icon?: string
    isActive?: boolean
    parentId?: string | null
  },
) {
  try {
    await requireAdmin()

    const track = await prisma.learningTrack.update({
      where: { id: trackId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description.trim() || null } : {}),
        ...(data.icon !== undefined ? { icon: data.icon.trim() || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId || null } : {}),
      },
    })

    revalidatePath("/dashboard/admin/tracks")
    revalidatePath("/register")
    return { success: true, track }
  } catch (error: any) {
    return { success: false, error: error.message || "فشل تحديث المسار التعليمي." }
  }
}

export async function deleteLearningTrackAction(trackId: string) {
  try {
    await requireAdmin()

    const usage = await prisma.learningTrack.findUnique({
      where: { id: trackId },
      select: {
        _count: {
          select: {
            courses: true,
            userTracks: true,
            forums: true,
            qaQuestions: true,
            challenges: true,
            learningPaths: true,
          },
        },
      },
    })

    if (!usage) {
      return { success: false, error: "المسار غير موجود." }
    }

    const hasUsage = Object.values(usage._count).some((count) => count > 0)

    if (hasUsage) {
      await prisma.learningTrack.update({
        where: { id: trackId },
        data: { isActive: false },
      })

      revalidatePath("/dashboard/admin/tracks")
      return { success: true, archived: true }
    }

    await prisma.learningTrack.delete({ where: { id: trackId } })
    revalidatePath("/dashboard/admin/tracks")
    return { success: true, archived: false }
  } catch (error: any) {
    return { success: false, error: error.message || "فشل حذف المسار التعليمي." }
  }
}

export async function upsertPlacementTestSettingsAction(data: {
  trackId: string
  title: string
  description?: string
  timeLimitMinutes?: number
  questionCount?: number
  isActive?: boolean
  useAi?: boolean
  aiQuestionCount?: number
  bankQuestionIds?: string[]
  customQuestions?: Array<{
    id?: string
    questionText: string
    questionType: string
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
    options: string[]
    correctAnswer: string
    points?: number
  }>
}) {
  try {
    await requireAdmin()

    if (!data.trackId || !data.title.trim()) {
      return { success: false, error: "المسار وعنوان اختبار تحديد المستوى مطلوبان." }
    }

    // 1. Upsert PlacementTest
    const placementTest = await prisma.placementTest.upsert({
      where: { trackId: data.trackId },
      update: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        timeLimitMinutes: data.timeLimitMinutes || 5,
        questionCount: data.questionCount || 10,
        isActive: data.isActive ?? true,
        useAi: data.useAi ?? false,
        aiQuestionCount: data.aiQuestionCount || 0,
      },
      create: {
        trackId: data.trackId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        timeLimitMinutes: data.timeLimitMinutes || 5,
        questionCount: data.questionCount || 10,
        isActive: data.isActive ?? true,
        useAi: data.useAi ?? false,
        aiQuestionCount: data.aiQuestionCount || 0,
      },
    })

    // 2. Handle Custom Questions
    const finalQuestionIds: string[] = [...(data.bankQuestionIds || [])]

    if (data.customQuestions && data.customQuestions.length > 0) {
      for (const q of data.customQuestions) {
        if (q.id && q.id.length > 10) {
          // Update existing custom question
          await prisma.placementQuestion.update({
            where: { id: q.id },
            data: {
              questionText: q.questionText,
              questionType: q.questionType,
              difficulty: q.difficulty,
              options: q.options,
              correctAnswer: q.correctAnswer,
              points: q.points ?? 1,
            },
          })
          finalQuestionIds.push(q.id)
        } else {
          // Create new custom question (category is null, specific to this test)
          const newQ = await prisma.placementQuestion.create({
            data: {
              questionText: q.questionText,
              questionType: q.questionType,
              difficulty: q.difficulty,
              options: q.options,
              correctAnswer: q.correctAnswer,
              points: q.points ?? 1,
              category: null, // Custom
            },
          })
          finalQuestionIds.push(newQ.id)
        }
      }
    }

    // 3. Sync linked questions in PlacementTestQuestion join table
    // Delete existing connections
    await prisma.placementTestQuestion.deleteMany({
      where: { testId: placementTest.id },
    })

    // Create new connections in order
    if (finalQuestionIds.length > 0) {
      const uniqueQuestionIds = Array.from(new Set(finalQuestionIds))
      await prisma.placementTestQuestion.createMany({
        data: uniqueQuestionIds.map((questionId, index) => ({
          testId: placementTest.id,
          questionId,
          order: index,
        })),
      })
    }

    revalidatePath("/dashboard/admin/tracks")
    return { success: true, placementTest }
  } catch (error: any) {
    console.error("Error saving placement test settings:", error)
    return { success: false, error: error.message || "فشل حفظ إعدادات اختبار تحديد المستوى." }
  }
}
