# 🚀 CleanPods Deployment Guide

## Option 1: Vercel (Recommended) ⭐

### Why Vercel?
- ✅ **Perfect for Next.js** - Built by the Next.js team
- ✅ **Handles API routes** - Your backend will work seamlessly
- ✅ **Serverless functions** - Automatic scaling
- ✅ **Free tier** - Great for getting started
- ✅ **Easy setup** - Zero configuration needed

### Deployment Steps:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - CleanPods e-commerce app"
   git branch -M main
   git remote add origin https://github.com/yourusername/cleanpods.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js settings
   - Click "Deploy"

3. **Add Environment Variables:**
   - In Vercel dashboard → Project → Settings → Environment Variables
   - Add these variables (make sure to use the exact names):
     ```
     RAZORPAY_KEY_ID = rzp_test_8FhZsj7WtT228R
     RAZORPAY_KEY_SECRET = OclgSCmRYoNmRN4dzoQd2sKl
     NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_test_8FhZsj7WtT228R
     RESEND_API_KEY = your_resend_api_key_here
     ADMIN_EMAIL = your-business-email@gmail.com
     ```
   
   **Important:**
   - Don't use quotes around the values
   - Make sure there are no extra spaces
   - Use the exact variable names as shown above

4. **Redeploy:**
   - After adding environment variables, trigger a new deployment
   - Your app will be live at `https://your-app-name.vercel.app`

---

## Option 2: Netlify

### Steps:
1. Build the app: `npm run build`
2. Deploy the `out` folder to Netlify
3. Add environment variables in Netlify dashboard
4. Configure serverless functions for API routes

---

## Option 3: Railway

### Steps:
1. Connect GitHub repository
2. Railway auto-detects Next.js
3. Add environment variables
4. Deploy automatically

---

## Option 4: DigitalOcean App Platform

### Steps:
1. Connect GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy with automatic scaling

---

## Option 5: AWS (Advanced)

### Using AWS Amplify:
1. Connect GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy with CDN

### Using AWS Lambda + API Gateway:
1. Use `serverless` framework
2. Deploy API routes as Lambda functions
3. Deploy frontend to S3 + CloudFront

---

## 🔧 Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Razorpay keys are correct
- [ ] All dependencies in package.json
- [ ] Build process works locally (`npm run build`)
- [ ] API routes tested
- [ ] Payment flow tested

---

## 🌐 Post-Deployment Steps

1. **Test the live application:**
   - Browse products
   - Add to cart
   - Test checkout form
   - Verify Razorpay integration

2. **Update Razorpay settings:**
   - Add your domain to Razorpay dashboard
   - Configure webhooks if needed

3. **Monitor performance:**
   - Check Vercel analytics
   - Monitor API response times
   - Test on different devices

---

## 🔒 Security Notes

- Never commit `.env` files to GitHub
- Use environment variables for all secrets
- Enable HTTPS (automatic on Vercel)
- Configure CORS if needed

---

## 📞 Support

If you encounter any issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API routes individually
4. Check browser console for errors