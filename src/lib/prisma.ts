import { PrismaClient } from '@prisma/client'

// PrismaClientをシングルトンとして管理
const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;

  // サーバーサイドログに状態を出力（VercelのLogsで確認可能）
  if (!url) {
    console.error('❌ FATAL: DATABASE_URL is missing or empty in process.env');
  } else {
    console.log(`✅ DATABASE_URL found (Length: ${url.length}). Starts with: ${url.substring(0, 10)}...`);
  }

  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: url ? {
      db: {
        url: url,
      },
    } : undefined,
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
