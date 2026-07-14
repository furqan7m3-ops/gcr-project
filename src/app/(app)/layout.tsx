import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authConfig } from "@/auth";
import { ForbiddenToast } from "@/components/admin/forbidden-toast";
import { Shell } from "@/components/shell/shell";
import { getUnreadNotificationCount } from "@/features/notifications/queries/notification-queries";
import { getSystemSettings } from "@/lib/system-settings";

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
  const [initialUnreadCount, settings] = await Promise.all([
    getUnreadNotificationCount(),
    getSystemSettings(),
  ]);

  return (
    <Shell
      user={{ name, email, image, role: role ?? "STUDENT" }}
      initialUnreadCount={initialUnreadCount}
      platformName={settings.platformName}
    >
      <Suspense fallback={null}>
        <ForbiddenToast />
      </Suspense>
      {children}
    </Shell>
  );
}
