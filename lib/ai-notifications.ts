// lib/ai-notifications.ts
// AI-driven notification triggers based on student behavior and performance
import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/foundation'

/**
 * Trigger intelligent AI notifications based on quiz performance.
 * Called after a student fails a quiz.
 */
export async function notifyOnQuizFailure(userId: string, quizId: string, score: number, total: number) {
  try {
    const percentage = Math.round((score / total) * 100)
    if (percentage >= 60) return // Not a failure worth notifying

    // Find what quiz this was
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: { select: { id: true, title: true } },
        module: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    })

    if (!quiz) return

    const courseName = quiz.module?.course?.title || 'الدورة'

    // Check if student already has a recommendation to review this quiz
    const existingRec = await prisma.aiRecommendation.findFirst({
      where: {
        userId,
        type: 'REVIEW',
        targetId: quizId,
        isDismissed: false,
      },
    })

    if (!existingRec) {
      await prisma.aiRecommendation.create({
        data: {
          userId,
          type: 'REVIEW',
          targetId: quiz.lesson?.id || quizId,
          title: `مراجعة مطلوبة: ${quiz.title}`,
          description: `حصلت على ${percentage}% فقط في هذا الاختبار. يُنصح بمراجعة المحتوى قبل إعادة المحاولة.`,
          reason: `أداء الاختبار كان ضعيفاً (${percentage}%) وهو أقل من الحد المطلوب للنجاح.`,
          priority: 4,
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      })
    }

    await createNotification(
      userId,
      `🔁 اقتراح: راجع المحتوى قبل إعادة اختبار "${quiz.title}"`,
      `حصلت على ${percentage}% في الاختبار. يوصي مدرب الذكاء الاصطناعي بمراجعة دروس "${courseName}" لتحسين فهمك قبل المحاولة مجدداً.`,
      'SYSTEM'
    )
  } catch (error) {
    console.error('[AI Notification - Quiz Failure Error]:', error)
  }
}

/**
 * Trigger intelligent AI notifications after course completion.
 * Suggests the next course in the student's learning path.
 */
export async function notifyOnCourseCompletion(userId: string, courseId: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, trackId: true, level: true },
    })

    if (!course) return

    // Find next course in same track at higher or same level
    const nextCourse = await prisma.course.findFirst({
      where: {
        trackId: course.trackId || undefined,
        isPublished: true,
        id: { not: courseId },
        enrollments: {
          none: { userId },
        },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true, slug: true, level: true },
    })

    if (nextCourse) {
      // Create recommendation in database
      await prisma.aiRecommendation.upsert({
        where: {
          // We'll use a findFirst + create pattern since no unique constraint on userId+targetId
          id: `placeholder-${userId}-${nextCourse.id}`,
        },
        create: {
          userId,
          type: 'COURSE',
          targetId: nextCourse.id,
          title: `الخطوة التالية في مسيرتك: ${nextCourse.title}`,
          description: `أنهيت "${course.title}" بنجاح! الدورة التالية المقترحة لمسيرتك هي "${nextCourse.title}".`,
          reason: `إكمال دورة "${course.title}" يستوجب التقدم نحو الدورة التالية في نفس المسار.`,
          priority: 5,
        },
        update: {},
      }).catch(async () => {
        // If upsert fails due to ID conflict, use create directly
        await prisma.aiRecommendation.create({
          data: {
            userId,
            type: 'COURSE',
            targetId: nextCourse.id,
            title: `الخطوة التالية في مسيرتك: ${nextCourse.title}`,
            description: `أنهيت "${course.title}" بنجاح! الدورة التالية المقترحة لمسيرتك هي "${nextCourse.title}".`,
            reason: `إكمال دورة "${course.title}" يستوجب التقدم نحو الدورة التالية في نفس المسار.`,
            priority: 5,
          },
        }).catch(() => {}) // Ignore if already exists
      })

      await createNotification(
        userId,
        `🎉 أتممت "${course.title}"! ما رأيك بالخطوة التالية؟`,
        `يقترح مدرب الذكاء الاصطناعي البدء بدورة "${nextCourse.title}" لمواصلة رحلتك التعليمية في هذا المسار.`,
        'COURSE'
      )
    } else {
      // No next course — congratulate and suggest exploring other tracks
      await createNotification(
        userId,
        `🏆 رائع! أتممت مسيرتك في "${course.title}"`,
        `أحسنت! يمكنك الآن استكشاف مسارات جديدة أو تعميق معرفتك من خلال اختبارات المراجعة.`,
        'SYSTEM'
      )
    }
  } catch (error) {
    console.error('[AI Notification - Course Completion Error]:', error)
  }
}

/**
 * Send a streak reminder if the student hasn't been active for 2+ days.
 */
export async function notifyInactiveStudent(userId: string, lastActiveDate: Date) {
  try {
    const daysSinceActive = Math.floor(
      (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceActive < 2) return // Still active, no need to notify

    const streakMsg =
      daysSinceActive >= 7
        ? `⚠️ لقد مرت ${daysSinceActive} أيام منذ آخر نشاط لك! لا تدع انقطاعك يؤثر على تقدمك.`
        : `👋 اشتقنا إليك! مرت ${daysSinceActive} أيام منذ آخر زيارة. استأنف التعلم الآن!`

    await createNotification(
      userId,
      '📚 تذكير: مواصلة رحلتك التعليمية',
      streakMsg,
      'SYSTEM'
    )
  } catch (error) {
    console.error('[AI Notification - Inactive Student Error]:', error)
  }
}
