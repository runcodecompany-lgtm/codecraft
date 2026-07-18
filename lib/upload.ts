// src/lib/upload.ts
import { supabase } from './supabase'
import { compressImage } from './compress'

async function autoCompressIfImage(file: File): Promise<File> {
  if (file.type.startsWith('image/')) {
    try {
      const compressed = await compressImage(file)
      return compressed
    } catch (e) {
      console.warn('Image compression failed, using original file:', e)
    }
  }
  return file
}


export async function uploadImage(file: File) {
  try {
    const processedFile = await autoCompressIfImage(file)
    const fileExt = processedFile.name.split('.').pop()
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`
    const filePath = `articles/${fileName}`

    const { data, error } = await supabase.storage
      .from('news-images')
      .upload(filePath, processedFile)

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

// Upload video file to Supabase storage
export async function uploadVideo(file: File, onProgress?: (percent: number) => void) {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `videos/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const fileSize = file.size
    const fileType = file.type

    // Validate video type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    if (!allowedTypes.includes(fileType)) {
      throw new Error('نوع الفيديو غير مدعوم. الأنواع المدعومة: MP4, WebM, OGG')
    }

    // Validate size (max 500MB)
    const maxSize = 500 * 1024 * 1024
    if (fileSize > maxSize) {
      throw new Error('حجم الفيديو كبير جداً. الحد الأقصى هو 500MB')
    }

    const { data, error } = await supabase.storage
      .from('news-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileType
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('news-images')
      .getPublicUrl(fileName)

    return {
      url: publicUrl,
      fileName,
      fileSize,
      fileType
    }
  } catch (error) {
    console.error('Error uploading video:', error)
    return null
  }
}

// Delete a file from storage
export async function deleteStorageFile(filePath: string) {
  try {
    const { error } = await supabase.storage
      .from('news-images')
      .remove([filePath])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

// Upload lesson resource / attachment to Supabase Storage
export async function uploadResource(file: File): Promise<{
  url: string
  type: string
  size: number
} | null> {
  try {
    // Auto-detect type label from MIME
    let typeLabel = 'DOCUMENT'
    if (file.type === 'application/pdf') typeLabel = 'PDF'
    else if (file.type.startsWith('image/')) typeLabel = 'IMAGE'
    else if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') typeLabel = 'ZIP'
    else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) typeLabel = 'DOCUMENT'

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `resources/${fileName}`

    const { error } = await supabase.storage
      .from('news-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('news-images')
      .getPublicUrl(filePath)

    return { url: publicUrl, type: typeLabel, size: file.size }
  } catch (error) {
    console.error('Error uploading resource:', error)
    return null
  }
}


export async function uploadCV(file: File) {
  try {
    const processedFile = await autoCompressIfImage(file)
    const fileExt = processedFile.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `cvs/${fileName}`

    const { error } = await supabase.storage
      .from('news-images')
      .upload(filePath, processedFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('news-images')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading CV:', error)
    return null
  }
}

// Upload user profile photo (avatar) to Supabase Storage
export async function uploadAvatar(file: File) {
  try {
    const processedFile = await autoCompressIfImage(file)
    const fileExt = processedFile.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error } = await supabase.storage
      .from('news-images')
      .upload(filePath, processedFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('news-images')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return null
  }
}

// Upload course cover or background image to Supabase Storage
export async function uploadCourseCover(file: File) {
  try {
    const processedFile = await autoCompressIfImage(file)
    const fileExt = processedFile.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `courses/${fileName}`

    const { error } = await supabase.storage
      .from('news-images')
      .upload(filePath, processedFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('news-images')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading course cover:', error)
    return null
  }
}

