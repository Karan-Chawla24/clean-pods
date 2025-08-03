# 📧 Email Notifications Setup Guide

## 🚀 **Quick Setup (5 minutes)**

Your email notification system is already implemented! Just follow these simple steps:

### **Step 1: Get Resend API Key (Free)**

1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your email address
4. Go to **API Keys** section
5. Click **"Create API Key"**
6. Copy the API key (starts with `re_`)

### **Step 2: Update Environment Variables**

In your **Vercel dashboard** (after deployment):

1. Go to your project → **Settings** → **Environment Variables**
2. Add these variables:

```
RESEND_API_KEY = re_your_actual_api_key_here
ADMIN_EMAIL = your-business-email@gmail.com
```

### **Step 3: Domain Setup (Optional but Recommended)**

1. In Resend dashboard, go to **Domains**
2. Add your domain (e.g., `cleanpods.com`)
3. Add the DNS records they provide
4. Verify domain

**Without domain setup:** Emails will be sent from `orders@cleanpods.com` (may go to spam)
**With domain setup:** Emails will be sent from your verified domain (better delivery)

---

## 📧 **What You'll Receive**

### **Admin Notification Email:**
```
Subject: 🎉 New Order #CP123ABC - ₹599

Beautiful HTML email with:
✅ Order details (ID, total, payment ID)
✅ Customer information (name, email, phone, address)
✅ Items ordered with quantities and prices
✅ Professional CleanPods branding
```

### **Customer Confirmation Email:**
```
Subject: ✅ Order Confirmation #CP123ABC - CleanPods

Professional email with:
✅ Order confirmation and thank you message
✅ Order summary with all details
✅ Shipping address confirmation
✅ CleanPods branding and contact info
```

---

## 🎯 **Email Features Included:**

✅ **Professional HTML templates** with CleanPods branding
✅ **Automatic admin notifications** for every order
✅ **Customer confirmation emails** with order details
✅ **Mobile-responsive** email design
✅ **Error handling** - orders won't fail if email fails
✅ **Fallback logging** - orders still logged to console

---

## 💰 **Resend Pricing:**

- **Free tier**: 3,000 emails/month
- **Pro tier**: $20/month for 50,000 emails
- **Perfect for small to medium businesses**

---

## 🔧 **Testing Your Setup:**

1. Deploy your app to Vercel
2. Add the environment variables
3. Place a test order
4. Check your email for notifications
5. Verify customer receives confirmation

---

## 🚨 **Troubleshooting:**

**Emails not sending?**
- Check if `RESEND_API_KEY` is set correctly
- Verify your Resend account is active
- Check Vercel deployment logs for errors

**Emails going to spam?**
- Set up domain verification in Resend
- Add SPF/DKIM records to your domain
- Use a professional "from" address

**Customer not receiving emails?**
- Check their spam folder
- Verify email address is correct
- Test with different email providers

---

## 🎉 **You're All Set!**

Once configured, you'll automatically receive:
- **Instant email notifications** for every order
- **Professional customer confirmations**
- **Complete order details** in beautiful HTML format

**Your e-commerce business is now fully automated!** 🚀