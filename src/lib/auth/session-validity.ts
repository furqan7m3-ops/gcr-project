import { prisma } from "@/lib/prisma";
import { UserStatus } from "@/generated/prisma/enums";

// Mirrors the exact set of statuses the credentials login flow itself allows
// through (src/auth/index.ts) - a JWT issued while ACTIVE must stop working
// the moment an admin sets the account to INACTIVE/ARCHIVED/SUSPENDED/LOCKED,
// not just block a fresh login. PENDING_PASSWORD_CHANGE stays allowed so the
// forced change-password redirect (proxy.ts) still has a live session to act on.
const SESSION_ALLOWED_STATUSES: UserStatus[] = [
  UserStatus.ACTIVE,
  UserStatus.PENDING_PASSWORD_CHANGE,
];

/**
 * A JWT stays cryptographically valid for its full lifetime regardless of
 * what happens server-side, but this app also keeps one UserLoginSession row
 * per sign-in (Phase 13.9 "Terminate Session") with its own, usually shorter,
 * expiry - and that row can be revoked at any time. Every place that decides
 * "is this request authenticated" (proxy.ts via getToken, and any server-side
 * getServerSession caller) must agree on this check, or a JWT that outlives
 * its session row causes an infinite redirect loop between /login and any
 * protected route (page-level check sees a valid JWT and redirects one way,
 * middleware sees the expired row and redirects back).
 *
 * Also re-checks the user's current account status on every call, not just
 * at login - otherwise a student marked INACTIVE/ARCHIVED mid-session keeps
 * reading classroom content until their JWT naturally expires.
 */
export async function isSessionRowValid(sessionId: string | null | undefined): Promise<boolean> {
  if (typeof sessionId !== "string") {
    return true;
  }

  const session = await prisma.userLoginSession.findUnique({
    where: { tokenId: sessionId },
    select: { revokedAt: true, expiresAt: true, user: { select: { status: true } } },
  });

  if (session === null || session.revokedAt || session.expiresAt < new Date()) {
    return false;
  }

  return SESSION_ALLOWED_STATUSES.includes(session.user.status);
}
