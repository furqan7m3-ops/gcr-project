import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authConfig } from "@/auth";

export default async function DashboardPage() {
  const session = (await getServerSession(authConfig as never)) as {
    user?: { id?: string };
  } | null;

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          Protected area
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Dashboard</h1>
        <p className="mt-3 text-slate-600">
          This page is now protected by the Auth.js session flow and the current Prisma user model.
        </p>
      </div>
    </main>
  );
}
