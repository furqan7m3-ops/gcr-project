import { cache } from "react";
import { getServerSession } from "next-auth/next";

import { authConfig } from "@/auth";
import { isSessionRowValid } from "@/lib/auth/session-validity";
import { UserRole } from "@/generated/prisma/enums";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

// Memoized per-request via React's cache() - layout.tsx and the page it
// wraps (and any component further down the tree) each call this, and
// without cache() every one of those calls re-decodes the session AND
// re-queries UserLoginSession for the revocation/expiry check, turning one
// navigation into several sequential DB round trips for the same answer.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return null;
  }

  if (!(await isSessionRowValid(session.sessionId))) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role: (session.user.role as UserRole) ?? UserRole.STUDENT,
  };
});
