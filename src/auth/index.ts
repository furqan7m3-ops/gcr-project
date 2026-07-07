import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
    };
  }

  interface User {
    role?: string;
  }
}

export const runtime = "nodejs";

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" as const },
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

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? user.avatarUrl ?? null,
          role: user.role as string,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "STUDENT";
      }

      return token;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id as string;
        (session.user as typeof session.user & { role?: string }).role =
          (user as { role?: string }).role ?? "STUDENT";
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
