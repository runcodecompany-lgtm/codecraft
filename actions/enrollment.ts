// actions/enrollment.ts
"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { createAuditLog, createNotification } from "@/lib/foundation"
import { addCoins, addXp, checkAndAwardAchievement } from "@/lib/gamification"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"

function generateCertificateNumber(): string {
  const hex = randomBytes(4).toString("hex").toUpperCase()
  return `CCC-CERT-${hex}`
}

/**
 * Enroll student in a course (purchasing with coins if necessary)
 */
export async function enrollInCourse(courseId: string) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: "يجب تسجيل الدخول أولاً للتسجيل." }
    }
    if (!session.emailVerified) {
      return { success: false, error: "يجب تأكيد البريد الإلكتروني قبل التسجيل في الدورات." }
    }
    if (session.role !== "STUDENT" && session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return { success: false, error: "التسجيل في الدورات متاح للطلاب فقط." }
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { priceInCoins: true, title: true },
    })

    if (!course) {
      return { success: false, error: "الدورة التدريبية غير موجودة." }
    }

    // Check existing enrollment
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.id,
          courseId,
        },
      },
    })

    if (existing) {
      return { success: false, error: "أنت مسجل بالفعل في هذه الدورة." }
    }

    // Deduct coins if price > 0
    if (course.priceInCoins > 0) {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { craftCoins: true },
      })

      if (!user || user.craftCoins < course.priceInCoins) {
        return {
          success: false,
          error: `رصيد عملاتك غير كافٍ للتسجيل. تكلفة الدورة ${course.priceInCoins} عملة ورصيدك الحالي ${user?.craftCoins ?? 0}.`,
        }
      }

      await prisma.$transaction(async (tx) => {
        // Deduct coins from user balance
        await tx.user.update({
          where: { id: session.id },
          data: {
            craftCoins: { decrement: course.priceInCoins },
          },
        })

        // Log transaction
        await tx.transaction.create({
          data: {
            userId: session.id,
            amount: course.priceInCoins,
            type: "SPEND",
            description: `شراء والتسجيل في دورة: ${course.title}`,
          },
        })

        // Create enrollment
        await tx.enrollment.create({
          data: {
            userId: session.id,
            courseId,
            progress: 0,
          },
        })
      })
    } else {
      // Free enrollment
      await prisma.enrollment.create({
        data: {
          userId: session.id,
          courseId,
          progress: 0,
        },
      })
    }

    // Send notification
    await createNotification(
      session.id,
      `📚 تم التسجيل في دورة: ${course.title}`,
      `مرحباً بك في دورة "${course.title}". ابدأ مشاهدة الدروس وحل التحديات الآن!`,
      "COURSE"
    )

    // Audit log
    await createAuditLog(
      session.id,
      "Course Enrollment",
      null,
      null,
      `Enrolled in course ID: ${courseId}. Cost: ${course.priceInCoins} Coins`
    )

    revalidatePath("/dashboard/student")
    revalidatePath("/dashboard/student/courses")
    revalidatePath(`/courses/${courseId}`)
    return { success: true }
  } catch (error) {
    console.error("Error enrolling in course:", error)
    return { success: false, error: "حدث خطأ غير متوقع أثناء التسجيل في الدورة." }
  }
}

/**
 * Cancel enrollment in a course
 */
export async function cancelEnrollment(courseId: string) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: "يجب تسجيل الدخول أولاً." }
    }
    if (!session.emailVerified) {
      return { success: false, error: "يجب تأكيد البريد الإلكتروني قبل إدارة التسجيلات." }
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.id,
          courseId,
        },
      },
      include: { course: { select: { title: true } } },
    })

    if (!enrollment) {
      return { success: false, error: "لم يتم العثور على تسجيل نشط لهذه الدورة." }
    }

    // Delete enrollment
    await prisma.enrollment.delete({
      where: {
        userId_courseId: {
          userId: session.id,
          courseId,
        },
      },
    })

    // Write audit log
    await createAuditLog(
      session.id,
      "Course Enrollment Cancelled",
      null,
      null,
      `Cancelled enrollment for course: ${enrollment.course.title}`
    )

    revalidatePath("/dashboard/student")
    revalidatePath("/dashboard/student/courses")
    return { success: true }
  } catch (error) {
    console.error("Error cancelling enrollment:", error)
    return { success: false, error: "حدث خطأ غير متوقع أثناء إلغاء التسجيل." }
  }
}

/**
 * Calculate course completion percentage and update enrollment progress.
 * If 100%, generates a certificate and awards XP/Coins.
 */
export async function updateCourseProgress(userId: string, courseId: string) {
  try {
    // 1. Get all lessons in this course
    const modules = await prisma.module.findMany({
      where: { courseId },
      include: { lessons: { select: { id: true } } },
    })

    const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id))
    const totalLessons = allLessonIds.length

    if (totalLessons === 0) return { success: true, progress: 0 }

    // 2. Count completed lessons for this user in this course
    const completedCount = await prisma.userProgress.count({
      where: {
        userId,
        lessonId: { in: allLessonIds },
        isCompleted: true,
      },
    })

    const progressPct = Math.round((completedCount / totalLessons) * 100)

    // 3. Find current enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: { course: { select: { title: true } } },
    })

    if (!enrollment) return { success: false, error: "التسجيل غير موجود." }

    const wasCompletedBefore = enrollment.isCompleted
    const isCompletedNow = progressPct === 100

    // 4. Update enrollment progress
    await prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      data: {
        progress: progressPct,
        isCompleted: isCompletedNow,
      },
    })

    // 5. Trigger course completion rewards and certificate generation if newly completed
    if (isCompletedNow && !wasCompletedBefore) {
      const certNumber = generateCertificateNumber()

      await prisma.$transaction(async (tx) => {
        // Create Certificate in database
        await tx.certificate.create({
          data: {
            userId,
            courseId,
            certificateNumber: certNumber,
            qrCodeUrl: `/certificates/verify/${certNumber}`,
          },
        })

        // Notify user about certificate
        await tx.notification.create({
          data: {
            userId,
            title: `🎓 حصلت على شهادة جديدة!`,
            message: `تهانينا! لقد أكملت دورة "${enrollment.course.title}" بنجاح وحصلت على شهادة إتمام برقم: ${certNumber}.`,
            type: "CERTIFICATE",
          },
        })
      })

      // Award Completion Rewards (100 Coins & 100 XP)
      await addCoins(userId, 100, `مكافأة إتمام دورة: ${enrollment.course.title}`)
      await addXp(userId, 100, `إتمام دورة: ${enrollment.course.title}`)

      // Award Achievements
      await checkAndAwardAchievement(userId, "FIRST_CERTIFICATE")
      await checkAndAwardAchievement(userId, "FIRST_COURSE")

      // Write audit log
      await createAuditLog(
        userId,
        "Course Completed & Certificate Issued",
        null,
        null,
        `Course: ${enrollment.course.title}. Certificate: ${certNumber}`
      )
    }

    revalidatePath("/dashboard/student")
    revalidatePath("/dashboard/student/courses")
    return { success: true, progress: progressPct, completed: isCompletedNow }
  } catch (error) {
    console.error("Error updating course progress:", error)
    return { success: false, error: "حدث خطأ أثناء تحديث التقدم الدراسي." }
  }
}
