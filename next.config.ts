import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'aws-1-ap-south-1.pooler.supabase.com',
      },
      // إضافة نطاق Supabase للتخزين
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;