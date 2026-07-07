import { getServerSession } from "next-auth/next";

import { authConfig } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role: (session.user.role as UserRole) ?? UserRole.STUDENT,
  };
}
