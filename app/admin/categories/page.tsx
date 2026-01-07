import prisma from '@/lib/prisma'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { createCategory, deleteCategory } from '@/lib/actions'
import CategoryForm from '@/components/category-form'
import DeleteCategoryButton from '@/components/delete-category-button'

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الأقسام</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* نموذج الإضافة */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            إضافة قسم جديد
          </h2>
          <CategoryForm />
        </div>

        {/* جدول الأقسام */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">اسم القسم</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">الاسم اللطيف (Slug)</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((category: { id: string; name: string; slug: string }) => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-700">{category.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{category.slug}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex justify-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <DeleteCategoryButton id={category.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                    لا توجد أقسام حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
