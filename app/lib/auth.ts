import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import type { User as PrismaUser } from "@prisma/client";

// Define the return type for the authorize function
type AuthorizeResult = {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
} | null;

// ✅ Environment variable validation
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Missing required environment variable: NEXTAUTH_SECRET");
}
if (!process.env.DATABASE_URL) {
  throw new Error("Missing required environment variable: DATABASE_URL");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        firstName: { label: "First Name", type: "text" },
        lastName: { label: "Last Name", type: "text" },
        isSignUp: { label: "Sign Up", type: "hidden" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const isSignUp = credentials.isSignUp === "true";

        if (isSignUp) {
          if (!credentials.firstName || !credentials.lastName) {
            throw new Error("First name and last name are required");
          }

          const existingUser = await prisma.user.findUnique({
            where: { email: credentials.email },
          }) as PrismaUser | null;

          if (existingUser) {
            throw new Error("User with this email already exists");
          }

          const hashedPassword = await bcrypt.hash(credentials.password, 12);

          const newUser = await prisma.user.create({
            data: {
              email: credentials.email,
              password: hashedPassword,
              firstName: credentials.firstName,
              lastName: credentials.lastName,
              name: `${credentials.firstName} ${credentials.lastName}`,
            },
          }) as PrismaUser;

          const fullName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name ?? undefined,
            firstName: newUser.firstName ?? undefined,
            lastName: newUser.lastName ?? undefined,
          };
        }

        // Signin flow
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }

      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (dbUser) {
          token.firstName = dbUser.firstName || token.firstName;
          token.lastName = dbUser.lastName || token.lastName;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.firstName = (token.firstName as string) || undefined;
        session.user.lastName = (token.lastName as string) || undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
