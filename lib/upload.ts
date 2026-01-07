// src/lib/upload.ts
import { supabase } from './supabase'

export async function uploadImage(file: File) {
  try {
    // 1. توليد اسم فريد للصورة لمنع التكرار
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`
    const filePath = `articles/${fileName}`

    // 2. الرفع إلى Supabase Storage
    const { data, error } = await supabase.storage
      .from('news-images')
      .upload(filePath, file)

    if (error) throw error

    // 3. الحصول على الرابط العام للصورة
    const { data: { publicUrl } } = supabase.storage
      .from('news-images')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}