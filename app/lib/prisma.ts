// Conditional import to handle build issues with Prisma client
let PrismaClient: any;
let prismaInstance: any;

try {
  // Try to import PrismaClient
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
  
  const globalForPrisma = globalThis as unknown as { prisma: any };
  prismaInstance = globalForPrisma.prisma || new PrismaClient();
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
} catch (error) {
  // Fallback for build environments where Prisma client isn't available
  console.warn('Prisma client not available, using mock for build');
  prismaInstance = {
    user: {
      findUnique: () => Promise.resolve(null),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      findMany: () => Promise.resolve([]),
    },
    order: {
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      findUnique: () => Promise.resolve(null),
    },
    orderItem: {
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
    },
  };
}

export const prisma = prismaInstance;
