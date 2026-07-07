import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">GCR</p>
            <h1 className="text-lg font-semibold">Classroom Management Platform</h1>
          </div>
          <Button variant="outline">Workspace</Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
