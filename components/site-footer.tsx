import prisma from "@/lib/prisma"
import Footer from "./footer"

export default async function SiteFooter() {
  // جلب التصنيفات من قاعدة البيانات لعرضها في الفوتر
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc'
    }
  })

  return <Footer categories={categories} />
}
