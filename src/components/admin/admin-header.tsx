"use client";

import Link from "next/link";
import { LogOut, Menu, ShieldCheck } from "lucide-react";

import { useSidebar } from "@/components/shell/sidebar-context";
import { UserMenu, type ShellUser } from "@/components/shell/user-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AdminHeader({
  user,
  platformName = "GCR",
}: {
  user: ShellUser;
  platformName?: string;
}) {
  const { toggleCollapsed, setMobileOpen } = useSidebar();

  function handleMenuClick() {
    const isDesktop =
      typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

    if (isDesktop) {
      toggleCollapsed();
    } else {
      setMobileOpen(true);
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-3 sm:px-4">
      <Button variant="ghost" size="icon" aria-label="Toggle navigation" onClick={handleMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>
      <Link href="/admin" className="flex items-center gap-2 pr-2">
        <ShieldCheck className="h-6 w-6 text-primary" aria-hidden />
        <span className="hidden text-lg font-medium text-foreground sm:inline">
          {platformName} Admin
        </span>
      </Link>
      <Badge variant="secondary" className="hidden sm:inline-flex">
        Administrator
      </Badge>
      <div className="flex flex-1 items-center justify-end gap-3">
        <Link
          href="/dashboard"
          className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Exit to app
        </Link>
        <Button variant="ghost" size="icon" aria-label="Exit to app" className="sm:hidden" asChild>
          <Link href="/dashboard">
            <LogOut className="h-5 w-5" />
          </Link>
        </Button>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
