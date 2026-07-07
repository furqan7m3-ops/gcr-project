import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth";

export default async function LoginPage() {
  const session = (await getServerSession(authConfig as never)) as {
    user?: { id?: string };
  } | null;

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-16">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Authentication is now wired through Auth.js with a Prisma-backed session store.
        </p>
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Login UI will be implemented next. The auth foundation is already in place.
        </div>
      </div>
    </main>
  );
}
