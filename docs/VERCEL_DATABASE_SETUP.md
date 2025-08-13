# Vercel Database Setup Guide

## Database Connection Issues in Vercel

When deploying to Vercel, you might encounter the following error during build:

```
Error: P1001: Can't reach database server at `db.ddhhpozckwrbwubugeef.supabase.co:5432`
Please make sure your database server is running at `db.ddhhpozckwrbwubugeef.supabase.co:5432`.
```

This happens because Vercel's build environment cannot connect to your database during the build process due to network restrictions or authentication issues.

## Solution Overview

We've implemented several changes to fix this issue:

1. Modified the build script to skip database operations during build
2. Added proper URL encoding for special characters in database connection strings
3. Configured Prisma to use Data Proxy mode for Vercel deployments
4. Created helper scripts for deployment

## Deployment Steps

### 1. Prepare Your Environment Variables

Create a `.env.local` file with your database credentials:

```
# Database Connection
DATABASE_URL=postgresql://postgres:password@db.ddhhpozckwrbwubugeef.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:password@db.ddhhpozckwrbwubugeef.supabase.co:5432/postgres
```

**Important:** If your password contains special characters, URL-encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- etc.

### 2. Test Database Connection Locally

Run this command to verify your database connection works:

```bash
npx prisma db pull
```

If successful, you'll see your database schema introspected.

### 3. Deploy to Vercel

```bash
# Run the deployment helper script
node scripts/vercel-deploy.js

# Deploy to Vercel
vercel --prod
```

### 4. Set Environment Variables in Vercel

In your Vercel project dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add all variables from `.env.vercel.example`
3. Make sure to set them for all environments (Production, Preview, Development)

### 5. Run Database Migrations After Deployment

After successful deployment, run migrations manually:

```bash
# Pull Vercel environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

## Troubleshooting

### Still Getting Database Connection Errors?

1. **Check Connection String Format**
   - Ensure your DATABASE_URL and DIRECT_URL are correctly formatted
   - Make sure special characters in passwords are URL-encoded

2. **Verify Database Access**
   - Check if your database allows connections from Vercel's IP range
   - Verify your database credentials are correct

3. **Check Vercel Logs**
   - Review function logs in Vercel dashboard for specific error messages

### Need More Help?

If you're still experiencing issues, check the Supabase documentation for connecting to Vercel or contact support.