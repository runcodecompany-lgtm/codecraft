// app/search/page.tsx — AI-Powered Smart Search with Semantic Understanding
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Search, Sparkles, BookOpen, FileText, ArrowLeft, Loader2, Brain, X } from 'lucide-react'

interface CourseResult {
  id: string
  title: string
  slug: string
  description: string
  level: string
  coverImage: string | null
  teacher: { name: string | null } | null
}

interface ArticleResult {
  id: string
  title: string
  slug: string
  content: string
  author: { name: string | null } | null
}

interface SearchResults {
  parsedIntent: {
    keywords: string[]
    topic: string
    difficulty?: string
    contentType?: string
  }
  results: {
    courses: CourseResult[]
    articles: ArticleResult[]
    total: number
  }
  fromCache?: boolean
}

const difficultyLabel: Record<string, string> = {
  BEGINNER: 'مبتدئ',
  INTERMEDIATE: 'متوسط',
  ADVANCED: 'متقدم',
}

const difficultyColor: Record<string, string> = {
  BEGINNER: 'bg-emerald-500/20 text-emerald-400',
  INTERMEDIATE: 'bg-amber-500/20 text-amber-400',
  ADVANCED: 'bg-rose-500/20 text-rose-400',
}

export default function SmartSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const exampleQueries = [
    'تعلم React للمبتدئين',
    'دورة JavaScript متقدمة',
    'كيف أتعلم برمجة الويب',
    'دورات Python وتحليل البيانات',
  ]

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return

    if (searchQuery) setQuery(searchQuery)
    setError('')

    startTransition(async () => {
      try {
        const res = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        })

        if (res.ok) {
          const data = await res.json()
          setResults(data)
        } else {
          setError('حدث خطأ في البحث الذكي. الرجاء المحاولة مرة أخرى.')
        }
      } catch {
        setError('تعذر الاتصال بالخادم لإجراء البحث.')
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* Hero Header */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-16 px-4">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white mb-2 shadow-xl shadow-indigo-500/20">
            <Brain className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black">
            البحث الذكي{' '}
            <span className="bg-gradient-to-l from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              بالذكاء الاصطناعي
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            ابحث بلغتك الطبيعية — سيفهم محرك البحث الذكي ما تحتاجه ويجد لك الدورات والمقالات المناسبة.
          </p>

          {/* Search Input */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='مثال: "أريد دورة React للمبتدئين بالعربية"'
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-2xl px-5 py-4 pr-14 text-sm outline-none text-white placeholder:text-slate-500 transition-colors"
            />
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults(null); }}
                className="absolute left-16 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleSearch()}
              disabled={isPending || !query.trim()}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-l from-indigo-600 to-violet-600 hover:opacity-90 rounded-xl text-white disabled:opacity-50 cursor-pointer transition-all"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
          </div>

          {/* Example Queries */}
          {!results && !isPending && (
            <div className="flex flex-wrap gap-2 justify-center">
              {exampleQueries.map((eq) => (
                <button
                  key={eq}
                  onClick={() => handleSearch(eq)}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 transition-all cursor-pointer"
                >
                  {eq}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        {/* Loading State */}
        {isPending && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="relative">
              <Brain className="w-12 h-12 text-indigo-400 animate-pulse" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
            <div>
              <p className="font-bold text-slate-200 text-sm">جاري تحليل استعلامك وإيجاد أفضل النتائج...</p>
              <p className="text-xs text-slate-500 mt-1">يستخدم المحرك الذكي الذكاء الاصطناعي لفهم طلبك</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isPending && (
          <div className="max-w-lg mx-auto text-center py-16 space-y-4">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Results */}
        {results && !isPending && (
          <div className="space-y-10">
            {/* AI Intent Summary */}
            <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl flex flex-wrap items-center gap-4">
              <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-xs text-indigo-300 font-bold">فهم المحرك الذكي لاستعلامك:</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  الموضوع: <span className="text-white font-semibold">{results.parsedIntent.topic}</span>
                  {results.parsedIntent.keywords?.length > 0 && (
                    <> · الكلمات المفتاحية: <span className="text-indigo-300">{results.parsedIntent.keywords.join('، ')}</span></>
                  )}
                  {results.parsedIntent.difficulty && (
                    <> · المستوى: <span className="text-amber-300">{difficultyLabel[results.parsedIntent.difficulty] || results.parsedIntent.difficulty}</span></>
                  )}
                </p>
              </div>
              <span className="text-xs text-slate-500">{results.results.total} نتيجة</span>
            </div>

            {/* Courses */}
            {results.results.courses.length > 0 && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  الدورات التعليمية ({results.results.courses.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {results.results.courses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      className="group rounded-2xl border border-slate-800 bg-slate-900 hover:border-violet-500/40 hover:bg-slate-800/60 transition-all duration-300 overflow-hidden flex flex-col"
                    >
                      <div className="h-36 bg-gradient-to-br from-violet-900/40 to-indigo-900/40 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-violet-400/50" />
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-2 flex-1">
                            {course.title}
                          </h3>
                          {course.level && (
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${difficultyColor[course.level] || 'bg-slate-700 text-slate-300'}`}>
                              {difficultyLabel[course.level] || course.level}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed flex-grow">
                          {course.description}
                        </p>
                        {course.teacher?.name && (
                          <p className="text-[10px] text-slate-500 mt-auto">المدرب: {course.teacher.name}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Articles */}
            {results.results.articles.length > 0 && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  المقالات التعليمية ({results.results.articles.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.results.articles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="group p-4 rounded-2xl border border-slate-800 bg-slate-900 hover:border-emerald-500/30 hover:bg-slate-800/60 transition-all duration-300"
                    >
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors mb-1.5">
                        {article.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {article.content}
                      </p>
                      {article.author?.name && (
                        <p className="text-[10px] text-slate-500 mt-2">بقلم: {article.author.name}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {results.results.total === 0 && (
              <div className="mx-auto max-w-lg text-center py-16">
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10">
                  <Search className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-white mb-3">لا توجد نتائج</h2>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    لم يجد المحرك الذكي نتائج لـ "{query}". جرّب صياغة مختلفة.
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-violet-600 to-indigo-600 px-6 py-3 font-bold text-sm hover:scale-105 transition-all"
                  >
                    <span>تصفح جميع الدورات</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!results && !isPending && !error && (
          <div className="text-center py-20 text-slate-600 space-y-4">
            <Brain className="w-12 h-12 mx-auto opacity-30" />
            <p className="text-sm">اكتب ما تريد تعلمه بلغتك الطبيعية</p>
          </div>
        )}
      </section>
    </main>
  )
}
