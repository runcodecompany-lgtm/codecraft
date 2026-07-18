// app/dashboard/teacher/ai-tools/tools-client.tsx
'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  BookOpen,
  Lightbulb,
  MessageSquare,
  Loader2,
  Check,
  Copy,
  ChevronLeft,
  FileQuestion,
  ClipboardList,
  FileText,
  CheckCircle2,
  XCircle,
  Code2,
  Star,
} from 'lucide-react'

interface CourseReview {
  comment: string
  rating: number
}

interface CourseOption {
  id: string
  title: string
  reviews: CourseReview[]
}

interface TeacherAIToolsClientProps {
  initialCourses: CourseOption[]
}

type ToolTab =
  | 'IMPROVE_COURSE'
  | 'SUGGEST_TOPICS'
  | 'ANALYZE_FEEDBACK'
  | 'GENERATE_QUIZ'
  | 'GENERATE_ASSIGNMENT'
  | 'GENERATE_SUMMARY'

const TOOLS: { id: ToolTab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'IMPROVE_COURSE', label: 'تحسين هيكلة الدورة', icon: BookOpen, color: 'indigo' },
  { id: 'SUGGEST_TOPICS', label: 'اقتراح مواضيع جديدة', icon: Lightbulb, color: 'indigo' },
  { id: 'ANALYZE_FEEDBACK', label: 'محلل ملاحظات الطلاب', icon: MessageSquare, color: 'indigo' },
  { id: 'GENERATE_QUIZ', label: 'منشئ الاختبارات الذكية', icon: FileQuestion, color: 'violet' },
  { id: 'GENERATE_ASSIGNMENT', label: 'منشئ الواجبات البرمجية', icon: ClipboardList, color: 'violet' },
  { id: 'GENERATE_SUMMARY', label: 'منشئ ملخصات المحتوى', icon: FileText, color: 'violet' },
]

