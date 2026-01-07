import prisma from '@/lib/prisma'
import PostForm from '@/components/post-form'
import { createClient } from '@/utils/supabase/server'

export default async function NewPostPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })

  // الحصول على معرف المستخدم الحالي من Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">إضافة خبر جديد</h1>
        <p className="text-gray-500">قم بتعبئة البيانات أدناه لنشر خبر جديد</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <PostForm categories={categories} authorId={user?.id || ''} />
      </div>
    </div>
  )
}
