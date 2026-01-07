import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  // استخدام رابط وهمي لتجاوز خطأ التهيئة في حالة غياب المتغير البيئي أثناء البناء
  // هذا يسمح للعميل بالعمل، وستفشل الاستعلامات الفعلية وسيتم اصطيادها في try/catch
  const connectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy"
  
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma