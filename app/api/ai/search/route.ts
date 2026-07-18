// app/api/ai/search/route.ts
// Smart Semantic Search — uses AI to parse natural language queries
// then performs structured database search across courses, lessons, and articles.
import { NextRequest, NextResponse } from 'next/server'
import { aiGenerateJSON, SYSTEM_PROMPTS } from '@/lib/ai-config'
import { aiCache } from '@/lib/ai-cache'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface ParsedQuery {
  keywords: string[]
  topic: string
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  contentType?: 'COURSE' | 'LESSON' | 'ARTICLE' | 'ANY'
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const trimmedQuery = query.trim()

    // Check cache — semantic search results are cacheable for 10 minutes
    const cacheKey = `smart-search:${trimmedQuery.toLowerCase()}`
    const cached = aiCache.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true })
    }

    // Use AI to parse natural language query into structured intent
    let parsedQuery: ParsedQuery

    try {
      parsedQuery = await aiGenerateJSON<ParsedQuery>({
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.SMART_SEARCH },
          {
            role: 'user',
            content: `حلل استعلام البحث التالي واستخرج المعلومات الهيكلية منه:\n"${trimmedQuery}"\n\nأجب بصيغة JSON تحتوي على:\n- keywords: مصفوفة بالكلمات المفتاحية المستخرجة\n- topic: الموضوع الرئيسي المطلوب\n- difficulty: مستوى الصعوبة إذا ذُكر (BEGINNER/INTERMEDIATE/ADVANCED) أو null\n- contentType: نوع المحتوى المطلوب (COURSE/LESSON/ARTICLE/ANY)`,
          },
        ],
        temperature: 0.3,
      })
    } catch {
      // Fallback: treat the query as raw keywords
      parsedQuery = {
        keywords: trimmedQuery.split(/\s+/).filter(w => w.length > 2),
        topic: trimmedQuery,
        contentType: 'ANY',
      }
    }

    const keywordConditions = parsedQuery.keywords.length > 0
      ? parsedQuery.keywords.map((kw) => ({
          OR: [
            { title: { contains: kw, mode: 'insensitive' as const } },
            { description: { contains: kw, mode: 'insensitive' as const } },
          ],
        }))
      : [
          {
            OR: [
              { title: { contains: trimmedQuery, mode: 'insensitive' as const } },
              { description: { contains: trimmedQuery, mode: 'insensitive' as const } },
            ],
          },
        ]

    // Parallel DB search
    const [courses, articles] = await Promise.all([
      // Search courses
      prisma.course.findMany({
        where: {
          isPublished: true,
          AND: keywordConditions,
          ...(parsedQuery.difficulty ? { level: parsedQuery.difficulty } : {}),
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          level: true,
          coverImage: true,
          teacher: { select: { name: true } },
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),

      // Search articles
      prisma.article.findMany({
        where: {
          published: true,
          OR: keywordConditions[0]?.OR || [
            { title: { contains: trimmedQuery, mode: 'insensitive' } },
            { content: { contains: trimmedQuery, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          author: { select: { name: true } },
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const result = {
      parsedIntent: parsedQuery,
      results: {
        courses: courses.map(c => ({
          ...c,
          description: c.description.substring(0, 150) + '...',
        })),
        articles: articles.map(a => ({
          ...a,
          content: a.content.substring(0, 120) + '...',
        })),
        total: courses.length + articles.length,
      },
    }

    // Cache for 10 minutes
    aiCache.set(cacheKey, result, 10 * 60 * 1000)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[AI Search API Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
