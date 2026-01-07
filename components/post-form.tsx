'use client'
export const dynamic = 'force-dynamic';
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadImage } from '@/lib/upload'
import { compressImage } from '@/lib/compress'
import { createPost, updatePost } from '@/lib/actions'
import { ImageIcon, X } from 'lucide-react'
import Image from 'next/image'
import RichEditor from './rich-editor'
import KeywordsInput from './keywords-input'

interface Category {
  id: string
  name: string
}

interface PostFormProps {
  categories: Category[]
  authorId: string
  initialData?: {
    id: string
    title: string
    slug: string
    content: string
    categoryId: string
    mainImage?: string
    keywords?: string[]
  }
}

export default function PostForm({ categories, authorId, initialData }: PostFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(initialData?.mainImage || '')

  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '')
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || [])

  // توليد الـ Slug من العنوان تلقائياً (تبسيط للمثال)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    if (!initialData) {
      setSlug(val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let mainImageUrl = initialData?.mainImage || null

      // رفع الصورة إذا تم اختيار ملف جديد
      if (imageFile) {
        const compressedFile = await compressImage(imageFile)
        const uploaded = await uploadImage(compressedFile)
        if (!uploaded) throw new Error('فشل رفع الصورة')
        mainImageUrl = uploaded
      }

      const postData = {
        title,
        slug,
        content,
        categoryId,
        mainImage: mainImageUrl,
        keywords,
        authorId
      }

      let result
      if (initialData) {
        result = await updatePost(initialData.id, postData)
      } else {
        result = await createPost(postData)
      }

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/admin/posts')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الخبر</label>
            <input
              value={title}
              onChange={handleTitleChange}
              type="text"
              required
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="أدخل عنواناً جذاباً..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم اللطيف (Slug)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              type="text"
              required
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              <option value="">اختر القسم...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الصورة البارزة</label>
          <div className="relative border-2 border-dashed border-gray-200 rounded-xl h-[215px] flex flex-col items-center justify-center overflow-hidden bg-gray-50 group transition-colors hover:border-blue-400">
            {imagePreview ? (
              <>
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(''); }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center">
                <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">انقر لرفع صورة</span>
                <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
              </label>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الكلمات المفتاحية (SEO)</label>
        <KeywordsInput keywords={keywords} onChange={setKeywords} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">محتوى الخبر</label>
        <RichEditor 
          content={content} 
          onChange={(html) => setContent(html)} 
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'جاري الحفظ...' : initialData ? 'تحديث الخبر' : 'نشر الخبر'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          إلغاء
        </button>
      </div>
    </form>
  )
}
