#!/usr/bin/env node

/**
 * Vercel Deployment Helper Script
 * 
 * This script helps with deploying to Vercel by:
 * 1. Checking environment variables
 * 2. Preparing the build for Vercel
 * 3. Providing guidance on database setup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Vercel Deployment Helper');
console.log('============================');

// Check if running in CI/CD environment
const isCI = process.env.CI || process.env.VERCEL;

// Check for required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'DIRECT_URL'
];

const missingVars = [];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('⚠️ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  
  if (!isCI) {
    console.log('\nPlease add these to your .env file or Vercel project settings.');
  } else {
    console.log('\nPlease add these to your Vercel project environment variables.');
  }
}

// Check database connection string format
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  
  if (dbUrl.includes('@')) {
    console.log('✅ Database URL format looks valid');
    
    // Check if it contains special characters that might need URL encoding
    if (dbUrl.includes('@') && !dbUrl.includes('%40')) {
      console.log('⚠️ Your database password might contain special characters');
      console.log('   Consider URL-encoding special characters like @ -> %40');
    }
  } else {
    console.log('⚠️ Database URL format might be invalid. It should include user:password@host:port/database');
  }
}

// Provide deployment guidance
console.log('\n📋 Deployment Checklist:');
console.log('1. Ensure all environment variables are set in Vercel');
console.log('2. The build script has been updated to skip database operations during build');
console.log('3. After deployment, run database migrations manually if needed');

console.log('\n🔗 Helpful Commands:');
console.log('- Test database connection: npx prisma db pull');
console.log('- Apply migrations: npx prisma migrate deploy');
console.log('- Generate Prisma client: npx prisma generate');

console.log('\n✨ Deployment preparation complete!');