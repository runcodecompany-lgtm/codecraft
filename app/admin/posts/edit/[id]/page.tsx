import prisma from '@/lib/prisma'
import PostForm from '@/components/post-form'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id }
  })

  if (!post) notFound()

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">تعديل الخبر</h1>
        <p className="text-gray-500">تعديل: {post.title}</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <PostForm 
          categories={categories} 
          authorId={user?.id || ''} 
          initialData={{
            ...post,
            mainImage: post.mainImage || undefined,
            keywords: post.keywords || []
          }}
        />
      </div>
    </div>
  )
}
