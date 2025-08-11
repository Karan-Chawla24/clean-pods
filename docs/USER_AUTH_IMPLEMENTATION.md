# User Authentication Implementation with NextAuth.js

This document explains the complete NextAuth.js implementation in the Clean Pods e-commerce application.

## Overview

The application now includes comprehensive user authentication using NextAuth.js v4 with the following features:

- **Email/Password Authentication**: Users can sign up and sign in with email and password
- **Google OAuth**: Users can sign in with their Google account
- **User Profile Management**: Users can update their profile information
- **Protected Routes**: Certain routes require authentication
- **Order Management**: Authenticated users have their orders saved to their account
- **Session Management**: Persistent user sessions with automatic token refresh

## Architecture

### Core Components

1. **AuthProvider** (`app/components/AuthProvider.tsx`)
   - Wraps the entire application with NextAuth SessionProvider
   - Manages session state throughout the app

2. **Auth Configuration** (`app/lib/auth.ts`)
   - NextAuth configuration with providers and callbacks
   - Handles both credentials and Google OAuth authentication
   - Manages JWT tokens and user sessions

3. **Database Integration** (`prisma/schema.prisma`)
   - User, Account, Session, and VerificationToken models for NextAuth
   - Order model with optional user relationship for authenticated users

### Authentication Providers

#### 1. Credentials Provider
- Handles both sign-up and sign-in operations
- Password hashing with bcryptjs
- User creation and validation

#### 2. Google OAuth Provider
- Seamless Google sign-in integration
- Automatic user profile sync from Google
- Handles first-time user creation

### Database Schema

The application uses the following models for authentication:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // For credentials provider
  firstName     String?
  lastName      String?
  phone         String?
  address       String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  orders        Order[]
  accounts      Account[]
  sessions      Session[]
}
```

### Protected Routes

The following routes require authentication:

- `/profile` - User profile management
- `/api/user/orders` - User-specific orders API
- `/api/user/profile` - User profile update API

### Authentication Flow

#### Sign Up Flow
1. User fills out registration form
2. Form validation on client-side
3. NextAuth credentials provider creates user
4. Password is hashed and stored
5. User is automatically signed in
6. Session is created and stored

#### Sign In Flow
1. User enters credentials or clicks Google sign-in
2. NextAuth validates credentials or handles OAuth
3. JWT token is created with user information
4. Session is established
5. User is redirected to intended page

#### Order Management Integration
- **Authenticated Users**: Orders are saved to database with user relationship
- **Guest Users**: Orders are stored in localStorage for privacy
- **Seamless Experience**: Users can checkout regardless of authentication status

## Security Features

### CSRF Protection
- All API routes are protected with CSRF tokens
- Middleware validates CSRF tokens on state-changing requests
- Integration with existing security layers

### Password Security
- Passwords are hashed using bcryptjs with salt rounds
- No plaintext passwords are stored
- Secure password validation

### Session Security
- HTTP-only cookies for session tokens
- Secure flag in production environments
- SameSite cookie protection

## User Experience

### Header Integration
- Dynamic authentication state display
- User avatar and dropdown menu for authenticated users
- Sign in/Sign up buttons for unauthenticated users
- Seamless transition between states

### Profile Management
- Complete user profile editing
- Phone and address management
- Account information display
- Session update integration

### Order History
- Authenticated users see orders from database
- Guest orders remain in localStorage
- Secure order viewing with authentication check

## Environment Variables

Required environment variables for authentication:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
```

## API Routes

### Authentication Routes
- `/api/auth/[...nextauth]` - NextAuth.js dynamic route
- `/api/auth/signin` - Custom sign-in page
- `/api/auth/signup` - Custom sign-up page

### Protected API Routes
- `/api/user/profile` - GET/PUT user profile
- `/api/user/orders` - GET/POST user orders

### Middleware Protection
- CSRF protection for all state-changing requests
- Authentication protection for user-specific routes
- Automatic redirect to sign-in for protected routes

## Migration from Guest to Authenticated

The implementation supports seamless migration:

1. **Guest Checkout**: Users can checkout without signing up
2. **Post-Purchase Registration**: Users can create accounts after purchase
3. **Order Association**: Future orders are automatically associated with account
4. **Data Preservation**: Guest orders remain accessible through localStorage

## Testing

### Manual Testing Checklist
- [ ] User registration with email/password
- [ ] User sign-in with email/password
- [ ] Google OAuth sign-in
- [ ] Profile information update
- [ ] Protected route access control
- [ ] Order creation for authenticated users
- [ ] Order history viewing
- [ ] Session persistence across browser refresh
- [ ] Sign-out functionality

### Common Issues and Solutions

1. **Google OAuth Setup**
   - Ensure Google Client ID and Secret are configured
   - Add authorized redirect URIs in Google Console
   - Verify environment variables are loaded

2. **Database Connection**
   - Ensure PostgreSQL database is running
   - Run `prisma migrate dev` after schema changes
   - Verify DATABASE_URL is correct

3. **Session Issues**
   - Check NEXTAUTH_SECRET is set
   - Verify NEXTAUTH_URL matches your domain
   - Clear browser cookies if experiencing issues

