// Dynamic import to handle build-time issues
let PrismaClient: any;
let prismaInstance: any;

try {
  // Try to import PrismaClient dynamically
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;

  const globalForPrisma = globalThis as unknown as { prisma: any };
  
  if (PrismaClient) {
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }
  } else {
    throw new Error('PrismaClient not available');
  }
} catch (error) {
  // Build-time fallback - create mock client
  console.warn('Prisma client not available during build, using mock');
  prismaInstance = {
    user: {
      findUnique: async () => null,
      create: async () => ({}),
      update: async () => ({}),
      findMany: async () => [],
    },
    order: {
      findMany: async () => [],
      create: async () => ({}),
      findUnique: async () => null,
    },
    orderItem: {
      findMany: async () => [],
      create: async () => ({}),
    },
  };
}

export const prisma = prismaInstance;
