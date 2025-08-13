import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from './prisma';
import bcrypt from "bcryptjs";
import type { User as PrismaUser } from "@prisma/client";

const credentialsProvider = CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "text" },
    password: { label: "Password", type: "password" },
    firstName: { label: "First Name", type: "text", optional: true },
    lastName: { label: "Last Name", type: "text", optional: true },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) {
      throw new Error("Email and password are required.");
    }

    // Find existing user
    let existingUser = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    // SIGNUP: Create new user if not found
    if (!existingUser) {
      if (!credentials.firstName || !credentials.lastName) {
        throw new Error("First name and last name are required for signup.");
      }

      const hashedPassword = await bcrypt.hash(credentials.password, 10);

      existingUser = await prisma.user.create({
        data: {
          email: credentials.email,
          password: hashedPassword,
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          name: `${credentials.firstName} ${credentials.lastName}`.trim(),
        },
      });
    }

    // SIGNIN: Validate password for existing user
    if (!existingUser.password) {
      throw new Error("This account does not have a password set.");
    }

    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      existingUser.password
    );

    if (!isPasswordValid) {
      throw new Error("Invalid email or password.");
    }

    // Return user object
    return {
      id: existingUser.id,
      email: existingUser.email,
      name:
        existingUser.name ||
        `${existingUser.firstName || ""} ${existingUser.lastName || ""}`.trim(),
      firstName: existingUser.firstName ?? undefined,
      lastName: existingUser.lastName ?? undefined,
    };
  },
});

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    credentialsProvider
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },
  },
};
