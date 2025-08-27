// app/lib/prisma-vercel.ts
// Special configuration for Prisma with Vercel Data Proxy

import { PrismaClient } from "@prisma/client";

// This file contains a special configuration for Prisma when deployed to Vercel
// It handles the Data Proxy connection which is recommended for serverless environments

// Create a singleton instance of PrismaClient for use throughout the application
let prisma: PrismaClient;

if (process.env.VERCEL) {
  // In Vercel production environment, create a new instance each time
  // The Data Proxy will handle connection pooling efficiently
  prisma = new PrismaClient();
} else {
  // In development, we want to reuse the same instance to avoid connection limits
  // @ts-expect-error - Global is not typed correctly for this use case
  if (!global.prisma) {
    // @ts-expect-error - Global prisma needs to be assigned a PrismaClient instance
    global.prisma = new PrismaClient();
  }
  // @ts-expect-error - Using global prisma as our singleton instance
  prisma = global.prisma;
}

export default prisma;
