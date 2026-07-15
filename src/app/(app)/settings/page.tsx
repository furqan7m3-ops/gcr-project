import { redirect } from "next/navigation";

import { getCurrentUser } from "@/auth/session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { ChangePasswordForm } from "@/features/account/components/change-password-form";
import { getInitials } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <PageContainer className="max-w-2xl">
      <SectionHeader title="Settings" description="Your account details and security." />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How your account appears across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {user.image ? <AvatarImage src={user.image} alt={user.name ?? "You"} /> : null}
            <AvatarFallback className="text-base">{getInitials(user.name ?? "You")}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="outline" className="mt-1 w-fit">
              {ROLE_LABEL[user.role] ?? user.role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Update the password you use to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm forced={false} />
        </CardContent>
      </Card>

      <Separator className="my-2" />
      <p className="text-xs text-muted-foreground">
        Editing your name, email, or profile photo isn&apos;t available yet - contact an
        administrator if these need to change.
      </p>
    </PageContainer>
  );
}
