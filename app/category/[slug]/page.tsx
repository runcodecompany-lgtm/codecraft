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
  ChevronRight,
  LayoutGrid,
  Clock,
  TrendingUp
} from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

// تعريف نوع البوست بشكل صريح
type PostType = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  mainImage?: string;
  createdAt: Date;
  author?: {
    name?: string;
  };
};

export async function generateMetadata(
  { params }: CategoryPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug }
  });

  if (!category) return { title: "التصنيف غير موجود" };

  return {
    title: `أخبار ${category.name} | أخبارنا`,
    description: `تابع أحدث أخبار وتقارير ${category.name} لحظة بلحظة على موقعنا.`,
    openGraph: {
      title: `أخبار ${category.name} | أخبارنا`,
      description: `تابع أحدث أخبار وتقارير ${category.name} لحظة بلحظة.`,
      type: 'website',
    }
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { posts: { where: { published: true } } }
      }
    }
  });

  if (!category) {
    notFound();
  }

  const posts = await prisma.post.findMany({
    where: {
      categoryId: category.id,
      published: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      author: true
    }
  }) as PostType[]; // تحديد النوع هنا اختياري لكن آمن

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header Section */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Breadcrumbs */}
          <nav className="flex items-center text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-blue-600 transition-colors">الرئيسية</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                  أخبار {category.name}
                </h1>
              </div>
              <p className="text-gray-600 max-w-2xl text-lg">
                استكشف أحدث المقالات والأخبار المتعلقة بـ {category.name}. إجمالي {category._count.posts} خبر.
              </p>
            </div>
            
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full text-blue-700 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              أحدث المنشورات أولاً
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: PostType, index) => (  // <-- هنا تم تحديد النوع صراحة
              <article 
                key={post.id} 
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
              >
                {/* Post Image */}
                <Link href={`/news/${post.slug}`} className="relative aspect-[16/9] overflow-hidden">
                  {post.mainImage ? (
                    <Image
                      src={post.mainImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={index < 3}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <LayoutGrid className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <span className="text-white font-bold flex items-center gap-2">
                      اقرأ المزيد <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>

                {/* Post Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {format(post.createdAt, 'dd MMMM yyyy', { locale: ar })}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      {Math.ceil(post.content.split(/\s+/).length / 200)} د قراءة
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                    <Link href={`/news/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h2>

                  <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                    {post.excerpt || post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </p>

                  <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold border border-gray-200">
                        {post.author?.name?.substring(0, 1) || 'ك'}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{post.author?.name || 'الكاتب'}</span>
                    </div>
                    
                    <Link 
                      href={`/news/${post.slug}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 group/link"
                    >
                      التفاصيل
                      <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-[-4px]" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <LayoutGrid className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد أخبار حالياً</h3>
            <p className="text-gray-500">لم يتم نشر أي أخبار في هذا التصنيف بعد.</p>
            <Link 
              href="/"
              className="inline-block mt-8 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              العودة للرئيسية
            </Link>
          </div>
        )}
      </main>

      {/* SEO Footer Text (Optional for Google) */}
      <section className="bg-white py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-4">أخبار {category.name} لحظة بلحظة</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              نحن نقدم لك تغطية شاملة ومباشرة لكل ما يخص {category.name}. فريقنا يعمل على مدار الساعة لجلب أدق التفاصيل والتقارير الحصرية لتكون دائماً في قلب الحدث. اشترك في تنبيهاتنا ليصلك كل جديد في هذا القسم.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
