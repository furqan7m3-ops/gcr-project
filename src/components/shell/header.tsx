"use client";

import Link from "next/link";
import { GraduationCap, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NotificationsMenu } from "@/features/notifications/components/notifications-menu";

import { SearchBar } from "./search-bar";
import { useSidebar } from "./sidebar-context";
import { UserMenu, type ShellUser } from "./user-menu";

export function Header({
  user,
  initialUnreadCount,
  platformName = "GCR",
}: {
  user: ShellUser;
  initialUnreadCount: number;
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
      <Link href="/dashboard" className="flex items-center gap-2 pr-2">
        <GraduationCap className="h-6 w-6 text-primary" aria-hidden />
        <span className="hidden text-lg font-medium text-foreground sm:inline">{platformName}</span>
      </Link>
      <div className="flex flex-1 items-center justify-end gap-1 md:justify-start">
        <SearchBar className="hidden md:flex" />
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Search" className="md:hidden">
          <Search className="h-5 w-5" />
        </Button>
        <NotificationsMenu initialUnreadCount={initialUnreadCount} />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
