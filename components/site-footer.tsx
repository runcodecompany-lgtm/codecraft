export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma"
import Footer from "./footer"

export default async function SiteFooter() {
  // جلب التصنيفات من قاعدة البيانات لعرضها في الفوتر
  let categories: any[] = []
  try {
    categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    console.error("Failed to fetch categories for footer:", error)
    // يمكننا إضافة تصنيفات افتراضية هنا إذا أردنا
  }

  return <Footer categories={categories} />
}
