/**
 * Prisma Client Setup for AddisDub
 * 
 * Initialize with: pnpm prisma generate
 */

let db: any = null;

try {
  const { PrismaClient } = require('@prisma/client');
  
  const prismaClientSingleton = () => {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  };

  if (typeof globalThis !== 'undefined') {
    (globalThis as any).prisma = (globalThis as any).prisma ?? prismaClientSingleton();
    db = (globalThis as any).prisma;
  }
} catch (error) {
  console.warn('Prisma Client not available during build. This is expected.');
  db = null;
}

export default db;

