import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import { queryUser } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Ensure AUTH_SECRET is defined
const authSecret = process.env.AUTH_SECRET;
if (!authSecret) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = await loginSchema.parseAsync(credentials);

          // Query user from database
          const user = await queryUser(email);

          if (!user) {
            console.log(`❌ User not found: ${email}`);
            return null;
          }

          // Verify password
          const passwordMatch = await bcryptjs.compare(password, user.password || "");

          if (!passwordMatch) {
            console.log(`❌ Password mismatch for user: ${email}`);
            return null;
          }

          console.log(`✅ User authenticated: ${email}`);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: authSecret,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user }) {
      console.log(`✅ Session started for: ${user.email}`);
    },
    async signOut() {
      console.log("📤 User signed out");
    },
  },
});
