export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma'
import { FileText, Layers, Eye, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Post } from '@/types'

export default async function AdminDashboard() {
  // جلب البيانات من Prisma
  const [postsCount, categoriesCount, totalViewsData, recentPosts] = await Promise.all([
    prisma.post.count(),
    prisma.category.count(),
    prisma.post.aggregate({
      _sum: {
        views: true
      }
    }),
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { category: true }
    })
  ])

  const totalViews = totalViewsData._sum.views || 0

  const stats = [
    {
      name: 'إجمالي الأخبار',
      value: postsCount,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      name: 'الأقسام',
      value: categoriesCount,
      icon: Layers,
      color: 'bg-purple-500',
    },
    {
      name: 'المشاهدات الإجمالية',
      value: totalViews.toLocaleString('ar-EG'),
      icon: Eye,
      color: 'bg-green-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">نظرة عامة</h1>
        <p className="text-gray-500 mt-1">مرحباً بك في لوحة تحكم الموقع الإخباري</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div 
            key={stat.name}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4"
          >
            <div className={`${stat.color} p-4 rounded-lg text-white shrink-0`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">آخر الأخبار المضافة</h2>
          <Link href="/admin/posts" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
            عرض الكل
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>
        
        <div className="divide-y divide-gray-100">
          {recentPosts.map((post: Post) => (
            <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-gray-800 line-clamp-1">{post.title}</span>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
{post.category?.name || 'بدون تصنيف'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </div>
              <Link 
                href={`/admin/posts/edit/${post.id}`}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                تعديل
              </Link>
            </div>
          ))}
          {recentPosts.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>لا توجد أخبار مضافة حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

