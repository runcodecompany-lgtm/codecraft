// lib/ai-moderation.ts
// AI Content Moderation — detects spam, abuse, and inappropriate content
import prisma from '@/lib/prisma'
import { aiGenerateJSON, SYSTEM_PROMPTS } from '@/lib/ai-config'

export type ModerationContentType =
  | 'FORUM_TOPIC'
  | 'FORUM_REPLY'
  | 'COMMENT'
  | 'QUESTION'
  | 'ANSWER'
  | 'MESSAGE'

export interface ModerationResult {
  isAppropriate: boolean
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  categories: string[]
  autoAction: 'NONE' | 'FLAG' | 'HIDE' | 'DELETE'
}

/**
 * Moderate a piece of user-generated content using AI.
 * Logs the result to the AiModerationLog table.
 * Returns the moderation result.
 */
export async function moderateContent(
  contentType: ModerationContentType,
  contentId: string,
  contentText: string
): Promise<ModerationResult> {
  // Skip very short, obviously safe content
  if (contentText.trim().length < 5) {
    return {
      isAppropriate: true,
      severity: 'NONE',
      reason: '',
      categories: [],
      autoAction: 'NONE',
    }
  }

  let result: ModerationResult

  try {
    const aiResult = await aiGenerateJSON<ModerationResult>({
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.CONTENT_MODERATOR },
        {
          role: 'user',
          content: `افحص النص التالي للتحقق من ملاءمته لمنصة تعليمية عربية:\n"""\n${contentText.substring(0, 2000)}\n"""`,
        },
      ],
      temperature: 0.2, // Low temperature for more deterministic moderation decisions
    })

    // Validate AI response structure
    result = {
      isAppropriate: typeof aiResult.isAppropriate === 'boolean' ? aiResult.isAppropriate : true,
      severity: ['NONE', 'LOW', 'MEDIUM', 'HIGH'].includes(aiResult.severity) ? aiResult.severity : 'NONE',
      reason: aiResult.reason || '',
      categories: Array.isArray(aiResult.categories) ? aiResult.categories : [],
      autoAction: ['NONE', 'FLAG', 'HIDE', 'DELETE'].includes(aiResult.autoAction ?? '')
        ? (aiResult.autoAction as ModerationResult['autoAction'])
        : 'NONE',
    }
  } catch (error) {
    // On AI failure: default to allowing (fail-open for availability)
    console.error('[AI Moderation Error]:', error)
    result = {
      isAppropriate: true,
      severity: 'NONE',
      reason: '',
      categories: [],
      autoAction: 'NONE',
    }
  }

  // Log result to database (fire-and-forget — don't block the caller)
  prisma.aiModerationLog
    .create({
      data: {
        contentType,
        contentId,
        contentText: contentText.substring(0, 500),
        isAppropriate: result.isAppropriate,
        severity: result.severity,
        reason: result.reason || null,
        categories: result.categories,
        autoAction: result.autoAction,
      },
    })
    .catch((err) => console.error('[Moderation DB Log Error]:', err))

  return result
}

/**
 * Quick check: is the content appropriate?
 * Lightweight wrapper used at API route level.
 */
export async function isContentAppropriate(contentText: string): Promise<boolean> {
  const result = await moderateContent('COMMENT', 'inline-check', contentText)
  return result.isAppropriate
}