## Future Enhancements

Potential improvements for the authentication system:

1. **Email Verification**
   - Add email verification for new accounts
   - Implement email change verification

2. **Password Reset**
   - Add forgot password functionality
   - Secure password reset flow

3. **Two-Factor Authentication**
   - Optional 2FA for enhanced security
   - SMS or authenticator app integration

4. **Social Providers**
   - Add more OAuth providers (GitHub, Facebook, etc.)
   - Provider linking for existing accounts

5. **Role-Based Access Control**
   - Admin roles and permissions
   - Customer service roles
   - Advanced authorization logic

## Conclusion

The NextAuth.js implementation provides a robust, secure, and user-friendly authentication system that integrates seamlessly with the existing e-commerce functionality. Users can enjoy both guest and authenticated experiences while maintaining security and data integrity.

# User Authentication Implementation Guide

## Difficulty: 6/10 (Moderate)

This guide outlines how to implement user authentication for the Clean Pods e-commerce application.

## 1. Database Schema Changes (Easy)

### Add User model to `prisma/schema.prisma`:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // Hashed password
  firstName     String
  lastName      String
  phone         String?
  address       String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  orders        Order[]
  
  @@map("users")
}

// Update Order model to link to User
model Order {
  id              String      @id @default(cuid())
  razorpayOrderId String?     @unique
  paymentId       String
  total           Float
  orderDate       DateTime    @default(now())
  
  // User relation
  user            User        @relation(fields: [userId], references: [id])
  userId          String
  
  // Customer info (can be different from user account)
  customerName    String
  customerEmail   String
  customerPhone   String
  address         String
  
  items           OrderItem[]
  
  @@map("orders")
}
```

**Migration command**: `npx prisma migrate dev --name add_user_auth`

## 2. API Routes (Moderate)

### Create new API endpoints:

#### `/app/api/auth/register/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();
    
    // Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    
    // Set session cookie
    const response = NextResponse.json({ user });
    response.cookies.set('auth-session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
```

#### `/app/api/auth/login/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await compare(password, user.password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, firstName: user.firstName }
    });
    
    response.cookies.set('auth-session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
```

#### `/app/api/auth/me/route.ts`
```typescript
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('auth-session')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true }
  });
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  return NextResponse.json({ user });
}
```

## 3. Frontend Components (Moderate)

### Login/Register Forms:

#### `/app/login/page.tsx`
```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/lib/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuthStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const { user } = await response.json();
        setUser(user);
        router.push('/products');
      } else {
        // Handle error
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        required 
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        required 
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

### Auth Store (Easy):

#### `/app/lib/authStore.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-store' }
  )
);
```

## 4. Update Existing Components (Moderate)

### Update Orders to be User-Specific:

#### Modify `/app/api/orders/route.ts`:
```typescript
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('auth-session')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { orderDate: 'desc' },
  });
  
  return NextResponse.json(orders);
}
```

### Update Checkout Flow:
- Link orders to authenticated user
- Pre-fill customer details from user profile
- Store orders in database instead of localStorage

## 5. Migration Strategy (Complex)

### Migrate Existing Orders:
```typescript
// Migration script to move localStorage orders to database
async function migrateLocalStorageOrders(userId: string, localOrders: any[]) {
  for (const order of localOrders) {
    await prisma.order.create({
      data: {
        userId,
        razorpayOrderId: order.razorpayOrderId,
        paymentId: order.paymentId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        address: order.address,
        total: order.total,
        orderDate: new Date(order.orderDate),
        items: {
          create: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });
  }
}
```

## Implementation Timeline

### Phase 1 (1-2 days):
1. ✅ Database schema changes
2. ✅ Basic auth API routes
3. ✅ Auth store setup

### Phase 2 (2-3 days):
4. ✅ Login/Register UI
5. ✅ Auth middleware
6. ✅ Update Header component

### Phase 3 (2-3 days):
7. ✅ Modify orders system
8. ✅ Update checkout flow
9. ✅ Migration strategy

### Phase 4 (1 day):
10. ✅ Testing and bug fixes
11. ✅ Documentation updates

**Total Estimated Time: 6-9 days**

## Complexity Breakdown:

- **Database**: Easy (2-3 hours)
- **Backend APIs**: Moderate (1-2 days)
- **Frontend Auth**: Moderate (2-3 days)
- **Integration**: Complex (2-3 days)
- **Migration**: Complex (1-2 days)
- **Testing**: Moderate (1 day)

## Benefits After Implementation:

✅ **Users can access orders from any device**
✅ **Orders persist even if browser data is cleared**
✅ **Better security and privacy**
✅ **User profiles and preferences**
✅ **Email notifications and order tracking**
✅ **Admin can associate orders with users**

## Alternative: Quick Implementation with NextAuth.js

For a **faster implementation (3-4 days)**, consider using **NextAuth.js**:

```bash
npm install next-auth
```

This provides:
- Pre-built auth components
- Multiple login providers (Google, GitHub, etc.)
- Session management
- Database adapters

Would you like me to show you the NextAuth.js approach instead?
