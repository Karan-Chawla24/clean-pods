// app/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.

// Add prisma to the global type
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a new PrismaClient instance with specific options based on environment
const prismaClientSingleton = () => {
  // For Vercel production environment, use minimal logging
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient({
      log: ['error'],
      // In production, we rely on the connection pooling of the database provider
    });
  }
  
  // For development, use more verbose logging and disable query batching
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
    // Disable query batching which can cause the "prepared statement already exists" error
    // @ts-expect-error - These are valid Prisma options but might not be in the type definitions
    __internal: {
      engine: {
        batchQueries: false,
      },
    },
  });
};

// Use existing prisma instance if available to avoid connection limit issues
const prisma = globalForPrisma.prisma || prismaClientSingleton();

// In development, save the instance to avoid multiple connections
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { prisma };
