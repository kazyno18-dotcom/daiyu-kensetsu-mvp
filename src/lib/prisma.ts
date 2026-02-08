import { PrismaClient } from '@prisma/client'

// Vercel等の環境で環境変数が読み込まれない場合の対策としてdotenvを試行
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config();
} catch (e) {
  // ignore
}

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error('❌ FATAL: DATABASE_URL is missing in process.env');
  } else {
    // セキュリティのためURLの一部のみログ出力
    console.log(`✅ Prisma initializing with DATABASE_URL: ${url.substring(0, 15)}...`);
  }

  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: url,
      },
    },
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
