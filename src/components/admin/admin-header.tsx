"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import { useSidebar } from "@/components/shell/sidebar-context";
import { UserMenu, type ShellUser } from "@/components/shell/user-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AdminHeader({
  user,
  platformName = "Elevate Institute of Tourism & Hospitality Management",
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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border border-t-[3px] border-t-gold bg-card px-3 sm:px-4">
      <Button variant="ghost" size="icon" aria-label="Toggle navigation" onClick={handleMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>
      <Link
        href="/admin"
        className="flex items-center gap-2.5 rounded-md pr-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${platformName} - Admin dashboard`}
      >
        <Image src="/brand/logo.png" alt="" width={32} height={32} className="h-8 w-8" />
        <span className="hidden max-w-60 font-serif text-sm font-semibold leading-tight text-primary line-clamp-2 sm:block dark:text-foreground">
          {platformName}
        </span>
      </Link>
      <Badge variant="gold" className="hidden sm:inline-flex">
        Administrator
      </Badge>
      <div className="flex flex-1 items-center justify-end gap-3">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
