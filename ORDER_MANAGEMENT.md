# 📧 Order Management & Notifications Setup

## 🎯 **How You'll Receive Orders**

Currently, when someone places an order, you have **3 ways** to receive the order details:

### 1. **Console Logs (Current Setup)**
- Order details are logged to the server console
- Check Vercel deployment logs to see new orders
- Good for testing, not ideal for production

### 2. **Admin Dashboard**
- Visit: `https://your-app.vercel.app/admin`
- View all orders, filter by status
- See customer details, payment info, and items
- Real-time order management

### 3. **Email Notifications (Recommended for Production)**

---

## 📧 **Setting Up Email Notifications**

Choose one of these email services:

### **Option 1: Gmail SMTP (Free & Easy)**

1. **Install nodemailer:**
   ```bash
   npm install nodemailer
   npm install @types/nodemailer --save-dev
   ```

2. **Add to `.env`:**
   ```
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-app-password
   ADMIN_EMAIL=your-business-email@gmail.com
   ```

3. **Enable App Password in Gmail:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"

4. **Update `/api/send-order-email/route.ts`:**
   ```typescript
   import nodemailer from 'nodemailer';

   const transporter = nodemailer.createTransporter({
     service: 'gmail',
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASS,
     },
   });

   // Replace the console.log with:
   await transporter.sendMail({
     from: process.env.EMAIL_USER,
     to: process.env.ADMIN_EMAIL,
     subject: `New Order #${orderData.id}`,
     html: adminEmailContent.html,
   });
   ```

### **Option 2: SendGrid (Professional)**

1. **Install SendGrid:**
   ```bash
   npm install @sendgrid/mail
   ```

2. **Add to `.env`:**
   ```
   SENDGRID_API_KEY=your-sendgrid-api-key
   ADMIN_EMAIL=your-business-email@gmail.com
   ```

3. **Update API route:**
   ```typescript
   import sgMail from '@sendgrid/mail';
   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

   await sgMail.send({
     to: process.env.ADMIN_EMAIL,
     from: 'orders@cleanpods.com',
     subject: `New Order #${orderData.id}`,
     html: adminEmailContent.html,
   });
   ```

### **Option 3: Resend (Modern & Simple)**

1. **Install Resend:**
   ```bash
   npm install resend
   ```

2. **Add to `.env`:**
   ```
   RESEND_API_KEY=your-resend-api-key
   ADMIN_EMAIL=your-business-email@gmail.com
   ```

3. **Update API route:**
   ```typescript
   import { Resend } from 'resend';
   const resend = new Resend(process.env.RESEND_API_KEY);

   await resend.emails.send({
     from: 'orders@cleanpods.com',
     to: process.env.ADMIN_EMAIL,
     subject: `New Order #${orderData.id}`,
     html: adminEmailContent.html,
   });
   ```

---

## 🗄️ **Database Integration (Optional)**

For permanent order storage, integrate with a database:

### **Option 1: MongoDB (Free)**
```bash
npm install mongodb mongoose
```

### **Option 2: PostgreSQL (Vercel)**
```bash
npm install @vercel/postgres
```

### **Option 3: Firebase (Google)**
```bash
npm install firebase-admin
```

---

## 📱 **WhatsApp Notifications (Bonus)**

Get instant order notifications on WhatsApp:

1. **Use Twilio WhatsApp API**
2. **Or integrate with WhatsApp Business API**
3. **Send order summary to your WhatsApp**

---

## 🔔 **What You'll Receive**

When someone places an order, you'll get:

### **Admin Email:**
```
Subject: New Order #CP123ABC - ₹599

New Order Received!
Order ID: CP123ABC
Customer: John Doe
Email: john@example.com
Phone: 9876543210
Address: 123 Main St, Mumbai, Maharashtra 400001
Total Amount: ₹599
Payment ID: pay_xyz123

Items Ordered:
• Ultimate Care - Quantity: 1 - ₹599

Please process this order and arrange for shipping.
```

### **Customer Confirmation:**
```
Subject: Order Confirmation #CP123ABC - CleanPods

Thank you for your order!
Dear John,
Your order has been confirmed and is being processed.

Order Details:
Order ID: CP123ABC
Total Amount: ₹599
Payment ID: pay_xyz123

Items Ordered:
• Ultimate Care - Quantity: 1 - ₹599

Shipping Address:
123 Main St
Mumbai, Maharashtra 400001

We'll send you tracking information once your order ships.
Thank you for choosing CleanPods!
```

---

## 🚀 **Quick Setup Recommendation**

**For immediate use:**
1. Use Gmail SMTP (free and quick)
2. Check admin dashboard daily
3. Monitor Vercel logs

**For professional business:**
1. Set up SendGrid or Resend
2. Add database integration
3. Set up automated workflows

---

## 📊 **Order Management Workflow**

1. **Customer places order** → Payment processed
2. **You receive email** → Order notification
3. **Check admin dashboard** → View order details
4. **Process order** → Prepare for shipping
5. **Update status** → Mark as shipped
6. **Customer gets tracking** → Delivery confirmation

---

## 🔧 **Testing Email Setup**

1. Place a test order on your site
2. Check your email for notifications
3. Verify all order details are correct
4. Test customer confirmation emails

---

## 📞 **Support**

If you need help setting up email notifications:
1. Choose your preferred email service
2. Follow the setup guide above
3. Test with a sample order
4. Monitor for any issues