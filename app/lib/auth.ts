import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        firstName: { label: "First Name", type: "text" },
        lastName: { label: "Last Name", type: "text" },
        isSignUp: { label: "Sign Up", type: "hidden" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const isSignUp = credentials.isSignUp === "true";

        try {
          if (isSignUp) {
          // Sign up logic
          if (!credentials.firstName || !credentials.lastName) {
            throw new Error("First name and last name are required for signup");
          }

          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (existingUser) {
            throw new Error("User with this email already exists");
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(credentials.password, 12);

          // Create new user
          const user = await prisma.user.create({
            data: {
              email: credentials.email,
              password: hashedPassword,
              firstName: credentials.firstName,
              lastName: credentials.lastName,
              name: `${credentials.firstName} ${credentials.lastName}`,
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
          };
        } else {
          // Sign in logic
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            throw new Error("Invalid email or password");
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
          };
        }
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('Authentication failed');
        }
      },
    }),
  ],
  
  session: {
    strategy: "jwt",
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      
      // If this is a Google sign in, update the user's name from Google
      if (account?.provider === "google" && user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        
        if (dbUser) {
          // Update name from Google if not set
          if (!dbUser.firstName && user.name) {
            const nameParts = user.name.split(' ');
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                firstName: nameParts[0] || user.name,
                lastName: nameParts.slice(1).join(' ') || '',
                name: user.name,
              },
            });
          }
          
          token.firstName = dbUser.firstName || undefined;
          token.lastName = dbUser.lastName || undefined;
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },
  },
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error", // Error code passed in query string as ?error=
  },
  
  debug: process.env.NODE_ENV === 'development',
  
  secret: process.env.NEXTAUTH_SECRET,
};
