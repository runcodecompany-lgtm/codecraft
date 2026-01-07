import prisma from '@/lib/prisma'
import { Plus, Edit2, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import DeletePostButton from '@/components/delete-post-button'

export default async function PostsPage() {
  const posts = await prisma.post.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الأخبار</h1>
        <Link 
          href="/admin/posts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة خبر جديد
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">الخبر</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">القسم</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">تاريخ النشر</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">العمليات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map((post: any) => (
              <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                      {post.mainImage ? (
                        <Image 
                          src={post.mainImage} 
                          alt={post.title} 
                          fill 
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Eye className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-800 line-clamp-1">{post.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                    {post.category.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <div className="flex justify-center gap-2">
                    <Link 
                      href={`/admin/posts/edit/${post.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <DeletePostButton id={post.id} />
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                  لا توجد أخبار حالياً.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
