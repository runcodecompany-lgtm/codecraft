// app/api/ai/generate-quiz/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { aiGenerateJSON, SYSTEM_PROMPTS } from '@/lib/ai-config'

export const dynamic = 'force-dynamic'

interface QuizQuestion {
  questionText: string
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'MULTIPLE_SELECT'
  options: string[]
  correctAnswer: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  points: number
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId, courseId, topics, difficulty = 'MIXED', count = 5 } = await req.json()

    let sourceContent = ''
    let sourceType = 'CUSTOM'
    let sourceId: string | null = null
    let title = `اختبار ذكي حول: ${topics || 'مواضيع مخصصة'}`

    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, title: true, content: true },
      })
      if (!lesson) {
        return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
      }
      sourceContent = lesson.content || ''
      sourceType = 'LESSON'
      sourceId = lesson.id
      title = `اختبار ذكي: ${lesson.title}`
    } else if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, description: true },
      })
      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
      sourceContent = course.description
      sourceType = 'COURSE'
      sourceId = course.id
      title = `اختبار ذكي: دورة ${course.title}`
    } else if (topics) {
      sourceContent = `مواضيع الاختبار: ${topics}`
    } else {
      return NextResponse.json({ error: 'Please provide lessonId, courseId, or custom topics' }, { status: 400 })
    }

    // Call AI to generate the quiz
    const prompt = `الرجاء توليد اختبار ذكي باللغة العربية مكون من ${count} أسئلة بمستوى صعوبة "${difficulty}".
    محتوى المصدر:
    """
    ${sourceContent.substring(0, 3000)}
    """`

    const generated = await aiGenerateJSON<{ questions: QuizQuestion[] }>({
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.QUIZ_GENERATOR },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
    })

    const questionsList = generated.questions || (generated as any)

    if (!Array.isArray(questionsList) || questionsList.length === 0) {
      throw new Error('AI failed to generate a valid list of questions')
    }

    // Save generated quiz to database
    const quiz = await prisma.aiGeneratedQuiz.create({
      data: {
        createdById: session.id,
        sourceType,
        sourceId,
        sourceContent: sourceContent.substring(0, 1000),
        title,
        questions: questionsList as any,
        questionCount: questionsList.length,
        difficulty,
        status: 'GENERATED',
      },
    })

    return NextResponse.json(quiz)
  } catch (error: any) {
    console.error('[Generate Quiz Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
