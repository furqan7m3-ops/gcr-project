import { getCurrentUser, type SessionUser } from "@/auth/session";
import { UserRole } from "@/generated/prisma/enums";

export class AuthError extends Error {
  constructor(
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthError("UNAUTHENTICATED", "You must be signed in to do that.");
  }

  return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("FORBIDDEN", "You do not have permission to perform this action.");
  }

  return user;
}

export async function canAccessAdminArea() {
  return requireRole([UserRole.ADMIN]);
}

export async function canAccessTeacherArea() {
  return requireRole([UserRole.ADMIN, UserRole.TEACHER]);
}
