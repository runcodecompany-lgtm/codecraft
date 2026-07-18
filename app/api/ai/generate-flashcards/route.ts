// app/api/ai/generate-flashcards/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { aiGenerateJSON, SYSTEM_PROMPTS } from '@/lib/ai-config'

export const dynamic = 'force-dynamic'

interface FlashcardItem {
  front: string
  back: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId, count = 6 } = await req.json()
    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    // 1. Check if user already has a deck for this lesson
    const existingDeck = await prisma.aiFlashcardDeck.findFirst({
      where: {
        userId: session.id,
        sourceType: 'LESSON',
        sourceId: lessonId,
      },
      include: {
        cards: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (existingDeck) {
      return NextResponse.json(existingDeck)
    }

    // 2. Fetch lesson details
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { title: true, content: true },
    })

    if (!lesson || !lesson.content) {
      return NextResponse.json({ error: 'Lesson content not found or empty' }, { status: 404 })
    }

    // 3. Generate flashcard concepts via AI
    const prompt = `قم باستخراج أهم ${count} مفاهيم برمجية أو مصطلحات أو أسئلة رئيسية من درس البرمجة التالي:
    الدرس: ${lesson.title}
    
    محتوى الدرس:
    """
    ${lesson.content.substring(0, 4000)}
    """
    
    أجب بصيغة مصفوفة JSON تحتوي على كائنات بالبنية التالية باللغة العربية:
    [
      {
        "front": "المصطلح أو السؤال البرمجي القصير (الوجه الأمامي للبطاقة)",
        "back": "التعريف أو الجواب البرمجي المفصل والمبسط (الوجه الخلفي للبطاقة)"
      }
    ]
    `

    const generated = await aiGenerateJSON<FlashcardItem[]>({
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.FLASHCARD_GENERATOR },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
    })

    let cardsList: FlashcardItem[] = []

    if (Array.isArray(generated)) {
      cardsList = generated
    } else if (generated && typeof generated === 'object') {
      const arrayVal = Object.values(generated).find(val => Array.isArray(val))
      if (arrayVal) {
        cardsList = arrayVal as FlashcardItem[]
      }
    }

    if (!Array.isArray(cardsList) || cardsList.length === 0) {
      console.error("[Generate Flashcards] Invalid AI response structure:", generated)
      throw new Error('AI failed to generate a valid list of flashcards')
    }

    // 4. Save the deck and cards in database transaction
    const newDeck = await prisma.$transaction(async (tx) => {
      const deck = await tx.aiFlashcardDeck.create({
        data: {
          userId: session.id,
          title: `بطاقات مراجعة: ${lesson.title}`,
          sourceType: 'LESSON',
          sourceId: lessonId,
          cardCount: cardsList.length,
        },
      })

      const cardsData = cardsList.map((card, index) => ({
        deckId: deck.id,
        front: card.front,
        back: card.back,
        order: index,
      }))

      await tx.aiFlashcard.createMany({
        data: cardsData,
      })

      return await tx.aiFlashcardDeck.findUnique({
        where: { id: deck.id },
        include: { cards: { orderBy: { order: 'asc' } } },
      })
    })

    return NextResponse.json(newDeck)
  } catch (error: any) {
    console.error('[Generate Flashcards Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
