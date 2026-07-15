import { prisma } from "@/lib/prisma";

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
 */
export async function isSessionRowValid(sessionId: string | null | undefined): Promise<boolean> {
  if (typeof sessionId !== "string") {
    return true;
  }

  const session = await prisma.userLoginSession.findUnique({
    where: { tokenId: sessionId },
    select: { revokedAt: true, expiresAt: true },
  });

  return session !== null && !session.revokedAt && session.expiresAt >= new Date();
}
