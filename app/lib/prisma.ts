// app/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.

// Add prisma to the global type
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a new PrismaClient instance with specific options based on environment
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error'], // Only log errors to prevent sensitive data exposure
    // Disable prepared statements to avoid connection pooling issues
    datasources: {
      db: {
        url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'pgbouncer=true&connection_limit=1',
      },
    },
    errorFormat: 'minimal',
  });
};

// Use existing prisma instance if available to avoid connection limit issues
const prisma = globalForPrisma.prisma || prismaClientSingleton();

// In development, save the instance to avoid multiple connections
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
