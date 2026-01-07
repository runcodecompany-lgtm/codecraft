import prisma from "@/lib/prisma"
import Header from "./header"

export default async function Navbar() {
  // جلب التصنيفات من قاعدة البيانات
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc'
    }
  })

  return <Header categories={categories} />
}
