import prisma from "@/lib/prisma"
import Header from "./header"

export default async function Navbar() {
  // جلب التصنيفات من قاعدة البيانات مع معالجة الخطأ لمنع فشل البناء
  let categories: any[] = []
  try {
    categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    console.error("Failed to fetch categories for navbar:", error)
  }

  return <Header categories={categories} />
}
