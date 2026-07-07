import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  return session.user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  if (!allowedRoles.includes(session.user.role as UserRole)) {
    throw new Error("Forbidden");
  }

  return session.user;
}

export async function canAccessAdminArea() {
  return requireRole([UserRole.ADMIN]);
}

export async function canAccessTeacherArea() {
  return requireRole([UserRole.ADMIN, UserRole.TEACHER]);
}
