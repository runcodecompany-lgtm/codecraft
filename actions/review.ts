"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { guardAction } from "@/lib/action-guard"

// Student Action: Submit review and rating for a course
export async function submitCourseReview(
  courseId: string,
  ratingValue: number,
  comment: string
) {
  try {
    const guard = await guardAction({ allowedRoles: ["STUDENT", "TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: guard.userId,
          courseId
        }
      }
    })

    if (!enrollment) {
      return { success: false, error: "يجب أن تكون مسجلاً في هذه الدورة لإضافة تقييم." }
    }

    const rating = Math.min(5, Math.max(1, Number(ratingValue)))

    // Save or update review and rating in transaction
    await prisma.$transaction(async (tx) => {
      // Create or update review
      const existingReview = await tx.review.findUnique({
        where: {
          userId_courseId: {
            userId: guard.userId,
            courseId
          }
        }
      })

      if (existingReview) {
        await tx.review.update({
          where: { id: existingReview.id },
          data: { rating, comment }
        })
      } else {
        await tx.review.create({
          data: {
            userId: guard.userId,
            courseId,
            rating,
            comment
          }
        })
      }

      // Create or update rating
      const existingRating = await tx.rating.findUnique({
        where: {
          userId_courseId: {
            userId: guard.userId,
            courseId
          }
        }
      })

      if (existingRating) {
        await tx.rating.update({
          where: { id: existingRating.id },
          data: { value: rating }
        })
      } else {
        await tx.rating.create({
          data: {
            userId: guard.userId,
            courseId,
            value: rating
          }
        })
      }

      // Fetch course teacher id to send notification
      const course = await tx.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true, title: true }
      })

      if (course) {
        // Create teacher notification about new review
        const user = await tx.user.findUnique({
          where: { id: guard.userId },
          select: { name: true }
        })
        const studentName = user?.name || "طالب"
        
        await tx.notification.create({
          data: {
            userId: course.teacherId,
            title: `تقييم جديد لدورتك: ${course.title}`,
            message: `قام الطالب ${studentName} بإضافة تقييم ${rating} نجوم لدورتك وكتب: "${comment.substring(0, 50)}..."`,
            type: "COURSE"
          }
        })
      }
    })

    revalidatePath(`/courses/${courseId}`)
    revalidatePath("/dashboard/student/courses")

    return { success: true }
  } catch (error) {
    console.error("Error in submitCourseReview:", error)
    return { success: false, error: "فشل حفظ التقييم والمراجعة." }
  }
}

// Teacher Action: Reply to a review
export async function replyToReview(reviewId: string, replyText: string) {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { course: { select: { teacherId: true, title: true } } }
    })

    if (!review) return { success: false, error: "المراجعة غير موجودة." }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    if (review.course.teacherId !== guard.userId && dbUser?.role !== "ADMIN") {
      return { success: false, error: "غير مصرح لك بالرد على هذه المراجعة." }
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: { reply: replyText }
    })

    // Notify student about reply
    await prisma.notification.create({
      data: {
        userId: review.userId,
        title: `رد جديد من المعلم على مراجعتك`,
        message: `قام معلم دورة "${review.course.title}" بالرد على تقييمك: "${replyText.substring(0, 50)}..."`,
        type: "COURSE"
      }
    })

    revalidatePath(`/courses/${review.courseId}`)
    revalidatePath("/dashboard/teacher/reviews")

    return { success: true }
  } catch (error) {
    console.error("Error in replyToReview:", error)
    return { success: false, error: "فشل إضافة الرد على المراجعة." }
  }
}

// Fetch all reviews for a specific course
export async function getCourseReviews(courseId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, reviews }
  } catch (error) {
    console.error("Error in getCourseReviews:", error)
    return { success: false, error: "فشل جلب المراجعات." }
  }
}

// Fetch all reviews for all courses taught by the teacher
export async function getTeacherAllReviews() {
  try {
    const guard = await guardAction({ allowedRoles: ["TEACHER", "ADMIN"], cooldownMs: 0 })
    if (!guard.ok) return { success: false, error: guard.error }

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { role: true }
    })

    const isSystemAdmin = dbUser?.role === "ADMIN"

    const reviews = await prisma.review.findMany({
      where: isSystemAdmin ? {} : {
        course: { teacherId: guard.userId }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, reviews }
  } catch (error) {
    console.error("Error in getTeacherAllReviews:", error)
    return { success: false, error: "فشل جلب التقييمات والمراجعات." }
  }
}
