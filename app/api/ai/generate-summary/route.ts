// app/api/ai/generate-summary/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { aiGenerateJSON, SYSTEM_PROMPTS } from '@/lib/ai-config'

export const dynamic = 'force-dynamic'

interface SummaryJSON {
  brief: string
  keyPoints: string[]
  conclusion: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId, level = 'MEDIUM' } = await req.json()
    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    if (!['SHORT', 'MEDIUM', 'DETAILED'].includes(level)) {
      return NextResponse.json({ error: 'Invalid summary level' }, { status: 400 })
    }

    // 1. Check if summary already exists for this student & lesson
    const existing = await prisma.aiSummary.findUnique({
      where: {
        userId_sourceType_sourceId_level: {
          userId: session.id,
          sourceType: 'LESSON',
          sourceId: lessonId,
          level,
        },
      },
    })

    if (existing) {
      return NextResponse.json(existing)
    }

    // 2. Fetch lesson details
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { title: true, content: true },
    })

    if (!lesson || !lesson.content) {
      return NextResponse.json({ error: 'Lesson content not found or empty' }, { status: 404 })
    }

    // 3. Generate summary using AI
    const lengthInstructions = {
      SHORT: 'ملخص مكثف جداً في نقاط أساسية معدودة لا تتجاوز 100 كلمة.',
      MEDIUM: 'ملخص متوازن يغطي الأفكار الرئيسية مع شرح بسيط في حدود 250 كلمة.',
      DETAILED: 'ملخص تفصيلي يغطي كل جوانب الدرس والمفاهيم البرمجية والأمثلة في حدود 500 كلمة.',
    }[level as 'SHORT' | 'MEDIUM' | 'DETAILED']

    const prompt = `الرجاء كتابة تلخيص لدرس البرمجة التالي:
    العنوان: ${lesson.title}
    المستوى المطلوب: ${level} (${lengthInstructions})
    
    محتوى الدرس:
    """
    ${lesson.content.substring(0, 4000)}
    """
    
    أجب بصيغة JSON تحتوي على الحقول التالية باللغة العربية:
    - brief: نص الملخص التمهيدي الموجز
    - keyPoints: مصفوفة تحتوي على النقاط الرئيسية المستخلصة
    - conclusion: خلاصة أو نصيحة دراسية مستنتجة من الدرس`

    const generated = await aiGenerateJSON<SummaryJSON>({
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.SUMMARY_GENERATOR },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
    })

    // 4. Compile JSON to rich markdown content
    const markdownContent = `### 📝 ملخص درس: ${lesson.title}
    
${generated.brief}

### 💡 النقاط الرئيسية:
${generated.keyPoints.map(point => `- ${point}`).join('\n')}

### 🎓 الخلاصة:
${generated.conclusion}`

    // 5. Save summary in database
    const summary = await prisma.aiSummary.create({
      data: {
        userId: session.id,
        sourceType: 'LESSON',
        sourceId: lessonId,
        level,
        content: markdownContent,
      },
    })

    return NextResponse.json(summary)
  } catch (error: any) {
    console.error('[Generate Summary Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
