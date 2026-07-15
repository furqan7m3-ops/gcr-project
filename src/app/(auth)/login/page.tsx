import { redirect } from "next/navigation";

import { getCurrentUser } from "@/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Sign in to your GCR account to continue.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <LoginForm />
          {process.env.NODE_ENV !== "production" ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Dev seed accounts</p>
              <p>Admin: faizan.admin@gcr.dev / F@izan4121</p>
              <p>Teacher: daniel.teacher@gcr.dev</p>
              <p>Student: sofia.student@gcr.dev</p>
              <p>Password (teacher/student): Testpass123!</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
