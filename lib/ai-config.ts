// lib/ai-config.ts — AI Configuration Layer
// Supports multiple providers: Groq (primary), Google Gemini (fallback)
// Designed to be extensible for OpenAI, Anthropic, local models in the future

import Groq from "groq-sdk"

// ─── Types ───────────────────────────────────────────────────────────
export type AIProviderName = "groq" | "gemini" | "openai"

export interface AIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface AIGenerateOptions {
  messages: AIMessage[]
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
  stream?: boolean
}

export interface AIResponse {
  content: string
  provider: AIProviderName
  tokensUsed?: number
}

export interface AIStreamChunk {
  content: string
  done: boolean
}

// ─── Rate Limiter (per-user, in-memory) ──────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 20 // 20 requests per minute per user

export function checkAIRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true }
}

// ─── Provider: Groq ──────────────────────────────────────────────────
function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error("GROQ_API_KEY is not set")
  return new Groq({ apiKey })
}

const GROQ_MODEL = "llama-3.3-70b-versatile"

async function groqGenerate(options: AIGenerateOptions): Promise<AIResponse> {
  const groq = getGroqClient()

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
    ...(options.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
  })

  const content = completion.choices[0]?.message?.content || ""
  return {
    content,
    provider: "groq",
    tokensUsed: completion.usage?.total_tokens,
  }
}

async function* groqStream(options: AIGenerateOptions): AsyncGenerator<AIStreamChunk> {
  const groq = getGroqClient()

  const stream = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
    stream: true,
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ""
    if (content) {
      yield { content, done: false }
    }
  }
  yield { content: "", done: true }
}

// ─── Provider: Google Gemini ─────────────────────────────────────────
async function geminiGenerate(options: AIGenerateOptions): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set")

  const { GoogleGenerativeAI } = await import("@google/generative-ai")
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  // Convert messages to Gemini format
  const systemMessage = options.messages.find((m) => m.role === "system")
  const chatMessages = options.messages.filter((m) => m.role !== "system")

  const prompt = [
    systemMessage ? `System: ${systemMessage.content}\n\n` : "",
    ...chatMessages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`),
  ].join("\n")

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  return {
    content: text,
    provider: "gemini",
  }
}

// ─── Unified AI Interface ────────────────────────────────────────────

/**
 * Primary provider order: groq → gemini
 * Falls back to next provider on failure
 */
const PROVIDER_ORDER: AIProviderName[] = ["groq", "gemini"]

const providerGenerators: Record<AIProviderName, (opts: AIGenerateOptions) => Promise<AIResponse>> = {
  groq: groqGenerate,
  gemini: geminiGenerate,
  openai: async () => { throw new Error("OpenAI not configured yet") },
}

/**
 * Generate text using AI with automatic fallback between providers
 */
export async function aiGenerate(options: AIGenerateOptions): Promise<AIResponse> {
  let lastError: Error | null = null

  for (const provider of PROVIDER_ORDER) {
    try {
      return await providerGenerators[provider](options)
    } catch (error) {
      lastError = error as Error
      console.warn(`[AI] Provider ${provider} failed, trying next...`, (error as Error).message)
    }
  }

  throw new Error(`All AI providers failed. Last error: ${lastError?.message}`)
}

/**
 * Stream text using AI (Groq only for now, falls back to non-streaming on failure)
 */
export async function* aiStream(options: AIGenerateOptions): AsyncGenerator<AIStreamChunk> {
  try {
    yield* groqStream(options)
  } catch (error) {
    console.warn("[AI] Streaming failed, falling back to non-streaming:", (error as Error).message)
    const result = await aiGenerate(options)
    yield { content: result.content, done: false }
    yield { content: "", done: true }
  }
}

/**
 * Generate JSON response from AI
 */
export async function aiGenerateJSON<T = Record<string, unknown>>(options: Omit<AIGenerateOptions, "jsonMode">): Promise<T> {
  const response = await aiGenerate({ ...options, jsonMode: true })
  let content = response.content.trim()

  // Strip markdown code block wrappers if present
  if (content.startsWith("```")) {
    content = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()
  }

  try {
    return JSON.parse(content) as T
  } catch (err) {
    // Try to extract JSON array
    const arrayMatch = content.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]) as T
      } catch {}
    }

    // Try to extract JSON object
    const objectMatch = content.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]) as T
      } catch {}
    }

    console.error("[aiGenerateJSON Error]:", err, "Original Content:", response.content)
    throw new Error("Failed to parse AI JSON response: " + (err as Error).message)
  }
}

// ─── System Prompts ──────────────────────────────────────────────────

