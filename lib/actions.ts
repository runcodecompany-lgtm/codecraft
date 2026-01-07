"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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
    // إذا لم يكن موجوداً، نقوم بإنشائه (للمزامنة مع Supabase Auth)
    await prisma.user.upsert({
      where: { id: data.authorId },
      update: {}, // لا نحدث شيئاً إذا كان موجوداً
      create: {
        id: data.authorId,
        // يمكننا إضافة البريد الإلكتروني هنا إذا كان متوفراً في البيانات المرسلة
      }
    })

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
    return { success: true }
  } catch (error) {
    console.error("Error creating post:", error)
    return { error: "حدث خطأ أثناء إضافة الخبر" }
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
      await prisma.user.upsert({
        where: { id: data.authorId },
        update: {},
        create: { id: data.authorId }
      })
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
