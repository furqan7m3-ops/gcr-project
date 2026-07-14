import { redirect } from "next/navigation";

import { getCurrentUser } from "@/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/page/page-container";
import { ChangePasswordForm } from "@/features/account/components/change-password-form";
import { prisma } from "@/lib/prisma";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { mustChangePassword: true },
  });

  return (
    <PageContainer className="max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Change password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm forced={Boolean(dbUser?.mustChangePassword)} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
