// app/api/ai/teacher-assistant/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { aiGenerateJSON, SYSTEM_PROMPTS } from '@/lib/ai-config'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isTeacherOrAdmin = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(session.role)
    if (!isTeacherOrAdmin) {
      return NextResponse.json({ error: 'Forbidden. Teacher or Admin role required.' }, { status: 403 })
    }

    const { action, payload } = await req.json()
    if (!action) {
      return NextResponse.json({ error: 'Action parameter is required' }, { status: 400 })
    }

    let prompt = ''
    
    switch (action) {
      case 'IMPROVE_COURSE': {
        const { courseTitle, courseDescription } = payload || {}
        if (!courseTitle) return NextResponse.json({ error: 'courseTitle is required' }, { status: 400 })
        
        prompt = `بصفتك مستشاراً تعليمياً، يرجى تقديم مقترحات مفصلة لتحسين الدورة التدريبية التالية:
        عنوان الدورة: ${courseTitle}
        وصف الدورة: ${courseDescription || 'غير محدد'}
        
        يرجى إرجاع النتيجة بصيغة JSON تحتوي على الحقول التالية باللغة العربية:
        - targetAudience: الفئة المستهدفة المناسبة لهذه الدورة
        - prerequisites: المتطلبات الأساسية المقترحة قبل البدء بالدورة
        - recommendedModules: مصفوفة تحتوي على مقترحات لـ 5 وحدات تعليمية (تحتوي على title و description)
        - dynamicKeywords: كلمات مفتاحية مقترحة لتسويق الدورة
        - improvementTips: نصائح عامة لتحسين جودة محتوى الدورة وعرضه`
        break
      }
      
      case 'SUGGEST_TOPICS': {
        const { specialty } = payload || {}
        if (!specialty) return NextResponse.json({ error: 'specialty is required' }, { status: 400 })
        
        prompt = `بصفتك مستشاراً ومصمماً للمناهج التعليمية البرمجية، اقترح موضوعات جديدة وعصرية مطلوبة في سوق العمل لتدريسها للطلاب في مجال: ${specialty}.
        
        يرجى إرجاع النتيجة بصيغة JSON تحتوي على الحقول التالية باللغة العربية:
        - trendingTopics: مصفوفة تحتوي على 3-5 مواضيع برمجية رائجة في هذا المجال (تحتوي على topicName و reason)
        - suggestedCourses: مصفوفة تحتوي على مقترحات لـ 3 دورات جديدة كاملة (تحتوي على title و brief و difficulty)
        - toolsAndLibraries: مصفوفة تحتوي على أدوات ومكتبات حديثة يوصى بدمجها في المناهج`
        break
      }

      case 'ANALYZE_FEEDBACK': {
        const { reviews } = payload || {}
        if (!Array.isArray(reviews) || reviews.length === 0) {
          return NextResponse.json({ error: 'reviews array is required and must not be empty' }, { status: 400 })
        }
        
        prompt = `بصفتك محللاً تربوياً، يرجى تحليل تعليقات ومراجعات الطلاب التالية للدورة التدريبية وتقديم ملخص تحليلي:
        التعليقات:
        ${JSON.stringify(reviews, null, 2)}
        
        يرجى إرجاع النتيجة بصيغة JSON تحتوي على الحقول التالية باللغة العربية:
        - sentimentSummary: ملخص للمشاعر العامة للطلاب (إيجابية، سلبية، محايدة) ونسبتها التقريبية
        - majorStrengths: مصفوفة تحتوي على أبرز نقاط القوة التي أشاد بها الطلاب
        - majorComplaints: مصفوفة تحتوي على أبرز المشاكل أو النقاط التي اشتكى منها الطلاب
        - actionPlan: خطوات عملية وموصى بها للمعلم لتحسين الدورة بناءً على التقييمات`
        break
      }

      case 'GENERATE_SUMMARY': {
        const { text, level = 'MEDIUM' } = payload || {}
        if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })
        const lengthGuide = { SHORT: 'مختصر جداً لا يتجاوز 100 كلمة', MEDIUM: 'متوازن في حدود 250 كلمة', DETAILED: 'تفصيلي في حدود 500 كلمة' }[level as string] || 'متوازن'
        prompt = `الرجاء تلخيص النص التعليمي التالي بمستوى ${level} (${lengthGuide}).\n\nالنص:\n"""\n${String(text).substring(0, 4000)}\n"""\n\nأجب بصيغة JSON باللغة العربية يحتوي على:\n- brief: نص الملخص الرئيسي\n- keyPoints: مصفوفة بالنقاط الأساسية المستخلصة\n- conclusion: خلاصة أو توصية`
        break
      }

      default:
        return NextResponse.json({ error: 'Unsupported teacher assistant action' }, { status: 400 })
    }

    const aiResponse = await aiGenerateJSON({
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.TEACHER_ASSISTANT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
    })

    return NextResponse.json(aiResponse)
  } catch (error: any) {
    console.error('[Teacher Assistant API Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