export default function TeacherAIToolsClient({ initialCourses }: TeacherAIToolsClientProps) {
  const [activeTab, setActiveTab] = useState<ToolTab>('IMPROVE_COURSE')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Shared form states
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [customReviewsText, setCustomReviewsText] = useState('')

  // Quiz states
  const [quizTopic, setQuizTopic] = useState('')
  const [quizCount, setQuizCount] = useState('5')
  const [quizDifficulty, setQuizDifficulty] = useState('MIXED')

  // Assignment states
  const [assignmentTopic, setAssignmentTopic] = useState('')
  const [assignmentDifficulty, setAssignmentDifficulty] = useState('BEGINNER')

  // Summary states
  const [summaryLessonId, setSummaryLessonId] = useState('')
  const [summaryText, setSummaryText] = useState('')
  const [summaryLevel, setSummaryLevel] = useState('MEDIUM')

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      if (activeTab === 'IMPROVE_COURSE' || activeTab === 'SUGGEST_TOPICS' || activeTab === 'ANALYZE_FEEDBACK') {
        let payload: any = {}
        if (activeTab === 'IMPROVE_COURSE') {
          payload = { courseTitle, courseDescription: courseDesc }
        } else if (activeTab === 'SUGGEST_TOPICS') {
          payload = { specialty }
        } else {
          let reviewsToAnalyze: CourseReview[] = []
          const course = initialCourses.find(c => c.id === selectedCourseId)
          if (course && course.reviews.length > 0) {
            reviewsToAnalyze = course.reviews
          } else if (customReviewsText.trim()) {
            reviewsToAnalyze = customReviewsText.split('\n').filter(Boolean).map(text => ({ comment: text, rating: 4 }))
          } else {
            alert('الرجاء اختيار دورة تحتوي على مراجعات أو كتابة مراجعات مخصصة.')
            setIsLoading(false)
            return
          }
          payload = { reviews: reviewsToAnalyze }
        }

        const res = await fetch('/api/ai/teacher-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: activeTab, payload }),
        })
        const data = res.ok ? await res.json() : await res.json().then(e => { throw new Error(e.error) })
        setResult(data)

      } else if (activeTab === 'GENERATE_QUIZ') {
        const res = await fetch('/api/ai/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topics: quizTopic, difficulty: quizDifficulty, count: parseInt(quizCount) }),
        })
        const data = res.ok ? await res.json() : await res.json().then(e => { throw new Error(e.error) })
        setResult(data)

      } else if (activeTab === 'GENERATE_ASSIGNMENT') {
        const res = await fetch('/api/ai/generate-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: assignmentTopic, difficulty: assignmentDifficulty }),
        })
        const data = res.ok ? await res.json() : await res.json().then(e => { throw new Error(e.error) })
        setResult(data)

      } else if (activeTab === 'GENERATE_SUMMARY') {
        // For summary without lessonId, we call teacher-assistant with custom text
        const res = await fetch('/api/ai/teacher-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'GENERATE_SUMMARY',
            payload: { text: summaryText, level: summaryLevel }
          }),
        })
        if (!res.ok) {
          // Fallback: generate locally via teacher-assistant
          const errData = await res.json()
          throw new Error(errData.error || 'فشل توليد الملخص')
        }
        const data = await res.json()
        setResult(data)
      }
    } catch (error: any) {
      console.error('Teacher AI tools error:', error)
      alert(error.message || 'تعذر الاتصال بالخادم الذكي.')
    } finally {
      setIsLoading(false)
    }
  }

  const switchTab = (tab: ToolTab) => {
    setActiveTab(tab)
    setResult(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sidebar Controls */}
      <div className="lg:col-span-1 space-y-4">
        {/* Tools Navigation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-800">
            <h3 className="font-bold text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              اختر الأداة الذكية
            </h3>
          </div>

          <div className="p-2 space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 px-3 pt-2 pb-1">أدوات المناهج</p>
            {TOOLS.slice(0, 3).map(tool => {
              const Icon = tool.icon
              const active = activeTab === tool.id
              return (
                <button
                  key={tool.id}
                  onClick={() => switchTab(tool.id)}
                  className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {tool.label}
                </button>
              )
            })}

            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 px-3 pt-3 pb-1">منشئو المحتوى</p>
            {TOOLS.slice(3).map(tool => {
              const Icon = tool.icon
              const active = activeTab === tool.id
              return (
                <button
                  key={tool.id}
                  onClick={() => switchTab(tool.id)}
                  className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    active ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {tool.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Inputs Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-bold text-xs border-b border-slate-800 pb-2 mb-3 text-slate-200">مدخلات الأداة</h3>

            {/* IMPROVE_COURSE */}
            {activeTab === 'IMPROVE_COURSE' && (
              <>
                <InputField label="عنوان الدورة الحالي:" required>
                  <input type="text" required value={courseTitle} onChange={e => setCourseTitle(e.target.value)}
                    placeholder="مثال: أساسيات React للمبتدئين" className={inputCls} />
                </InputField>
                <InputField label="وصف أو أهداف الدورة (اختياري):">
                  <textarea rows={4} value={courseDesc} onChange={e => setCourseDesc(e.target.value)}
                    placeholder="اكتب فكرة عامة عن الدورة..." className={`${inputCls} resize-none`} />
                </InputField>
              </>
            )}

            {/* SUGGEST_TOPICS */}
            {activeTab === 'SUGGEST_TOPICS' && (
              <InputField label="المجال / التخصص البرمجي:" required>
                <input type="text" required value={specialty} onChange={e => setSpecialty(e.target.value)}
                  placeholder="مثال: تطوير واجهات الويب، الذكاء الاصطناعي" className={inputCls} />
              </InputField>
            )}

            {/* ANALYZE_FEEDBACK */}
            {activeTab === 'ANALYZE_FEEDBACK' && (
              <>
                <InputField label="اختر من دوراتك الحالية:">
                  <select value={selectedCourseId} onChange={e => { setSelectedCourseId(e.target.value); if (e.target.value) setCustomReviewsText('') }}
                    className={`${inputCls} cursor-pointer`}>
                    <option value="">-- اختر دورة --</option>
                    {initialCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.title} ({c.reviews.length} مراجعة)</option>
                    ))}
                  </select>
                </InputField>
                <div className="text-center text-[10px] text-slate-500">— أو اكتب تعليقات مخصصة —</div>
                <InputField label="ألصق تعليقات الطلاب (كل تعليق في سطر):">
                  <textarea rows={5} value={customReviewsText}
                    onChange={e => { setCustomReviewsText(e.target.value); if (e.target.value) setSelectedCourseId('') }}
                    placeholder={"الشرح رائع ولكن الفيديوهات طويلة.\nلم أفهم الجزء العملي."}
                    className={`${inputCls} resize-none`} />
                </InputField>
              </>
            )}

            {/* GENERATE_QUIZ */}
            {activeTab === 'GENERATE_QUIZ' && (
              <>
                <InputField label="موضوع الاختبار:" required>
                  <input type="text" required value={quizTopic} onChange={e => setQuizTopic(e.target.value)}
                    placeholder="مثال: مفاهيم JavaScript الأساسية - الحلقات والدوال"
                    className={inputCls} />
                </InputField>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="عدد الأسئلة:">
                    <select value={quizCount} onChange={e => setQuizCount(e.target.value)} className={`${inputCls} cursor-pointer`}>
                      {['3','5','8','10'].map(n => <option key={n} value={n}>{n} أسئلة</option>)}
                    </select>
                  </InputField>
                  <InputField label="مستوى الصعوبة:">
                    <select value={quizDifficulty} onChange={e => setQuizDifficulty(e.target.value)} className={`${inputCls} cursor-pointer`}>
                      <option value="MIXED">مختلط</option>
                      <option value="BEGINNER">مبتدئ</option>
                      <option value="INTERMEDIATE">متوسط</option>
                      <option value="ADVANCED">متقدم</option>
                    </select>
                  </InputField>
                </div>
              </>
            )}

            {/* GENERATE_ASSIGNMENT */}
            {activeTab === 'GENERATE_ASSIGNMENT' && (
              <>
                <InputField label="موضوع الواجب البرمجي:" required>
                  <input type="text" required value={assignmentTopic} onChange={e => setAssignmentTopic(e.target.value)}
                    placeholder="مثال: بناء نظام تسجيل دخول بـ Node.js"
                    className={inputCls} />
                </InputField>
                <InputField label="مستوى الصعوبة:">
                  <select value={assignmentDifficulty} onChange={e => setAssignmentDifficulty(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="BEGINNER">مبتدئ</option>
                    <option value="INTERMEDIATE">متوسط</option>
                    <option value="ADVANCED">متقدم</option>
                  </select>
                </InputField>
              </>
            )}

            {/* GENERATE_SUMMARY */}
            {activeTab === 'GENERATE_SUMMARY' && (
              <>
                <InputField label="محتوى الدرس أو النص المراد تلخيصه:" required>
                  <textarea rows={6} required value={summaryText} onChange={e => setSummaryText(e.target.value)}
                    placeholder="الصق محتوى الدرس أو النص التعليمي هنا..."
                    className={`${inputCls} resize-none`} />
                </InputField>
                <InputField label="مستوى التلخيص:">
                  <select value={summaryLevel} onChange={e => setSummaryLevel(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="SHORT">مختصر جداً</option>
                    <option value="MEDIUM">متوازن</option>
                    <option value="DETAILED">تفصيلي</option>
                  </select>
                </InputField>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-xs font-bold shadow-lg cursor-pointer disabled:opacity-50 transition-opacity hover:opacity-90 ${
                activeTab.startsWith('GENERATE')
                  ? 'bg-gradient-to-l from-violet-600 to-purple-600 shadow-violet-500/10'
                  : 'bg-gradient-to-l from-indigo-600 to-violet-600 shadow-indigo-500/10'
              }`}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-300" />}
              {isLoading ? 'جاري المعالجة بالذكاء الاصطناعي...' : 'توليد بالذكاء الاصطناعي'}
            </button>
          </form>
        </div>
      </div>

      {/* Results Workspace */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-start min-h-[400px]">
        {isLoading ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-12 space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <div>
              <p className="font-bold text-sm text-slate-200">جاري الاتصال بالذكاء الاصطناعي...</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[280px] leading-relaxed">
                يعمل النموذج الذكي على تحليل المدخلات وتوليد المحتوى بدقة عالية.
              </p>
            </div>
          </div>
        ) : !result ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-12 text-slate-500">
            <Sparkles className="w-12 h-12 mb-3 opacity-30 text-indigo-400" />
            <h4 className="font-bold text-xs text-slate-400">مساحة المعاينة التفاعلية</h4>
            <p className="text-[10px] text-slate-500 max-w-[250px] mt-1 leading-relaxed">
              اختر الأداة، أدخل البيانات المطلوبة ثم انقر على توليد لمعاينة المخرجات هنا.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-sm">
              {TOOLS.map(t => {
                const Icon = t.icon
                return (
                  <button key={t.id} onClick={() => switchTab(t.id)}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-colors ${
                      activeTab === t.id ? 'border-indigo-700 bg-indigo-950/40' : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                    }`}>
                    <Icon className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                    <p className="text-[8px] text-slate-400 leading-tight">{t.label}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-black text-sm text-indigo-400">النتيجة المولّدة بالذكاء الاصطناعي</span>
              <button onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 cursor-pointer">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'تم النسخ' : 'نسخ التقرير'}
              </button>
            </div>

            {/* ── IMPROVE_COURSE ── */}
            {activeTab === 'IMPROVE_COURSE' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card title="🎯 الفئة المستهدفة:" text={result.targetAudience} />
                  <Card title="📚 المتطلبات الأساسية:" text={result.prerequisites} />
                </div>
                <Section title="💡 الوحدات التعليمية المقترحة:">
                  <div className="space-y-2">
                    {result.recommendedModules?.map((mod: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-850 bg-slate-950/30 flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] flex-shrink-0">{idx + 1}</span>
                        <div>
                          <p className="font-bold text-xs text-slate-200">{mod.title}</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{mod.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
                <div className="p-4 rounded-xl border border-indigo-900/30 bg-indigo-950/10">
                  <h4 className="font-bold text-xs text-indigo-400 mb-2">💡 كلمات مفتاحية للتسويق (SEO):</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.dynamicKeywords?.map((kw: string, idx: number) => (
                      <span key={idx} className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-950/40 text-indigo-400 border border-indigo-900/30">{kw}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] text-slate-500 font-bold">⚙️ نصائح لتحسين جودة عرض المادة:</h4>
                  <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-line">{result.improvementTips}</p>
                </div>
              </div>
            )}

            {/* ── SUGGEST_TOPICS ── */}
            {activeTab === 'SUGGEST_TOPICS' && (
              <div className="space-y-5">
                <Section title="🔥 المواضيع الأكثر طلباً (Trending):">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.trendingTopics?.map((topic: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-850 bg-slate-950/40">
                        <p className="font-bold text-xs text-slate-200">{topic.topicName}</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-1">{topic.reason}</p>
                      </div>
                    ))}
                  </div>
                </Section>
                <Section title="💡 دورات كاملة مقترحة:">
                  <div className="space-y-2.5">
                    {result.suggestedCourses?.map((course: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-xs text-slate-200">{course.title}</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{course.brief}</p>
                        </div>
                        <span className="px-2.5 py-1 text-[9px] font-bold rounded-lg bg-indigo-600 text-white self-start md:self-center whitespace-nowrap">
                          {course.difficulty === 'BEGINNER' ? 'مبتدئ' : course.difficulty === 'INTERMEDIATE' ? 'متوسط' : 'متقدم'}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
                <Section title="⚙️ أدوات ومكتبات يوصى بتدريسها:">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.toolsAndLibraries?.map((tool: any, idx: number) => {
                      const isObj = tool && typeof tool === 'object'
                      const name = isObj ? (tool.toolName || tool.name || tool.title || String(Object.values(tool)[0])) : tool
                      const desc = isObj ? (tool.description || tool.brief || tool.reason || null) : null
                      return (
                        <div key={idx} className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
                          <p className="font-bold text-xs text-slate-200">{String(name)}</p>
                          {desc && <p className="text-[10px] text-slate-400 leading-relaxed">{String(desc)}</p>}
                        </div>
                      )
                    })}
                  </div>
                </Section>
              </div>
            )}

            {/* ── ANALYZE_FEEDBACK ── */}
            {activeTab === 'ANALYZE_FEEDBACK' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850">
                  <h4 className="text-[10px] text-slate-500 font-bold mb-1">📊 ملخص المشاعر العامة (Sentiment Analysis):</h4>
                  <p className="text-xs text-slate-350 leading-relaxed">{result.sentimentSummary}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400">✔️ نقاط القوة الإيجابية:</h4>
                    <ul className="text-xs text-slate-350 list-disc pr-4 space-y-1">
                      {result.majorStrengths?.map((str: string, idx: number) => <li key={idx}>{str}</li>)}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-rose-400">⚠️ الشكاوى ونقاط القصور:</h4>
                    <ul className="text-xs text-slate-350 list-disc pr-4 space-y-1">
                      {result.majorComplaints?.map((comp: string, idx: number) => <li key={idx}>{comp}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-indigo-900/30 bg-indigo-950/15">
                  <h4 className="font-bold text-xs text-indigo-400 mb-2">📋 خطة العمل الموصى بها:</h4>
                  <div className="space-y-2">
                    {result.actionPlan?.map((plan: string, idx: number) => (
                      <div key={idx} className="flex gap-2 text-xs text-slate-300 items-start">
                        <ChevronLeft className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span>{plan}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── GENERATE_QUIZ ── */}
            {activeTab === 'GENERATE_QUIZ' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileQuestion className="w-4 h-4 text-violet-400" />
                  <h3 className="font-bold text-sm text-violet-300">{result.title || 'الاختبار الذكي المولّد'}</h3>
                </div>
                <div className="space-y-3">
                  {(result.questions || []).map((q: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-950/30 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">{idx + 1}</span>
                        <p className="text-xs font-semibold text-slate-200 leading-relaxed">{q.questionText}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-9">
                        {q.options?.map((opt: string, oi: number) => {
                          const isCorrect = opt === q.correctAnswer
                          return (
                            <div key={oi} className={`flex items-center gap-2 p-2 rounded-lg text-[11px] border ${
                              isCorrect ? 'border-emerald-700/50 bg-emerald-950/30 text-emerald-400' : 'border-slate-800 bg-slate-900/30 text-slate-400'
                            }`}>
                              {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-slate-600" />}
                              {opt}
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex gap-3 pr-9">
                        <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">{q.difficulty === 'BEGINNER' ? 'مبتدئ' : q.difficulty === 'INTERMEDIATE' ? 'متوسط' : 'متقدم'}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-violet-950/40 text-violet-400">{q.points} نقطة</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── GENERATE_ASSIGNMENT ── */}
            {activeTab === 'GENERATE_ASSIGNMENT' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-violet-400" />
                    <h3 className="font-bold text-sm text-violet-300">{result.title || 'الواجب البرمجي المولّد'}</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[9px] px-2 py-1 rounded bg-violet-950/40 text-violet-400 font-bold border border-violet-900/30">{result.points} نقطة</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                  <h4 className="text-[10px] text-slate-500 font-bold mb-2">📋 وصف الواجب:</h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{result.description}</p>
                </div>
                {result.starterCode && (
                  <div className="rounded-xl border border-slate-800 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                      <Code2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] text-slate-400 font-mono">الكود البدئي (Starter Code)</span>
                    </div>
                    <pre className="p-4 text-[11px] text-emerald-300 font-mono bg-slate-950 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                      {result.starterCode}
                    </pre>
                  </div>
                )}
                {result.testCases && result.testCases.length > 0 && (
                  <Section title="🧪 حالات الاختبار المقترحة:">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.testCases.map((tc: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 font-mono text-[10px] space-y-1">
                          <div className="text-slate-400"><span className="text-slate-600">Input: </span>{tc.input}</div>
                          <div className="text-emerald-400"><span className="text-slate-600">Output: </span>{tc.output}</div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            )}

            {/* ── GENERATE_SUMMARY (fallback - server error) ── */}
            {activeTab === 'GENERATE_SUMMARY' && (
              <div className="space-y-4">
                {result.content ? (
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{result.content}</pre>
                  </div>
                ) : (
                  <>
                    {result.brief && (
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                        <h4 className="text-[10px] text-slate-500 font-bold mb-2">📝 الملخص:</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{result.brief}</p>
                      </div>
                    )}
                    {result.keyPoints && (
                      <Section title="💡 النقاط الرئيسية:">
                        <ul className="text-xs text-slate-350 list-disc pr-4 space-y-1.5">
                          {result.keyPoints.map((pt: string, idx: number) => <li key={idx}>{pt}</li>)}
                        </ul>
                      </Section>
                    )}
                    {result.conclusion && (
                      <div className="p-4 rounded-xl border border-indigo-900/30 bg-indigo-950/15">
                        <h4 className="text-[10px] text-indigo-400 font-bold mb-1">🎓 الخلاصة:</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{result.conclusion}</p>
                      </div>
                    )}
                    {!result.brief && !result.keyPoints && !result.conclusion && (
                      <pre className="text-xs text-slate-400 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helper sub-components ──────────────────────────────────────
function InputField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] text-slate-400 block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function Card({ title, text }: { title: string; text?: string }) {
  return (
    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-1">
      <h4 className="text-[10px] text-slate-500 font-bold">{title}</h4>
      <p className="text-xs text-slate-350">{text}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="font-bold text-xs text-indigo-300">{title}</h4>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-xl px-3 py-2 text-xs outline-none text-white'
