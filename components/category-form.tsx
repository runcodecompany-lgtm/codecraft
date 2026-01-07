'use client'
export const dynamic = 'force-dynamic';
import { useState } from 'react'
import { createCategory } from '@/lib/actions'

export default function CategoryForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    setSuccess('')

    const result = await createCategory(formData)
    
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('تم إضافة القسم بنجاح')
      // مسح الحقول بعد النجاح
      const form = document.getElementById('category-form') as HTMLFormElement
      form.reset()
    }
  }

  return (
    <form id="category-form" action={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{success}</p>}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">اسم القسم</label>
        <input
          name="name"
          type="text"
          required
          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="مثال: سياسة، رياضة..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الاسم اللطيف (Slug)</label>
        <input
          name="slug"
          type="text"
          required
          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
          placeholder="مثال: politics"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'جاري الحفظ...' : 'إضافة القسم'}
      </button>
    </form>
  )
}
