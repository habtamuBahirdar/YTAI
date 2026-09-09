/**
 * Prisma Client Setup for AddisDub
 * 
 * To initialize the database:
 * 1. Ensure PostgreSQL is running with your credentials
 * 2. Run: pnpm prisma migrate dev --name init
 * 3. This will create the database and apply migrations
 */

import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const db = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db;

export default db;
