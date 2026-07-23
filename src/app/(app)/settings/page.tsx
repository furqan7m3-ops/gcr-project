import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRound } from "lucide-react";

import { getCurrentUser } from "@/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { ChangePasswordForm } from "@/features/account/components/change-password-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <PageContainer className="max-w-2xl">
      <SectionHeader title="Settings" description="Your account security." />

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Update the password you use to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm forced={false} />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Looking for your name, email, role, or profile photo?{" "}
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <UserRound className="h-3.5 w-3.5" aria-hidden />
          Go to your profile
        </Link>
      </p>
    </PageContainer>
  );
}
