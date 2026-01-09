"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

// --------------------
// Category Actions
// --------------------

export async function createCategory(formData: FormData) {
  const name = formData.get("name")?.toString()
  const slug = formData.get("slug")?.toString()

  if (!name || !slug) {
    return { error: "الاسم والاسم اللطيف مطلوبان" }
  }

  try {
    await prisma.category.create({
      data: { name, slug }
    })

    revalidatePath("/admin/categories")
    return { success: true }
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return { error: "الاسم أو الاسم اللطيف موجود مسبقاً" }
    }
    return { error: "حدث خطأ أثناء إنشاء القسم" }
  }
}

export async function updateCategory(id: string, formData: FormData) {
  const name = formData.get("name")?.toString()
  const slug = formData.get("slug")?.toString()

  if (!name || !slug) {
    return { error: "الاسم والاسم اللطيف مطلوبان" }
  }

  try {
    await prisma.category.update({
      where: { id },
      data: { name, slug }
    })

    revalidatePath("/admin/categories")
    return { success: true }
  } catch {
    return { error: "حدث خطأ أثناء تحديث القسم" }
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({
      where: { id }
    })

    revalidatePath("/admin/categories")
    return { success: true }
  } catch {
    return { error: "لا يمكن حذف القسم لأنه يحتوي على أخبار مرتبطة به" }
  }
}

// --------------------
// Post Actions
// --------------------

type CreatePostData = {
  title: string
  slug: string
  content: string
  categoryId: string
  mainImage?: string | null
  mainImageDescription?: string | null
  authorId: string
  keywords?: string[]
}

export async function createPost(data: CreatePostData) {
  if (!data.title || !data.slug || !data.content || !data.categoryId) {
    return { error: "جميع الحقول الأساسية مطلوبة" }
  }

  try {
    // التأكد من وجود المستخدم في قاعدة البيانات المحلية (Prisma)
    // إذا لم يكن موجوداً، نقوم بجلبه من Supabase ومزامنته
    const existingUser = await prisma.user.findUnique({
      where: { id: data.authorId }
    })

    if (!existingUser) {
      const supabase = await createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser && authUser.id === data.authorId) {
        // استخراج البيانات من metadata
        const username = authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user'
        const email = authUser.email || ''
        const alias = authUser.user_metadata?.alias || username
        const role = (authUser.user_metadata?.role as any) || 'WRITER'

        await prisma.user.create({
          data: {
            id: authUser.id,
            username,
            email,
            alias,
            role
          }
        })
      } else {
        // إذا لم نجد المستخدم في Supabase أيضاً (حالة نادرة جداً)
        // نقوم بإنشاء مستخدم بسيط لتجنب فشل إنشاء الخبر
        await prisma.user.create({
          data: {
            id: data.authorId,
            username: `user_${data.authorId.substring(0, 8)}`,
            email: `${data.authorId}@placeholder.com`,
            alias: 'كاتب',
            role: 'WRITER'
          }
        })
      }
    }

    await prisma.post.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        categoryId: data.categoryId,
        mainImage: data.mainImage ?? undefined,
        mainImageDescription: data.mainImageDescription ?? undefined,
        authorId: data.authorId,
        keywords: data.keywords || [],
        published: true
      }
    })

    // إعادة التحقق من المسارات لتحديث الـ SEO والصفحات العامة فوراً
    revalidatePath("/")
    revalidatePath("/sitemap.xml")
    revalidatePath(`/news/${data.slug}`)
    revalidatePath("/admin/posts")

    // تنبيه جوجل بوجود تحديث في خريطة الموقع
    pingGoogle();

    return { success: true }
  } catch (error) {
    console.error("Error creating post:", error)
    return { error: "حدث خطأ أثناء إضافة الخبر" }
  }
}

// وظيفة لتنبيه جوجل بوجود تحديث في خريطة الموقع (SEO Ping)
async function pingGoogle() {
  const sitemapUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`;
  try {
    // رابط Google Ping لخرائط المواقع
    await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, {
      method: 'GET',
      mode: 'no-cors' // جوجل لا يسمح بـ CORS هنا ولكن الطلب سيصل
    });
    console.log("Google pinged successfully");
  } catch (error) {
    console.error("Error pinging Google:", error);
  }
}

type UpdatePostData = {
  title: string
  slug: string
  content: string
  categoryId: string
  mainImage?: string | null
  mainImageDescription?: string | null
  authorId?: string
  keywords?: string[]
}

export async function updatePost(id: string, data: UpdatePostData) {
  if (!data.title || !data.slug || !data.content || !data.categoryId) {
    return { error: "جميع الحقول الأساسية مطلوبة" }
  }

  try {
    // التأكد من وجود المستخدم (اختياري في التحديث ولكن مفيد للأمان)
    if (data.authorId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: data.authorId }
      })

      if (!existingUser) {
        const supabase = await createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser && authUser.id === data.authorId) {
          const username = authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user'
          const email = authUser.email || ''
          const alias = authUser.user_metadata?.alias || username
          const role = (authUser.user_metadata?.role as any) || 'WRITER'

          await prisma.user.create({
            data: {
              id: authUser.id,
              username,
              email,
              alias,
              role
            }
          })
        }
      }
    }

    await prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        categoryId: data.categoryId,
        mainImage: data.mainImage ?? undefined,
        mainImageDescription: data.mainImageDescription ?? undefined,
        keywords: data.keywords || [],
        ...(data.authorId && { authorId: data.authorId })
      }
    })

    // إعادة التحقق من المسارات لتحديث الـ SEO والصفحات العامة فوراً
    revalidatePath("/")
    revalidatePath("/sitemap.xml")
    revalidatePath(`/news/${data.slug}`)
    revalidatePath("/admin/posts")

    // تنبيه جوجل بوجود تحديث في خريطة الموقع
    pingGoogle();

    return { success: true }
  } catch (error) {
    console.error("Error updating post:", error)
    return { error: "حدث خطأ أثناء تحديث الخبر" }
  }
}

export async function deletePost(id: string) {
  try {
    await prisma.post.delete({
      where: { id }
    })

    revalidatePath("/admin/posts")
    return { success: true }
  } catch {
    return { error: "حدث خطأ أثناء حذف الخبر" }
  }
}
