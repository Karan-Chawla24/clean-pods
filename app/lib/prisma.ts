// app/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.

// Add prisma to the global type
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a new PrismaClient instance with specific options based on environment
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Use existing prisma instance if available to avoid connection limit issues
const prisma = globalForPrisma.prisma || prismaClientSingleton();

// In development, save the instance to avoid multiple connections
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
