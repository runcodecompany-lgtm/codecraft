// app/api/ai/teacher-analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { aiGenerateJSON, SYSTEM_PROMPTS } from '@/lib/ai-config'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isTeacherOrAdmin = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(session.role)
    if (!isTeacherOrAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { payload } = await req.json()
    const { courses = [], stats = {} } = payload || {}

    const prompt = `أنت مستشار تعليمي خبير. قم بتحليل بيانات أداء المعلم التالية وقدّم تقريراً ذكياً وشاملاً:

إحصائيات عامة:
- إجمالي الدورات: ${stats.totalCourses}
- إجمالي الطلاب المسجلين: ${stats.totalStudents}
- إجمالي التقييمات: ${stats.totalReviews}
- متوسط التقييم العام: ${stats.avgRating > 0 ? stats.avgRating + ' / 5' : 'لا يوجد بعد'}

بيانات الدورات:
${JSON.stringify(courses, null, 2)}

أجب بصيغة JSON باللغة العربية يحتوي على الحقول التالية:
- overallInsight: فقرة تقييمية شاملة للأداء العام للمعلم ومستوى دوراته
- strengths: مصفوفة بأبرز 3-5 نقاط قوة يجب الحفاظ عليها وتعزيزها
- weaknesses: مصفوفة بأبرز 3-5 نقاط تحتاج إلى تحسين وكيفية معالجتها
- recommendations: مصفوفة بـ 4-6 توصيات عملية ومحددة لرفع جودة التدريس والدورات
- studentEngagement: وصف لمستوى تفاعل الطلاب وكيفية تعزيزه
- riskStudents: ملاحظات حول الطلاب الذين قد يحتاجون إلى اهتمام إضافي بناءً على البيانات
- successFactors: مصفوفة بعوامل النجاح الرئيسية التي تميز هذا المعلم`

    const result = await aiGenerateJSON({
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.TEACHER_ASSISTANT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Teacher Analytics API Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
