import { randomUUID } from "crypto";

import NextAuth, { type DefaultSession, type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { recordAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/system-settings";
import { ActivityAction, UserStatus } from "@/generated/prisma/enums";

// After this many consecutive failed attempts, the account is auto-locked
// (UserStatus.LOCKED) until an admin unlocks it from /admin/security.
const FAILED_LOGIN_LOCK_THRESHOLD = 5;

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      mustChangePassword: boolean;
    };
    sessionId?: string;
  }

  interface User {
    role?: string;
    mustChangePassword?: boolean;
    loginIpAddress?: string | null;
    loginUserAgent?: string | null;
  }
}

export const runtime = "nodejs";

/** Best-effort header extraction - NextAuth v4's `req` shape varies by runtime/adapter. */
function extractHeader(headers: unknown, name: string): string | null {
  if (!headers) {
    return null;
  }
  if (headers instanceof Headers) {
    return headers.get(name);
  }
  if (typeof headers === "object") {
    const value =
      (headers as Record<string, unknown>)[name] ??
      (headers as Record<string, unknown>)[name.toLowerCase()];
    if (Array.isArray(value)) {
      return (value[0] as string) ?? null;
    }
    if (typeof value === "string") {
      return value;
    }
  }
  return null;
}

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
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase();
        const ipAddress =
          extractHeader(req?.headers, "x-forwarded-for")?.split(",")[0]?.trim() ?? null;
        const userAgent = extractHeader(req?.headers, "user-agent");

        const user = await prisma.user.findUnique({ where: { email } });

        async function recordAttempt(succeeded: boolean) {
          await prisma.loginAttempt.create({
            data: { email, userId: user?.id ?? null, succeeded, ipAddress, userAgent },
          });
        }

        if (!user?.passwordHash) {
          await recordAttempt(false);
          return null;
        }

        if (user.status === UserStatus.LOCKED) {
          await recordAttempt(false);
          return null;
        }

        const isValid = await bcrypt.compare(String(credentials.password), user.passwordHash);

        if (!isValid) {
          await recordAttempt(false);

          const failedLoginAttempts = user.failedLoginAttempts + 1;
          const shouldLock =
            failedLoginAttempts >= FAILED_LOGIN_LOCK_THRESHOLD && user.status === UserStatus.ACTIVE;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts,
              ...(shouldLock ? { status: UserStatus.LOCKED, lockedAt: new Date() } : {}),
            },
          });

          if (shouldLock) {
            // Self-attributed: the lock is system-triggered by this account's
            // own failed attempts, not by another actor.
            await recordAuditEvent({
              actorId: user.id,
              action: ActivityAction.LOCKED,
              entityType: "User",
              entityId: user.id,
              targetLabel: `${user.name} (${user.email})`,
              metadata: { failedLoginAttempts },
            });
          }

          return null;
        }

        // Only ACTIVE and PENDING_PASSWORD_CHANGE accounts may sign in; the
        // latter is allowed through so the user can be routed to the forced
        // change-password flow rather than being locked out entirely.
        if (
          user.status !== UserStatus.ACTIVE &&
          user.status !== UserStatus.PENDING_PASSWORD_CHANGE
        ) {
          await recordAttempt(false);
          return null;
        }

        await recordAttempt(true);

        if (user.failedLoginAttempts > 0) {
          await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0 } });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? user.avatarUrl ?? null,
          role: user.role as string,
          mustChangePassword: user.mustChangePassword,
          loginIpAddress: ipAddress,
          loginUserAgent: userAgent,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Fired by useSession().update() after a password change, so the JWT
      // stops carrying a stale mustChangePassword flag (which proxy.ts would
      // otherwise keep redirecting on) without forcing a fresh sign-in.
      if (trigger === "update" && typeof token.id === "string") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { mustChangePassword: true },
        });
        token.mustChangePassword = dbUser?.mustChangePassword ?? false;
      }

      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "STUDENT";
        token.mustChangePassword =
          (user as { mustChangePassword?: boolean }).mustChangePassword ?? false;

        // One UserLoginSession row per sign-in, keyed by a fresh jti embedded
        // in the JWT itself - this is what makes a specific session listable
        // and revocable ("Terminate Session") despite JWT sessions otherwise
        // having no server-side record. proxy.ts checks this row on every
        // authenticated request.
        const jti = randomUUID();
        token.sessionId = jti;

        const settings = await getSystemSettings();
        const expiresAt = new Date(Date.now() + settings.sessionTimeoutMinutes * 60_000);

        await prisma.userLoginSession.create({
          data: {
            userId: user.id,
            tokenId: jti,
            userAgent: (user as { loginUserAgent?: string | null }).loginUserAgent ?? null,
            ipAddress: (user as { loginIpAddress?: string | null }).loginIpAddress ?? null,
            expiresAt,
          },
        });
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "STUDENT";
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      session.sessionId = token.sessionId as string | undefined;

      return session;
    },
  },
  events: {
    async signOut({ token }) {
      const sessionId = (token as { sessionId?: string } | undefined)?.sessionId;
      if (typeof sessionId === "string") {
        await prisma.userLoginSession.updateMany({
          where: { tokenId: sessionId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    },
  },
};

const authHandler = NextAuth(authConfig);

export const GET = authHandler;
export const POST = authHandler;
export const auth = authHandler;
export const signIn = authHandler;
export const signOut = authHandler;
