
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default async function Home() {
  // جلب أحدث 10 أخبار من قاعدة البيانات
  const latestPosts = await prisma.post.findMany({
    where: { published: true },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { category: true }
  });

  const featuredPost = latestPosts[0];
  const sidePosts = latestPosts.slice(1, 4);
  const gridPosts = latestPosts.slice(4);

  return (
    <main className="min-h-screen bg-gray-50 text-right" dir="rtl">
      {/* Hero Section - الخبر الرئيسي */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* الخبر الكبير */}
          {featuredPost ? (
            <Link 
              href={`/news/${featuredPost.slug}`}
              className="lg:col-span-2 relative group cursor-pointer overflow-hidden rounded-xl bg-white shadow-md"
            >
              <Image 
                src={featuredPost.mainImage || "https://picsum.photos/800/500"} 
                alt={featuredPost.title} 
                width={800}
                height={400}
                className="w-full h-[400px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black to-transparent p-6">
                <span className="bg-red-600 text-white px-3 py-1 rounded text-sm mb-2 inline-block">
                  {featuredPost.category?.name || "عام"}
                </span>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-200 line-clamp-2">{featuredPost.excerpt}</p>
              </div>
            </Link>
          ) : (
            <div className="lg:col-span-2 h-[400px] bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
              لا توجد أخبار مميزة حالياً
            </div>
          )}

          {/* الأخبار الجانبية */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold border-r-4 border-red-600 pr-3">أحدث الأخبار</h3>
            {sidePosts.map((post) => (
              <Link 
                key={post.id} 
                href={`/news/${post.slug}`}
                className="flex gap-4 bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden relative">
                  <Image 
                    src={post.mainImage || `https://picsum.photos/200/200`} 
                    alt={post.title}
                    fill
                    className="object-cover" 
                  />
                </div>
                <div className="flex flex-col justify-between">
                  <h4 className="font-bold text-sm hover:text-red-600 cursor-pointer line-clamp-2">
                    {post.title}
                  </h4>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ar })}
                  </span>
                </div>
              </Link>
            ))}
            {sidePosts.length === 0 && (
              <div className="text-center py-10 text-gray-400 border border-dashed rounded-lg">
                قريباً...
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Grid News - شبكة الأخبار الأسفل */}
      <section className="container mx-auto px-4 py-8">
        <h3 className="text-2xl font-bold mb-6 border-b-2 border-gray-200 pb-2">آخر الأخبار</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gridPosts.map((post) => (
            <Link 
              key={post.id} 
              href={`/news/${post.slug}`}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100"
            >
              <div className="h-48 bg-gray-200 relative">
                <Image 
                  src={post.mainImage || `https://picsum.photos/400/300`} 
                  alt={post.title}
                  fill
                  className="object-cover" 
                />
              </div>
              <div className="p-4">
                <span className="text-red-600 text-xs font-bold mb-2 block">
                  {post.category?.name || "عام"}
                </span>
                <h4 className="font-bold mb-2 line-clamp-2">{post.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-3">{post.excerpt}</p>
              </div>
            </Link>
          ))}
          {gridPosts.length === 0 && sidePosts.length > 0 && (
            <div className="col-span-full text-center py-20 text-gray-400">
              تابعنا للمزيد من الأخبار قريباً
            </div>
          )}
        </div>
      </section>
    </main>
  );
}