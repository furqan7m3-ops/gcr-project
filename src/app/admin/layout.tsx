import { redirect } from "next/navigation";

import { getCurrentUser } from "@/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";
import { UserRole } from "@/generated/prisma/enums";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== UserRole.ADMIN) {
    redirect("/dashboard?denied=admin");
  }

  const settings = await getSystemSettings();

  return (
    <AdminShell
      user={{ name: user.name, email: user.email, image: user.image, role: user.role }}
      platformName={settings.platformName}
    >
      {children}
    </AdminShell>
  );
}
