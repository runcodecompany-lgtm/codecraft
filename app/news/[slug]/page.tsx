export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Calendar, 
  User as UserIcon, 
  Tag, 
  Share2, 
  ChevronRight,
  Clock
} from "lucide-react";
import { Post } from "@/types";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// توليد Metadata الديناميكية لتحسين SEO
export async function generateMetadata(
  { params }: PostPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: { category: true, author: true }
    });

    if (!post) return { title: "الخبر غير موجود" };

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    return {
      title: `${post.title}`,
      description: post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>/g, ''),
      keywords: post.keywords?.join(', '),
      alternates: {
        canonical: `${baseUrl}/news/${post.slug}`,
      },
      openGraph: {
        title: post.title,
        description: post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>/g, ''),
        url: `${baseUrl}/news/${post.slug}`,
        siteName: 'موقع أخبارنا',
        locale: 'ar_SA',
        type: 'article',
        publishedTime: post.createdAt.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        authors: [post.author?.name || 'الكاتب'],
        section: post.category.name,
        images: post.mainImage ? [{ url: post.mainImage }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>/g, ''),
        images: post.mainImage ? [post.mainImage] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return { title: "أخبارنا" };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  let post: Post | null = null;
  let relatedPosts: Post[] = [];

  try {
    post = await prisma.post.findUnique({
      where: { slug },
      include: {
        category: true,
        author: true,
      },
    }) as unknown as Post | null;

    if (post && post.published) {
      // زيادة عدد المشاهدات فقط في بيئة الإنتاج وليس أثناء البناء
      if (process.env.NODE_ENV === 'production') {
        await prisma.post.update({
          where: { id: post.id },
          data: { views: { increment: 1 } }
        }).catch(() => {});
      }

      // جلب أخبار متعلقة
      relatedPosts = await prisma.post.findMany({
        where: {
          categoryId: post.categoryId,
          id: { not: post.id },
          published: true
        },
        take: 3,
        orderBy: { createdAt: 'desc' }
      }) as unknown as Post[];
    }
  } catch (error) {
    console.error("Error fetching post data:", error);
  }

  if (!post || !post.published) {
    notFound();
  }

  // حساب وقت القراءة التقريبي
  const wordsPerMinute = 200;
  const wordCount = post.content.split(/\s+/g).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);

  // بيانات JSON-LD للـ Google Article Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "image": post.mainImage ? [post.mainImage] : [],
    "datePublished": post.createdAt.toISOString(),
    "dateModified": post.updatedAt.toISOString(),
    "author": [{
      "@type": "Person",
      "name": post.author?.name || "كاتب الموقع",
      "url": "#"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "موقع أخبارنا",
      "logo": {
        "@type": "ImageObject",
        "url": "/logo.png" // تأكد من وجود شعار
      }
    },
    "description": post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>/g, ''),
    "keywords": post.keywords?.join(', ')
  };

  return (
    <article className="min-h-screen bg-white" dir="rtl">
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600 transition-colors">الرئيسية</Link>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <Link href={`/category/${post.category?.slug || ''}`} className="hover:text-blue-600 transition-colors">
{post.category?.name || 'غير مصنف'}
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-gray-400 truncate max-w-[200px]">{post.title}</span>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Category Badge */}
          <Link 
            href={`/category/${post.category?.slug || ''}`}
            className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-md mb-6 hover:bg-blue-700 transition-colors"
          >
            {post.category?.name || 'غير مصنف'}
          </Link>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            {post.title}
          </h1>

          {/* Post Meta */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-500 text-sm mb-8 border-y py-4 border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="font-medium text-gray-900">{post.author?.name || 'الكاتب'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <time dateTime={post.createdAt.toISOString()}>
                {format(post.createdAt, 'dd MMMM yyyy', { locale: ar })}
              </time>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{readingTime} دقائق قراءة</span>
            </div>

            <div className="flex items-center gap-2 mr-auto">
              <div className="flex items-center gap-2">
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + (process.env.NEXT_PUBLIC_SITE_URL || '') + '/news/' + post.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                  title="مشاركة عبر واتساب"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.433 5.627 1.434h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                </a>
                <a 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent((process.env.NEXT_PUBLIC_SITE_URL || '') + '/news/' + post.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-50 text-blue-400 rounded-full hover:bg-blue-100 transition-colors"
                  title="مشاركة عبر تويتر"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent((process.env.NEXT_PUBLIC_SITE_URL || '') + '/news/' + post.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
                  title="مشاركة عبر فيسبوك"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {post.mainImage && (
            <figure className="mb-10">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={post.mainImage}
                  alt={post.mainImageDescription || post.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                />
              </div>
              {post.mainImageDescription && (
                <figcaption className="text-center text-gray-500 text-sm mt-3">
                  {post.mainImageDescription}
                </figcaption>
              )}
            </figure>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <div className="text-xl text-gray-600 leading-relaxed font-medium border-r-4 border-blue-600 pr-6 mb-10 italic">
              {post.excerpt}
            </div>
          )}

          {/* Content */}
          <div 
            className="prose prose-lg lg:prose-xl max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-img:rounded-xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags / Footer Meta */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-gray-900">الكلمات المفتاحية:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.keywords && post.keywords.length > 0 ? (
                  post.keywords.map((keyword: string, index: number) => (
                    <span 
                      key={index}
                      className="px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100 hover:bg-blue-100 transition-colors cursor-default"
                    >
                      #{keyword}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="px-4 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-full border border-gray-100">#أخبار</span>
                    <span className="px-4 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-full border border-gray-100">#{post.category?.name || 'غير مصنف'}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Related News Section */}
          {relatedPosts.length > 0 && (
            <section className="mt-16 bg-gray-50 p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                أخبار قد تهمك
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((related: Post) => (
                  <Link 
                    key={related.id} 
                    href={`/news/${related.slug}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {related.mainImage && (
                      <div className="relative aspect-video">
                        <Image
                          src={related.mainImage}
                          alt={related.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {related.title}
                      </h3>
                      <div className="mt-3 text-xs text-gray-500">
                        {format(related.createdAt, 'dd MMM yyyy', { locale: ar })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
