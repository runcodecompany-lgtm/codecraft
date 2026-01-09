import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export const revalidate = 3600; // إعادة التحقق كل ساعة كحد أقصى، ولكن revalidatePath ستجبره على التحديث فوراً عند النشر

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://my-news-web-site.vercel.app';

  // جلب كافة الأخبار المنشورة
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });

  // جلب كافة الأقسام
  const categories = await prisma.category.findMany({
    select: { slug: true },
  });

  const postUrls = posts.map((post) => ({
    url: `${baseUrl}/news/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const categoryUrls = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ];

  return [...staticPages, ...categoryUrls, ...postUrls];
}