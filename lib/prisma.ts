import { PrismaClient } from '@prisma/client';

// Singleton لضمان عدم إعادة إنشاء PrismaClient في HMR (Next.js Dev)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;
