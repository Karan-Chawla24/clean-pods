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
  // Check if we're in a production/runtime environment and log more helpful messages
  if (process.env.NODE_ENV === 'production') {
    console.error('Prisma client failed to initialize in production. Check DATABASE_URL configuration:', error);
    throw new Error('Database connection failed. Please check your database configuration.');
  } else {
    console.warn('Prisma client not available during build, using mock');
  }
  
  // Build-time fallback - create mock client
  prismaInstance = {
    user: {
      findUnique: async () => {
        console.warn('Using mock Prisma client - user.findUnique');
        return null;
      },
      create: async (data: any) => {
        console.warn('Using mock Prisma client - user.create');
        return { id: 'mock-id', ...data.data };
      },
      update: async () => {
        console.warn('Using mock Prisma client - user.update');
        return {};
      },
      findMany: async () => {
        console.warn('Using mock Prisma client - user.findMany');
        return [];
      },
    },
    order: {
      findMany: async () => {
        console.warn('Using mock Prisma client - order.findMany');
        return [];
      },
      create: async (data: any) => {
        console.warn('Using mock Prisma client - order.create');
        const mockOrder = {
          id: `mock-order-${Date.now()}`,
          orderDate: new Date(),
          items: data.data?.items?.create?.map((item: any, index: number) => ({
            id: `mock-item-${index}`,
            ...item
          })) || [],
          ...data.data
        };
        return mockOrder;
      },
      findUnique: async () => {
        console.warn('Using mock Prisma client - order.findUnique');
        return null;
      },
    },
    orderItem: {
      findMany: async () => {
        console.warn('Using mock Prisma client - orderItem.findMany');
        return [];
      },
      create: async () => {
        console.warn('Using mock Prisma client - orderItem.create');
        return {};
      },
    },
  };
}

export const prisma = prismaInstance;
