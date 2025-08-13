// app/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.

// Add prisma to the global type
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Fix for the "prepared statement already exists" error
// Create a new PrismaClient instance with specific options to handle connection issues
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
    // Disable query batching which can cause the prepared statement error
    // @ts-expect-error - These are valid Prisma options but might not be in the type definitions
    __internal: {
      engine: {
        batchQueries: false,
      },
    },
  });
};

const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { prisma };
