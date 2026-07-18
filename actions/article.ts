"use server"

import prisma from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"

export interface ArticleInput {
  title: string
  content: string
  published?: boolean
  courseId?: string | null
}

async function generateUniqueArticleSlug(title: string): Promise<string> {
  const baseSlug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "") // support Arabic characters
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

  let uniqueSlug = baseSlug
  let count = 0

  while (true) {
    const existing = await prisma.article.findUnique({
      where: { slug: uniqueSlug },
    })

    if (!existing) {
      break
    }

    count++
    uniqueSlug = `${baseSlug}-${count}-${randomBytes(2).toString("hex")}`
  }

  return uniqueSlug
}

/**
 * Server Action to create and publish technical articles by teachers or admins.
 */
export async function createArticle(input: ArticleInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "يجب تسجيل الدخول أولاً للمتابعة." }
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN")) {
      return { success: false, error: "صلاحيات غير كافية لإنشاء المقالات الفنية." }
    }

    if (!input.title || !input.content) {
      return { success: false, error: "عنوان المقال ومحتواه حقول إجبارية." }
    }

    const uniqueSlug = await generateUniqueArticleSlug(input.title)

    const newArticle = await prisma.article.create({
      data: {
        title: input.title,
        slug: uniqueSlug,
        content: input.content,
        published: input.published ?? false,
        authorId: user.id,
        courseId: input.courseId || null,
      },
      select: { id: true, slug: true },
    })

    revalidatePath("/articles")
    revalidatePath("/dashboard/teacher/articles")
    revalidatePath("/")

    return { success: true, articleId: newArticle.id, slug: newArticle.slug }
  } catch (error) {
    console.error("Error creating article:", error)
    return { success: false, error: "حدث خطأ غير متوقع أثناء حفظ المقال." }
  }
}
