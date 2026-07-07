import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authConfig } from "@/auth";
import { Shell } from "@/components/shell/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = (await getServerSession(authConfig as never)) as {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  } | null;

  if (!session?.user) {
    redirect("/login");
  }

  const { name, email, image, role } = session.user;

  return <Shell user={{ name, email, image, role: role ?? "STUDENT" }}>{children}</Shell>;
}
