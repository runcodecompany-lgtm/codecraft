// app/articles/[slug]/page.tsx
import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { ChevronLeft, Clock, User2, BookOpen, Calendar } from "lucide-react"
import ShareButtons from "@/components/share-buttons"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const article = await prisma.article.findUnique({
    where: { slug, published: true },
    select: { title: true, content: true },
  })
  if (!article) return { title: "المقال غير موجود" }
  return {
    title: `${article.title} — Code Craft Core`,
    description: article.content.replace(/[#*`]/g, "").slice(0, 150),
    alternates: {
      canonical: `/articles/${slug}`
    }
  }
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params

  const article = await prisma.article.findUnique({
    where: { slug, published: true },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      course: { select: { title: true, slug: true } },
    },
  })

  if (!article) notFound()

  // Fetch related articles from same author or course, or latest ones
  const related = await prisma.article.findMany({
    where: { 
      published: true, 
      id: { not: article.id },
      OR: [
        article.courseId ? { courseId: article.courseId } : {},
        { authorId: article.authorId }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { 
      id: true, 
      title: true, 
      slug: true, 
      createdAt: true, 
      author: { select: { name: true } } 
    },
  })

  // Fallback if no specific related articles found
  const finalRelated = related.length > 0 ? related : await prisma.article.findMany({
    where: { published: true, id: { not: article.id } },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { 
      id: true, 
      title: true, 
      slug: true, 
      createdAt: true, 
      author: { select: { name: true } } 
    },
  })

  const readingMinutes = Math.max(1, Math.ceil(article.content.split(" ").length / 200))

  // SEO JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": article.title,
    "datePublished": article.createdAt.toISOString(),
    "dateModified": article.updatedAt.toISOString(),
    "author": {
      "@type": "Person",
      "name": article.author?.name || "معلم بالمنصة"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Code Craft Core",
      "logo": {
        "@type": "ImageObject",
        "url": "https://codecraftcore.com/logo.png" // Fallback logo
      }
    },
    "description": article.content.replace(/[#*`]/g, "").slice(0, 150)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* JSON-LD Script injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header Banner */}
      <div className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            العودة للمقالات
          </Link>

          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              مقالة فنية
            </span>
            {article.course && (
              <Link
                href={`/courses/${article.course.slug}`}
                className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-violet-500/20 transition-colors"
              >
                <BookOpen className="w-3 h-3" />
                {article.course.title}
              </Link>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight tracking-tight">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <User2 className="w-4 h-4 text-indigo-400" />
              {article.author?.name ?? "معلم بالمنصة"}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              {new Date(article.createdAt).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              {readingMinutes} دقائق قراءة
            </span>
          </div>
        </div>
      </div>

      {/* Styled Gradient Cover Image Banner */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className="h-60 sm:h-72 rounded-3xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="text-center relative p-8">
            <h2 className="text-2xl sm:text-3xl font-black text-white/90 leading-tight mb-2">
              {article.title}
            </h2>
            <p className="text-indigo-300/80 text-xs font-semibold uppercase tracking-widest">
              Code Craft Core — المدونة التقنية
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Content */}
        <article className="lg:col-span-2">
          <div
            className="prose prose-invert prose-slate max-w-none
              prose-headings:font-black prose-headings:text-white prose-headings:mt-8 prose-headings:mb-4
              prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
              prose-code:text-violet-300 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-slate-800
              prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-2xl prose-pre:p-5
              prose-blockquote:border-r-4 prose-blockquote:border-l-0 prose-blockquote:border-indigo-500 prose-blockquote:text-slate-450 prose-blockquote:pr-4 prose-blockquote:pl-0 prose-blockquote:italic
              prose-strong:text-white
            "
            style={{ whiteSpace: "pre-wrap", lineHeight: "1.9", fontSize: "16px", color: "#cbd5e1" }}
          >
            {article.content}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-6">
          
          {/* Share Widget */}
          <ShareButtons title={article.title} />

          {/* Author Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h3 className="font-bold text-sm text-slate-450 mb-4 uppercase tracking-wider">الكاتب</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center font-black text-base text-white shadow-sm">
                {article.author?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={article.author.avatar} alt={article.author.name || ""} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  (article.author?.name ?? "K").charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-extrabold text-sm text-white">{article.author?.name ?? "معلم بالمنصة"}</p>
                <p className="text-[11px] text-slate-500 font-bold">معلم في Code Craft Core</p>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          {finalRelated.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-450 uppercase tracking-wider pb-2 border-b border-slate-850">مقالات ذات صلة</h3>
              <ul className="space-y-3">
                {finalRelated.map((r) => (
                  <li key={r.id} className="group">
                    <Link
                      href={`/articles/${r.slug}`}
                      className="block text-sm text-slate-350 hover:text-indigo-400 transition-colors leading-snug font-semibold"
                    >
                      {r.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-550">
                      <span>{r.author?.name}</span>
                      <span>·</span>
                      <span>
                        {new Date(r.createdAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}
