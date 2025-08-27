#!/usr/bin/env node

/**
 * Vercel Build Script
 *
 * This script is used by Vercel during the build process.
 * It skips database operations during build to avoid connection errors.
 */

const { execSync } = require("child_process");

console.log("🔨 Running Vercel build script");

// Check if we're in Vercel production environment
const isVercel = process.env.VERCEL === "1";

try {
  // Always generate Prisma client
  console.log("📦 Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit" });

  // Skip database operations in Vercel environment
  if (isVercel) {
    console.log(
      "🌐 Running in Vercel environment - skipping database operations",
    );
  } else {
    // In local environment, we can run database operations
    console.log("🔄 Running database migrations...");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
  }

  // Run Next.js build
  console.log("🏗️ Building Next.js application...");
  execSync("next build", { stdio: "inherit" });

  console.log("✅ Build completed successfully!");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}
