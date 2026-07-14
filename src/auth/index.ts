import NextAuth, { type DefaultSession, type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserStatus } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      mustChangePassword: boolean;
    };
  }

  interface User {
    role?: string;
    mustChangePassword?: boolean;
  }
}

export const runtime = "nodejs";

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // The Credentials provider only supports JWT sessions in next-auth v4 - database
  // strategy sessions require an OAuth-style adapter-backed sign-in.
  session: { strategy: "jwt" as const },
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email).toLowerCase() },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(String(credentials.password), user.passwordHash);

        if (!isValid) {
          return null;
        }

        // Only ACTIVE and PENDING_PASSWORD_CHANGE accounts may sign in; the
        // latter is allowed through so the user can be routed to the forced
        // change-password flow rather than being locked out entirely.
        if (
          user.status !== UserStatus.ACTIVE &&
          user.status !== UserStatus.PENDING_PASSWORD_CHANGE
        ) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? user.avatarUrl ?? null,
          role: user.role as string,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "STUDENT";
        token.mustChangePassword =
          (user as { mustChangePassword?: boolean }).mustChangePassword ?? false;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "STUDENT";
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }

      return session;
    },
  },
};

const authHandler = NextAuth(authConfig);

export const GET = authHandler;
export const POST = authHandler;
export const auth = authHandler;
export const signIn = authHandler;
export const signOut = authHandler;
