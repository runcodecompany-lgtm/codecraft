// lib/ai-recommendations.ts
import prisma from '@/lib/prisma'
import { aiGenerateJSON } from '@/lib/ai-config'

export interface RecommendationResponse {
  type: 'COURSE' | 'LESSON' | 'ARTICLE' | 'QUIZ' | 'REVIEW'
  targetId: string | null
  title: string
  description: string
  reason: string
  priority: number // 1-5
}

/**
 * Get or generate recommendations for a user.
 * Uses a caching layer (12 hours) to avoid excessive AI API invocations.
 */
export async function getAIRecommendationsForUser(userId: string, forceRefresh = false) {
  try {
    const CACHE_LIMIT_MS = 12 * 60 * 60 * 1000 // 12 hours

    // 1. Check existing recommendations in database
    if (!forceRefresh) {
      const existingRecs = await prisma.aiRecommendation.findMany({
        where: {
          userId,
          isDismissed: false,
          createdAt: {
            gt: new Date(Date.now() - CACHE_LIMIT_MS),
          },
        },
        orderBy: {
          priority: 'desc',
        },
      })

      if (existingRecs.length > 0) {
        return existingRecs
      }
    }

    // 2. Fetch student details and platform catalogs for AI analysis
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          include: {
            course: {
              select: { id: true, title: true, level: true },
            },
          },
        },
        progress: {
          where: { isCompleted: true },
          select: { lessonId: true },
        },
        quizAttempts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { quizId: true, score: true, total: true, percentage: true, isPassed: true },
        },
        userTracks: {
          include: {
            track: {
              select: { id: true, name: true },
            },
          },
        },
        aiLearningProfile: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Fetch primary track ID from profile
    const primaryTrack = user.userTracks.find(t => t.isPrimary)?.track || user.userTracks[0]?.track
    const trackId = primaryTrack?.id

    // Fetch available courses in the student's track that they are NOT enrolled in yet
    const enrolledCourseIds = user.enrollments.map(e => e.courseId)
    const availableCourses = await prisma.course.findMany({
      where: {
        trackId: trackId || undefined,
        isPublished: true,
        id: { notIn: enrolledCourseIds },
      },
      select: {
        id: true,
        title: true,
        description: true,
        level: true,
      },
      take: 5,
    })

    // Fetch lessons in courses they are enrolled in but have NOT completed
    const completedLessonIds = user.progress.map(p => p.lessonId)
    const uncompletedLessons = await prisma.lesson.findMany({
      where: {
        moduleId: {
          in: await prisma.module.findMany({
            where: { courseId: { in: enrolledCourseIds } },
            select: { id: true },
          }).then(modules => modules.map(m => m.id)),
        },
        id: { notIn: completedLessonIds },
      },
      select: {
        id: true,
        title: true,
        module: {
          select: {
            course: {
              select: { id: true, title: true },
            },
          },
        },
      },
      take: 6,
    })

    // Fetch quizzes in enrolled courses that they have NOT passed yet
    const passedQuizIds = user.quizAttempts.filter(q => q.isPassed).map(q => q.quizId)
    const availableQuizzes = await prisma.quiz.findMany({
      where: {
        moduleId: {
          in: await prisma.module.findMany({
            where: { courseId: { in: enrolledCourseIds } },
            select: { id: true },
          }).then(modules => modules.map(m => m.id)),
        },
        id: { notIn: passedQuizIds },
      },
      select: {
        id: true,
        title: true,
        lessonId: true,
      },
      take: 4,
    })

    // 3. Format inputs for AI
    const studentData = {
      name: user.name,
      interests: user.aiLearningProfile?.interests || [],
      strengths: user.aiLearningProfile?.strengths || [],
      weaknesses: user.aiLearningProfile?.weaknesses || [],
      goals: user.aiLearningProfile?.goals || [],
      knowledgeGaps: user.aiLearningProfile?.knowledgeGaps || [],
      enrolledCourses: user.enrollments.map(e => ({
        title: e.course.title,
        progress: e.progress,
        isCompleted: e.isCompleted,
      })),
      recentQuizScores: user.quizAttempts.map(q => ({
        percentage: q.percentage,
        isPassed: q.isPassed,
      })),
      availableCourses: availableCourses.map(c => ({ id: c.id, title: c.title, level: c.level })),
      uncompletedLessons: uncompletedLessons.map(l => ({ id: l.id, title: l.title, courseTitle: l.module.course.title })),
      availableQuizzes: availableQuizzes.map(q => ({ id: q.id, title: q.title })),
    }

    const systemPrompt = `أنت خبير توجيه تعليمي ومحرك توصيات ذكي لمنصة "Code Craft Core".
مهمتك تحليل البيانات التعليمية للطالب واقتراح توصيات مخصصة وفعّالة لمساعدته في مساره التعليمي.

يجب أن تقترح التوصيات بناءً على:
1. فجوات المعرفة ونقاط الضعف (مثلاً: اقتراح درس مراجعة أو اختبار).
2. الخطوة التالية المناسبة (مثلاً: إكمال درس متبقي أو البدء بدورة جديدة في نفس المسار).
3. تقييم أداء الاختبارات (مثلاً: مراجعة موضوع معين إذا حصل على درجة منخفضة).

يجب أن يكون الرد بصيغة مصفوفة JSON تحتوي على كائنات بالبنية التالية تماماً:
[
  {
    "type": "COURSE" | "LESSON" | "ARTICLE" | "QUIZ" | "REVIEW",
    "targetId": "uuid من القوائم المتاحة المطابقة، أو null إذا كانت توصية عامة",
    "title": "عنوان التوصية باللغة العربية (مثال: 'مراجعة دوال جافا سكريبت')",
    "description": "شرح مبسط وواضح لما يجب القيام به باللغة العربية",
    "reason": "السبب التعليمي وراء هذه التوصية باللغة العربية",
    "priority": 1-5 (5 هو الأولوية القصوى)
  }
]

البيانات التعليمية للطالب والمحتوى المتاح للترشيح:
${JSON.stringify(studentData, null, 2)}
`

    // Call AI using JSON mode
    const aiRecommendations = await aiGenerateJSON<RecommendationResponse[]>({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'حلل بياناتي البرمجية الحالية وقدم لي توصيات دراسية مناسبة.' }
      ],
      temperature: 0.6,
    })

    // 4. Save generated recommendations to database in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete old recommendations (soft delete or hard delete; since we regenerate, we can hard delete old ones)
      await tx.aiRecommendation.deleteMany({
        where: {
          userId,
        },
      })

      // Insert new recommendations
      const insertData = aiRecommendations.map(rec => ({
        userId,
        type: rec.type,
        targetId: rec.targetId || null,
        title: rec.title,
        description: rec.description,
        reason: rec.reason,
        priority: rec.priority || 1,
        expiresAt: new Date(Date.now() + CACHE_LIMIT_MS),
      }))

      await tx.aiRecommendation.createMany({
        data: insertData,
      })
    })

    // Retrieve and return the fresh recommendations from the DB
    return await prisma.aiRecommendation.findMany({
      where: { userId, isDismissed: false },
      orderBy: { priority: 'desc' },
    })

  } catch (error) {
    console.error('[Generate Recommendations Error]:', error)
    // Fallback: return any existing non-dismissed recommendations even if expired
    return await prisma.aiRecommendation.findMany({
      where: { userId, isDismissed: false },
      orderBy: { priority: 'desc' },
    })
  }
}
