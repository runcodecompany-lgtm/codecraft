// app/api/ai/generate-assignments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { aiGenerateJSON, SYSTEM_PROMPTS } from '@/lib/ai-config'

export const dynamic = 'force-dynamic'

interface AssignmentJSON {
  title: string
  description: string
  starterCode: string
  testCases: { input: string; output: string }[]
  points: number
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId, courseId, topic, difficulty = 'BEGINNER' } = await req.json()

    let contextText = ''
    let defaultTitle = 'واجب برمي تفاعلي'

    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { title: true, content: true },
      })
      if (lesson) {
        contextText = `الدرس: ${lesson.title}\nالمحتوى:\n${lesson.content || ''}`
        defaultTitle = `تطبيق عملي: ${lesson.title}`
      }
    } else if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true, description: true },
      })
      if (course) {
        contextText = `الدورة: ${course.title}\nالوصف:\n${course.description}`
        defaultTitle = `مشروع عملي: دورة ${course.title}`
      }
    } else if (topic) {
      contextText = `الموضوع المراد التدرب عليه: ${topic}`
      defaultTitle = `تمرين عملي حول ${topic}`
    } else {
      return NextResponse.json({ error: 'Provide lessonId, courseId, or topic' }, { status: 400 })
    }

    const prompt = `أنت خبير في تصميم الواجبات البرمجية العملية.
    الرجاء إنشاء واجب برمي عملي تفاعلي بمستوى صعوبة "${difficulty}".
    سياق الموضوع:
    """
    ${contextText.substring(0, 2500)}
    """
    
    يجب أن يتضمن ردك بصيغة JSON الحقول التالية باللغة العربية:
    - title: عنوان قصير وجذاب للواجب
    - description: وصف دقيق للواجب المطلوب والمخرجات المطلوبة خطوة بخطوة باللغة العربية
    - starterCode: كود برمجي بدئي مناسب (مثلاً دالة فارغة مع تعليقات تشرح المدخلات والمخرجات)
    - testCases: مصفوفة من حالات الاختبار المقترحة (تحتوي على حقول input و output) للتحقق من عمل الحل
    - points: عدد النقاط المقترحة للواجب (من 10 إلى 100)`

    const assignmentData = await aiGenerateJSON<AssignmentJSON>({
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.ASSIGNMENT_GENERATOR },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
    })

    // If the user is a teacher and wants to permanently add this assignment to the lesson/course:
    const isTeacher = session.role === 'TEACHER' || session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
    const shouldSave = isTeacher && lessonId

    if (shouldSave) {
      // We'll create it inside the standard Assignment table
      const savedAssignment = await prisma.assignment.create({
        data: {
          title: assignmentData.title || defaultTitle,
          description: `${assignmentData.description}\n\n**الكود البدئي:**\n\`\`\`javascript\n${assignmentData.starterCode}\n\`\`\``,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          points: assignmentData.points || 50,
          lessonId,
        },
      })
      return NextResponse.json({ ...assignmentData, id: savedAssignment.id, saved: true })
    }

    // For students or general practice, return the interactive coding challenge directly
    return NextResponse.json(assignmentData)
  } catch (error: any) {
    console.error('[Generate Assignment Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
