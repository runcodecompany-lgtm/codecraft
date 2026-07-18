// lib/ai-analytics.ts
import prisma from '@/lib/prisma'
import { aiGenerateJSON, SYSTEM_PROMPTS } from '@/lib/ai-config'

export interface PerformanceInsights {
  interests: string[]
  strengths: string[]
  weaknesses: string[]
  preferredStyle: 'visual' | 'text' | 'interactive'
  goals: string[]
  knowledgeGaps: {
    topic: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH'
    suggestedLessons: string[]
  }[]
  personalityNotes: string
}

/**
 * Retrieves or generates smart AI insights for a student.
 * Uses a 24-hour cache unless forceRefresh is true.
 */
export async function getOrGenerateStudentInsights(userId: string, forceRefresh = false) {
  try {
    const CACHE_LIMIT_MS = 24 * 60 * 60 * 1000 // 24 hours

    // 1. Check if user already has a fresh profile analysis
    const existingProfile = await prisma.aiLearningProfile.findUnique({
      where: { userId },
    })

    if (
      !forceRefresh &&
      existingProfile &&
      existingProfile.lastAnalyzedAt &&
      Date.now() - new Date(existingProfile.lastAnalyzedAt).getTime() < CACHE_LIMIT_MS
    ) {
      return existingProfile
    }

    // 2. Fetch all learning logs and stats for the student
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: {
          where: { isCompleted: true },
          include: {
            lesson: {
              select: { title: true, type: true },
            },
          },
        },
        quizAttempts: {
          orderBy: { createdAt: 'desc' },
          take: 15,
          include: {
            quiz: {
              select: { title: true },
            },
          },
        },
        gameResults: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { gameType: true, score: true, highScore: true, playCount: true },
        },
        userTracks: {
          include: {
            track: {
              select: { name: true },
            },
          },
        },
        profileCompletion: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Format data for AI analysis
    const studentPerformanceData = {
      name: user.name,
      tracks: user.userTracks.map(t => t.track.name),
      completedLessonsCount: user.progress.length,
      completedLessonsList: user.progress.slice(0, 20).map(p => ({
        title: p.lesson.title,
        type: p.lesson.type,
      })),
      quizScores: user.quizAttempts.map(q => ({
        quizTitle: q.quiz.title,
        percentage: q.percentage,
        isPassed: q.isPassed,
      })),
      gamesPlayed: user.gameResults.map(g => ({
        type: g.gameType,
        score: g.score,
        highScore: g.highScore,
        plays: g.playCount,
      })),
      profileCompletionPercentage: user.profileCompletion?.percentage || 0,
    }

    // 3. Request AI Analysis
    const insights = await aiGenerateJSON<PerformanceInsights>({
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.PERFORMANCE_ANALYZER },
        { 
          role: 'user', 
          content: `حلل بيانات أدائي التعليمي التالية واملأ ملفي التعلمي الذكي باللغة العربية:\n${JSON.stringify(studentPerformanceData, null, 2)}` 
        }
      ],
      temperature: 0.5,
    })

    // Normalize and sanitize AI response values
    const cleanInsights = {
      interests: Array.isArray(insights?.interests) ? insights.interests : [],
      strengths: Array.isArray(insights?.strengths) ? insights.strengths : [],
      weaknesses: Array.isArray(insights?.weaknesses) ? insights.weaknesses : [],
      preferredStyle: ['visual', 'text', 'interactive'].includes(insights?.preferredStyle) 
        ? insights.preferredStyle 
        : 'interactive' as const,
      goals: Array.isArray(insights?.goals) ? insights.goals : [],
      knowledgeGaps: Array.isArray(insights?.knowledgeGaps) ? insights.knowledgeGaps : [],
      personalityNotes: insights?.personalityNotes || (insights as any)?.personality_notes || '',
    }

    // 4. Update the AiLearningProfile in the database
    const updatedProfile = await prisma.aiLearningProfile.upsert({
      where: { userId },
      create: {
        userId,
        interests: cleanInsights.interests,
        strengths: cleanInsights.strengths,
        weaknesses: cleanInsights.weaknesses,
        preferredStyle: cleanInsights.preferredStyle,
        goals: cleanInsights.goals,
        knowledgeGaps: cleanInsights.knowledgeGaps,
        personalityNotes: cleanInsights.personalityNotes,
        lastAnalyzedAt: new Date(),
      },
      update: {
        interests: cleanInsights.interests,
        strengths: cleanInsights.strengths,
        weaknesses: cleanInsights.weaknesses,
        preferredStyle: cleanInsights.preferredStyle,
        goals: cleanInsights.goals,
        knowledgeGaps: cleanInsights.knowledgeGaps,
        personalityNotes: cleanInsights.personalityNotes,
        lastAnalyzedAt: new Date(),
      },
    })

    // 5. Store a historical log of this analysis in AiAnalysisReport
    await prisma.aiAnalysisReport.create({
      data: {
        userId,
        type: 'STUDENT_PERFORMANCE',
        title: `تحليل أداء الطالب: ${user.name || 'مستخدم'} - ${new Date().toLocaleDateString('ar-EG')}`,
        content: cleanInsights as any,
        summary: cleanInsights.personalityNotes.substring(0, 500),
      },
    })

    return updatedProfile
  } catch (error) {
    console.error('[Generate Student Insights Error]:', error)
    // Return existing profile as fallback
    return await prisma.aiLearningProfile.findUnique({
      where: { userId },
    })
  }
}
