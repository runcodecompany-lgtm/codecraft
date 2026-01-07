export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma"
import Header from "./header"
import { Category } from "@/types"

export default async function Navbar() {
  // جلب التصنيفات من قاعدة البيانات مع معالجة الخطأ لمنع فشل البناء
  let categories: Category[] = []
  try {
    categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    // التحقق مما إذا كان الخطأ بسبب الاتصال بقاعدة البيانات (خاصة عند استخدام الرابط الوهمي)
    // P1001: Can't reach database server
    if ((error as { code?: string })?.code === 'P1001') {
      console.warn("Navbar: Database unreachable (likely using dummy connection). Navigation will be empty.")
    } else {
      console.error("Failed to fetch categories for navbar:", error)
    }
  }

  return <Header categories={categories} />
}
