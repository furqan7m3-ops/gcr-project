import { AppShell } from "@/components/layouts/app-shell";

export default function Home() {
  return (
    <AppShell>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-16">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Foundation setup complete
          </p>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
            A clean, scalable base for GCR is now in place.
          </h2>
          <p className="text-lg text-slate-600">
            The repository now contains a modern Next.js app shell, Dockerized PostgreSQL, Prisma
            initialization, shared architecture directories, and developer tooling ready for future
            feature development.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
