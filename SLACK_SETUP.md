# 🚀 Slack Integration Setup Guide

## 📋 Overview
This app now uses Slack for order notifications instead of email. When a customer places an order, a beautiful notification is sent to your Slack channel.

## 🔧 Setup Instructions

### 1. Create a Slack App
1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app (e.g., "CleanPods Orders")
4. Select your workspace

### 2. Configure Incoming Webhooks
1. In your Slack app settings, go to "Incoming Webhooks"
2. Toggle "Activate Incoming Webhooks" to ON
3. Click "Add New Webhook to Workspace"
4. Select the channel where you want to receive order notifications
5. Click "Allow"
6. Copy the webhook URL (it looks like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`)

### 3. Add Environment Variable
Add this to your `.env` file:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 4. For Vercel Deployment
Add the environment variable in your Vercel dashboard:
1. Go to your project in Vercel
2. Navigate to Settings → Environment Variables
3. Add:
   - **Name**: `SLACK_WEBHOOK_URL`
   - **Value**: Your webhook URL
   - **Environment**: Production (and Preview if needed)

## 🎯 Features

### ✅ What You'll See in Slack
- **Order ID** and **Payment ID**
- **Total amount** in Indian Rupees
- **Complete order items** with quantities and prices
- **Customer details** (name, email, phone)
- **Shipping address**
- **Order timestamp**
- **Beautiful formatting** with emojis and sections

### 🔄 How It Works
1. Customer places order on your website
2. Payment is processed via Razorpay
3. Order is saved to in-memory database
4. Slack notification is sent automatically
5. You get instant notification in your Slack channel

## 🧪 Testing
1. Place a test order on your website
2. Check your Slack channel for the notification
3. The notification will look professional with all order details

## 🔒 Security
- Webhook URLs are kept secure in environment variables
- No sensitive data is exposed in the notification
- Only order details and customer info are shared

## 🚨 Troubleshooting
- **No notifications?** Check your webhook URL in environment variables
- **Wrong channel?** Recreate the webhook and select the correct channel
- **Format issues?** The notification uses Slack's Block Kit for consistent formatting

## 📱 Example Notification
```
🎉 New Order Received!

Order ID: CP123456789
Payment ID: pay_123456789
Total Amount: ₹530.00
Order Date: 12/19/2023, 2:30:45 PM

📦 Order Items:
• Fresh Clean Pods x2 - ₹265
• Eco-Friendly Detergent x1 - ₹180

👤 Customer Details:
Name: John Doe
Email: john@example.com
Phone: +91 9876543210

📍 Address:
123 Main Street, Mumbai, Maharashtra 400001

🛍️ CleanPods E-commerce Order
```

## 🎉 Benefits
- ✅ **Real-time notifications** - No email delays
- ✅ **Team collaboration** - Multiple people can see orders
- ✅ **Mobile friendly** - Get notifications on your phone
- ✅ **Searchable** - Find orders easily in Slack
- ✅ **No email setup** - No SMTP configuration needed
- ✅ **Free forever** - Slack webhooks are free 