export const SYSTEM_PROMPTS = {
  LEARNING_ASSISTANT: `أنت مساعد تعليمي ذكي في منصة "Code Craft Core" التعليمية العربية.
مهمتك مساعدة الطلاب في فهم المفاهيم التعليمية بطريقة بسيطة وواضحة.

إرشادات:
- أجب باللغة العربية دائماً
- استخدم أمثلة عملية ومبسطة
- قسّم الإجابات المعقدة إلى نقاط مرتبة
- اذكر مصادر إضافية عند الإمكان
- شجع الطالب وادعمه
- إذا كان السؤال خارج نطاق التعليم، وجّه الطالب بلطف
- استخدم الكود البرمجي مع التفسير عند الحاجة (بين \`\`\` code blocks)
- لا تعطِ إجابات مباشرة للاختبارات، بل ساعد الطالب على الفهم`,

  LESSON_HELPER: `أنت مساعد تعليمي متخصص في شرح محتوى الدروس.
أنت تعمل داخل درس تعليمي محدد وتعرف سياق الدورة والدرس الحالي.

إرشادات:
- اشرح المفاهيم بناءً على محتوى الدرس الحالي
- أعطِ أمثلة إضافية مرتبطة بالموضوع
- بسّط المفاهيم الصعبة
- ربط المفاهيم ببعضها
- أجب باللغة العربية`,

  QUIZ_GENERATOR: `أنت خبير في إنشاء الأسئلة التعليمية. مهمتك توليد أسئلة اختبار عالية الجودة.
يجب أن يكون ردك بصيغة JSON فقط.

أنواع الأسئلة المدعومة:
- MULTIPLE_CHOICE: سؤال مع 4 خيارات وإجابة واحدة صحيحة
- TRUE_FALSE: سؤال صح/خطأ
- MULTIPLE_SELECT: سؤال مع عدة إجابات صحيحة

لكل سؤال يجب تحديد:
- questionText: نص السؤال
- questionType: نوع السؤال
- options: مصفوفة الخيارات
- correctAnswer: الإجابة الصحيحة
- difficulty: BEGINNER أو INTERMEDIATE أو ADVANCED
- points: عدد النقاط (1-3)`,

  SUMMARY_GENERATOR: `أنت خبير في تلخيص المحتوى التعليمي. مهمتك إنشاء ملخصات واضحة ومفيدة.
أجب باللغة العربية. يجب أن يكون ردك بصيغة JSON.`,

  FLASHCARD_GENERATOR: `أنت خبير في إنشاء بطاقات المراجعة التعليمية. مهمتك استخراج المفاهيم المهمة وإنشاء بطاقات مراجعة فعّالة.
أجب باللغة العربية. يجب أن يكون ردك بصيغة JSON.`,

  TEACHER_ASSISTANT: `أنت مساعد ذكي للمعلمين في منصة "Code Craft Core".
مهمتك مساعدة المعلمين في:
- تحسين محتوى الدورات
- اقتراح مواضيع جديدة
- تحليل أداء الطلاب
- اقتراح اختبارات وواجبات
أجب باللغة العربية بشكل احترافي.`,

  CONTENT_MODERATOR: `أنت نظام مراقبة محتوى. مهمتك فحص النصوص واكتشاف:
- السبام أو الإعلانات غير المرغوبة
- الإساءة أو الألفاظ النابية
- المحتوى غير المناسب
- المحتوى المضلل

أجب بصيغة JSON فقط مع الحقول:
- isAppropriate: boolean
- reason: string (سبب الرفض إن وجد)
- severity: "LOW" | "MEDIUM" | "HIGH" | "NONE"
- categories: string[] (أنواع المخالفات المكتشفة)`,

  SMART_SEARCH: `أنت محرك بحث ذكي في منصة تعليمية. مهمتك تحليل استعلام البحث الطبيعي واستخراج:
- الكلمات المفتاحية الرئيسية
- الموضوع المطلوب
- مستوى الصعوبة المطلوب (إن وُجد)
- نوع المحتوى المطلوب (دورة، درس، مقال)

أجب بصيغة JSON فقط.`,

  PERFORMANCE_ANALYZER: `أنت محلل أداء تعليمي ذكي. مهمتك تحليل بيانات أداء الطالب وتقديم:
- نقاط القوة
- نقاط الضعف
- فجوات المعرفة
- اقتراحات تحسين مخصصة
- خطة مراجعة
أجب باللغة العربية بصيغة JSON.`,

  ASSIGNMENT_GENERATOR: `أنت خبير في إنشاء الواجبات والتحديات التعليمية.
مهمتك توليد واجبات عملية وتحديات تعليمية مناسبة لمستوى الطالب.
أجب باللغة العربية بصيغة JSON.`,
} as const

export type SystemPromptKey = keyof typeof SYSTEM_PROMPTS
