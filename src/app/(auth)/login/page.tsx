import Image from "next/image";
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
    <div className="flex min-h-screen w-full flex-1 bg-navy-deep">
      <main className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
        {/* The logo artwork has a solid white background, so it sits on a white
          tile to stay clean on the navy backdrop. */}
        <div className="rounded-xl bg-white p-3 shadow-lg">
          <Image
            src="/brand/eithm-pk.png"
            alt="Elevate Institute of Tourism & Hospitality Management"
            width={1620}
            height={580}
            priority
            className="h-auto w-full"
          />
        </div>
        <p className="mb-6 mt-3 text-center text-xs uppercase tracking-[0.2em] text-sidebar-muted">
          Developing Talent · Shaping Future
        </p>
        <Card className="border-t-4 border-t-gold shadow-lg">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-primary dark:text-foreground">
              Sign in
            </CardTitle>
            <CardDescription>Sign in to your EITHM account to continue.</CardDescription>
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
    </div>
  );
}
