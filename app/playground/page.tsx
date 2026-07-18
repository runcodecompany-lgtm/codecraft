import React from "react"
import { getServerSession } from "@/lib/auth"
import CodeChallenge from "@/components/code-challenge"
import AdaptiveQuiz from "@/components/adaptive-quiz"
import { Sparkles, Terminal, BookOpen, AlertCircle } from "lucide-react"

export const metadata = {
  title: "المساحة التفاعلية (Playground) | Code Craft Core",
  description: "مساحة التجارب والاختبارات التفاعلية التكيفية وتحديات البرمجة الحية.",
}

const challengeRules = [
  {
    type: "contains" as const,
    target: "<h1>تعلم البرمجة مع Code Craft Core</h1>",
    errorMessage: "يجب كتابة النص 'تعلم البرمجة مع Code Craft Core' بدقة داخل وسم <h1>.",
  },
  {
    type: "not_contains" as const,
    target: "<h6>",
    errorMessage: "يرجى إزالة أي وسوم <h6> من صفحتك التفاعلية.",
  },
]

export default async function PlaygroundPage() {
  const session = await getServerSession()
  const currentCoins = session?.craftCoins ?? 100 // Fallback to 100 for guest testing

  return (
    <main className="min-h-screen bg-slate-950 text-white py-16" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-300 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            <span>المرحلة الرابعة: محركات التعلم التفاعلية</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black">
            المساحة{" "}
            <span className="bg-gradient-to-l from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              التفاعلية التجريبية
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            اختبر أدوات التفاعل البرمجية والامتحانات التكيفية التي قمنا ببنائها. يتم تسجيل جميع المكافآت والتقدم بأمان عبر خوادمنا.
          </p>
        </div>

        {/* Section 1: Code Challenge Workspace */}
        <div className="space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Terminal className="w-6 h-6 text-violet-400" />
              <span>1. تحدي البرمجة الحي (Live Code Challenge)</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">محرر Monaco المدمج مع التحقق الفوري والدقة من خلال Server Actions.</p>
          </div>

          {!session && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3 text-amber-300 max-w-4xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                أنت تقوم بالتجربة كزائر. لن يتم حفظ عملاتك أو تقدمك في قاعدة البيانات. 
                قم بتسجيل الدخول لحفظ إنجازاتك.
              </p>
            </div>
          )}

          <CodeChallenge
            lessonId="html-headings-challenge"
            title="تحدي العناوين الرئيسية (HTML Headings)"
            instructions={`المهمة المطلوبة:\nأضف وسم عنوان رئيسي من المستوى الأول <h1> وبداخله النص 'تعلم البرمجة مع Code Craft Core' تماماً داخل وسم <body>.\n\nعند الانتهاء، اضغط على 'تشغيل العرض' لمعاينة النتيجة، ثم انقر على 'تحقق من الحل' ليقوم النظام بالتحقق والحصول على مكافأتك.`}
            initialCode={`<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #0f172a;
      color: white;
      text-align: center;
      font-family: system-ui, sans-serif;
      padding: 40px;
    }
    h1 {
      color: #a78bfa;
      text-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
    }
  </style>
</head>
<body>
  <!-- اكتب كود العنوان الرئيسي <h1> هنا -->
  
</body>
</html>`}
            validationRules={challengeRules}
            initialCoins={currentCoins}
            hintText="استخدم الوسم <h1> لفتح العنوان واغلقه بـ </h1> مع إدراج النص المطلوب بدقة وبدون فراغات زائدة."
          />
        </div>

        {/* Section 2: Adaptive Quiz Engine */}
        <div className="space-y-6 pt-8">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>2. محرك الاختبارات التكيفي (Adaptive Quiz Engine)</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">تتغير صعوبة الأسئلة ديناميكياً بناءً على إجاباتك السابقة مع مكافآت العملات ونقاط الخبرة.</p>
          </div>

          <AdaptiveQuiz quizId="demo-quiz" />
        </div>
      </div>
    </main>
  )
}
