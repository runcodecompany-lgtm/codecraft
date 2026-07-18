// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { aiStream, SYSTEM_PROMPTS, checkAIRateLimit } from '@/lib/ai-config'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationId, context } = await req.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Check rate limiting
    const rateLimit = checkAIRateLimit(session.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please try again after ${Math.ceil((rateLimit.retryAfterMs || 0) / 1000)} seconds.` },
        { status: 429 }
      )
    }

    // Check AI billing and usage restrictions based on subscription
    const activeSub = await prisma.subscription.findFirst({
      where: {
        userId: session.id,
        status: { in: ["ACTIVE", "TRIAL"] },
        endDate: { gte: new Date() }
      },
      include: { plan: true }
    })

    const planName = activeSub?.plan.name || "FREE"

    // Count user messages this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const messageCount = await prisma.aiMessage.count({
      where: {
        conversation: { userId: session.id },
        role: "user",
        createdAt: { gte: startOfMonth }
      }
    })

    if (planName === "FREE") {
      // Free limit: 5 monthly messages
      if (messageCount >= 5) {
        return NextResponse.json(
          { error: "لقد استنفدت الحد المسموح به للمساعد الذكي في الخطة المجانية (5 رسائل شهرياً). يرجى الترقية إلى خطة Basic أو Pro أو Premium لمتابعة الاستخدام." },
          { status: 403 }
        )
      }
    } else if (planName === "BASIC") {
      if (messageCount >= 50) {
        return NextResponse.json(
          { error: "لقد تجاوزت حد الـ 50 رسالة شهرياً المتاحة في خطة Basic. يرجى الترقية لخطّة أعلى للحصول على حدود أكبر." },
          { status: 403 }
        )
      }
    } else if (planName === "PRO") {
      if (messageCount >= 200) {
        return NextResponse.json(
          { error: "لقد تجاوزت حد الـ 200 رسالة شهرياً المتاحة في خطة Pro. يرجى الترقية إلى خطة Premium للاستخدام غير المحدود." },
          { status: 403 }
        )
      }
    }

    let conversation: any

    if (conversationId) {
      // Find existing conversation and verify ownership
      conversation = await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId: session.id },
      })
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
    } else {
      // Create a new conversation
      conversation = await prisma.aiConversation.create({
        data: {
          userId: session.id,
          title: message.length > 30 ? message.substring(0, 30) + '...' : message,
          context: context || null,
        },
      })
    }

    // Save the user's message in the database
    await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    })

    // Fetch message history (up to last 15 messages)
    const history = await prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 15,
    })

    // Prepare context-specific prompting
    let systemPrompt = SYSTEM_PROMPTS.LEARNING_ASSISTANT
    let lessonContextPrompt = ''

    const activeContext = context || conversation.context

    if (activeContext?.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: activeContext.lessonId },
        select: {
          title: true,
          content: true,
          module: {
            select: {
              course: {
                select: { title: true },
              },
            },
          },
        },
      })

      if (lesson) {
        lessonContextPrompt = `\n\nالسياق الحالي للتعلم:\n- الدورة: ${lesson.module.course.title}\n- الدرس الحالي: ${lesson.title}\n`
        if (lesson.content) {
          lessonContextPrompt += `- محتوى الدرس المتاح:\n"""\n${lesson.content.substring(0, 1500)}\n"""\n`
        }
        lessonContextPrompt += `\nالرجاء إجابة الطالب في سياق هذا الدرس وبناءً على محتواه، وشرح المفاهيم بطريقة سهلة وتفاعلية.`
      }
    }

    // Convert history messages to AI config schema format
    const aiMessages = [
      { role: 'system' as const, content: systemPrompt + lessonContextPrompt },
      ...history.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const encoder = new TextEncoder()
    const generator = aiStream({
      messages: aiMessages,
      temperature: 0.7,
    })

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        try {
          for await (const chunk of generator) {
            if (chunk.content) {
              fullResponse += chunk.content
              controller.enqueue(encoder.encode(chunk.content))
            }
            if (chunk.done) {
              break
            }
          }

          // Save assistant's response to the database
          await prisma.aiMessage.create({
            data: {
              conversationId: conversation.id,
              role: 'assistant',
              content: fullResponse,
            },
          })

          controller.close()
        } catch (err: any) {
          console.error('[AI Stream Route Error]:', err)
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Conversation-Id': conversation.id,
        'Access-Control-Expose-Headers': 'X-Conversation-Id',
      },
    })
  } catch (error) {
    console.error('[AI Chat API Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
