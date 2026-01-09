import prisma from "@/lib/prisma"
import Footer from "./footer"
import { Category } from "@/types"

export const dynamic = 'force-dynamic';

export default async function SiteFooter() {
  // جلب التصنيفات من قاعدة البيانات لعرضها في الفوتر
  let categories: Category[] = []
  let settings = null

  try {
    // جلب التصنيفات والإعدادات في وقت واحد
    const [categoriesRes, settingsRes] = await Promise.all([
      prisma.category.findMany({
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.siteSettings.findUnique({
        where: { id: 'default' }
      })
    ])
    
    categories = categoriesRes
    settings = settingsRes
  } catch (error) {
    console.error("Failed to fetch footer data:", error)
  }

  return <Footer categories={categories} settings={settings} />
}
