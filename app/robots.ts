import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/*', '/login'],
    },
    sitemap: 'https://my-news-web-site.vercel.app/sitemap.xml',
    host: 'https://my-news-web-site.vercel.app',
  };
}