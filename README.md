# BubbleBeads - Premium Laundry Detergent Pods

A modern, full-featured e-commerce application for selling premium laundry detergent pods. Built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core E-commerce Features
- **Product Catalog**: Three premium detergent pod products with detailed information
- **Shopping Cart**: Persistent cart with quantity management and real-time totals
- **Wishlist**: Save favorite products for later
- **User Authentication**: Login/register system with profile management
- **Order Management**: Complete order history and tracking
- **Search Functionality**: Real-time product search with filtering
- **Responsive Design**: Mobile-first approach with modern UI

### Advanced Features
- **State Management**: Zustand for global state management with persistence
- **Form Validation**: React Hook Form with comprehensive validation
- **Toast Notifications**: Real-time user feedback with react-hot-toast
- **Payment Integration**: Razorpay payment gateway integration
- **TypeScript**: Full type safety throughout the application
- **SEO Optimized**: Meta tags, structured data, and performance optimized

## 🛠️ Technology Stack

- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4.17
- **State Management**: Zustand 4.4.7
- **Forms**: React Hook Form 7.48.2
- **Notifications**: React Hot Toast 2.4.1
- **Icons**: Remix Icons (via CSS classes)
- **Payment**: Razorpay integration
- **Build**: Static export with optimization

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clean-pods
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
clean-pods/
├── app/
│   ├── auth/                    # Authentication pages
│   │   ├── login/page.tsx      # Login page
│   │   └── register/page.tsx   # Registration page
│   ├── cart/page.tsx           # Shopping cart
│   ├── checkout/page.tsx       # Checkout process
│   ├── components/             # Reusable components
│   │   ├── Header.tsx         # Navigation header
│   │   └── ToastProvider.tsx  # Toast notifications
│   ├── lib/                   # Utilities and store
│   │   ├── store.ts          # Zustand store
│   │   └── utils.ts          # Helper functions
│   ├── orders/page.tsx        # Order history
│   ├── products/              # Product pages
│   │   └── [id]/
│   │       ├── page.tsx      # Dynamic product pages
│   │       └── ProductDetail.tsx
│   ├── profile/page.tsx       # User profile
│   ├── search/page.tsx        # Search results
│   ├── wishlist/page.tsx      # Wishlist management
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Homepage
├── package.json
├── tailwind.config.js
└── README.md
```

## 🎯 Key Features Explained

### 1. Authentication System
- **Login**: Email/password authentication with demo credentials
- **Registration**: Complete user registration with validation
- **Profile Management**: Edit personal information and preferences
- **Session Persistence**: Automatic login state management

**Demo Credentials:**
- Email: `demo@bubblebeads.com`
- Password: `demo123`

### 2. Product Management
- **Three Product Types**:
  - Essential Clean (₹299): Basic detergent pods
  - Soft & Fresh (₹449): Detergent + fabric softener
  - Ultimate Care (₹599): Complete solution with stain remover

### 3. Shopping Experience
- **Add to Cart**: One-click product addition
- **Wishlist**: Save products for later purchase
- **Quantity Management**: Adjust quantities in cart
- **Real-time Totals**: Automatic tax calculation (18% GST)

### 4. Order Processing
- **Checkout Flow**: Multi-step checkout with form validation
- **Payment Integration**: Razorpay payment gateway
- **Order Confirmation**: Success page with order details
- **Order History**: Complete order tracking and management

### 5. Search & Navigation
- **Global Search**: Search across all products
- **Responsive Navigation**: Mobile-friendly navigation
- **Breadcrumb Navigation**: Easy navigation between pages

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for production:

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
NEXT_PUBLIC_RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### Payment Gateway
The application uses Razorpay for payments. Update the payment configuration in `app/checkout/page.tsx`:

```typescript
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  // ... other configuration
};
```

## 🚀 Deployment

### Static Export
The application is configured for static export:

```bash
npm run build
```

This generates a static site in the `out/` directory that can be deployed to any static hosting service.

### Vercel Deployment
1. Connect your repository to Vercel
2. Vercel will automatically detect Next.js configuration
3. Deploy with zero configuration

## 🎨 Customization

### Styling
- **Colors**: Update Tailwind config in `tailwind.config.js`
- **Fonts**: Modify font imports in `app/layout.tsx`
- **Components**: Edit component styles in respective files

### Products
Add new products by updating the products array in:
- `app/page.tsx` (homepage products)
- `app/search/page.tsx` (search products)
- `app/products/[id]/ProductDetail.tsx` (product details)

### Features
- **Add new pages**: Create new routes in the `app/` directory
- **Extend store**: Add new state management in `app/lib/store.ts`
- **Custom components**: Create reusable components in `app/components/`

## 📱 Responsive Design

The application is fully responsive with:
- **Mobile-first approach**: Optimized for mobile devices
- **Breakpoint system**: Tailwind CSS responsive utilities
- **Touch-friendly**: Large touch targets and intuitive gestures
- **Progressive enhancement**: Works on all device sizes

## 🔒 Security Features

- **Form Validation**: Client-side and server-side validation
- **Input Sanitization**: XSS protection and data sanitization
- **Secure Payments**: PCI DSS compliant payment processing
- **HTTPS Ready**: Configured for secure connections

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Product browsing and search
- [ ] Add to cart and wishlist functionality
- [ ] Checkout process and payment
- [ ] Order history and tracking
- [ ] Profile management
- [ ] Responsive design on different devices

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   npm run build
   ```
   Check for TypeScript errors and fix accordingly.

2. **Dependency Issues**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```
   Ensure port 3000 is available.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Email: support@bubblebeads.com
- Phone: 1-800-BUBBLEBEADS
- Hours: Mon-Fri 9AM-6PM

---

**BubbleBeads** - Revolutionary laundry made simple. 🧺✨
