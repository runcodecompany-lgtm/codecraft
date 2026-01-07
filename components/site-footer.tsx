export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma"
import Footer from "./footer"
import { Category } from "@/types"

export default async function SiteFooter() {
  // جلب التصنيفات من قاعدة البيانات لعرضها في الفوتر
  let categories: Category[] = []
  try {
    categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    if ((error as { code?: string })?.code === 'P1001') {
      console.warn("Footer: Database unreachable (likely using dummy connection). Footer links will be empty.")
    } else {
      console.error("Failed to fetch categories for footer:", error)
    }
  }

  return <Footer categories={categories} />
}
