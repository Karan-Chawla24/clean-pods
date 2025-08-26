# Vercel Deployment Guide for Clean Pods

This guide will help you deploy your Clean Pods Next.js application to Vercel with proper database configuration.

## Prerequisites

1. **Database Setup**: Ensure your Supabase PostgreSQL database is running and accessible
2. **Environment Variables**: Gather all required environment variables
3. **Vercel Account**: Have a Vercel account ready

## Step 1: Prepare Environment Variables

Before deploying, ensure you have these environment variables ready:

### Required Variables:
```bash
# Database (CRITICAL)
DATABASE_URL="postgresql://username:password@db.ddhhpozckwrbwubugeef.supabase.co:5432/postgres"
DIRECT_URL="postgresql://username:password@db.ddhhpozckwrbwubugeef.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-32-character-secret-here"

# Razorpay
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="your_razorpay_key_id"

# Admin
ADMIN_PASSWORD="your_hashed_password"
ADMIN_PASSWORD_SALT="your_salt"
ADMIN_ORDERS_KEY="your_secret_key"

# JWT Secret
JWT_SECRET="your_jwt_secret_for_invoice_tokens"
```

### Optional Variables:
```bash
# Google OAuth (if using Google login)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Slack Notifications
SLACK_WEBHOOK_URL="your_slack_webhook"
SLACK_CONTACT_URL="your_contact_webhook"
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

### Option B: Deploy via GitHub Integration
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables in project settings

## Step 3: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all the environment variables listed above
4. Make sure to set them for **Production**, **Preview**, and **Development** environments

## Step 4: Set up Database Schema

After successful deployment, you need to set up your database schema:

### Method 1: Using Vercel CLI (Recommended)
```bash
# Connect to your deployed project
vercel env pull .env.local

# Run database setup
npm run db:setup
```

### Method 2: Manual Database Setup
If you can't run commands locally, you can:

1. Access your Supabase dashboard
2. Go to the SQL editor
3. Run the following SQL to create tables:

```sql
-- Create the database schema manually
-- (Copy the SQL from your Prisma migrations or use Prisma Studio)
```

## Step 5: Verify Deployment

1. **Check Database Connection**: Visit `https://your-app.vercel.app/api/test-db`
2. **Test Authentication**: Try logging in
3. **Test Orders**: Place a test order
4. **Check Admin Panel**: Access admin routes

## Step 6: Common Issues and Solutions

### Build Error: "Can't reach database server"
- **Cause**: Build script tries to connect to database during build
- **Solution**: ✅ Fixed in `package.json` - build script no longer includes `db push`

### Authentication Error: "Configuration"
- **Cause**: Missing or incorrect `NEXTAUTH_SECRET` or `NEXTAUTH_URL`
- **Solution**: Ensure these environment variables are set correctly

### Orders Not Saving
- **Cause**: Database schema not deployed
- **Solution**: Run `npm run db:setup` after deployment

### 500 Internal Server Error
- **Cause**: Database connection issues or missing environment variables
- **Solution**: Check Vercel function logs and verify all environment variables

## Step 7: Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] Authentication working
- [ ] Payment system functional (test mode)
- [ ] Admin panel accessible
- [ ] Contact form working
- [ ] Order system working

## Database Connection Troubleshooting

If you're still getting database connection errors:

1. **Verify Supabase URL**: Ensure the database URL is correct and accessible
2. **Check Connection Limits**: Supabase free tier has connection limits
3. **Test Connection**: Use a database client to verify connectivity
4. **Review Logs**: Check Vercel function logs for specific error messages

## Performance Optimization

After deployment, consider:

1. **Database Connection Pooling**: Supabase provides connection pooling
2. **Caching**: Implement Redis or similar for session storage
3. **Image Optimization**: Use Vercel's image optimization
4. **CDN**: Static assets are automatically served via Vercel's CDN

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Enable CSRF protection (already configured)
- Consider rate limiting for API endpoints
- Review admin access controls

---

**Need Help?** Check Vercel function logs in the dashboard for specific error messages.
