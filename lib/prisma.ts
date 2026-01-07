import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// Singleton لضمان عدم إعادة إنشاء PrismaClient في HMR (Next.js Dev)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn("⚠️ DATABASE_URL is not defined. Prisma might not work correctly during build.")
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = globalThis.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;
