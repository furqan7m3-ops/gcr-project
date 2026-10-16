"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSearchDialog } from "@/features/search/context/search-dialog-context";
import { NotificationsMenu } from "@/features/notifications/components/notifications-menu";

import { SearchBar } from "./search-bar";
import { useSidebar } from "./sidebar-context";
import { UserMenu, type ShellUser } from "./user-menu";

export function Header({
  user,
  initialUnreadCount,
  platformName = "Elevate Institute of Tourism & Hospitality Management",
}: {
  user: ShellUser;
  initialUnreadCount: number;
  platformName?: string;
}) {
  const { toggleCollapsed, setMobileOpen } = useSidebar();
  const { setOpen: setSearchOpen } = useSearchDialog();

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
        href="/dashboard"
        className="flex items-center gap-2.5 rounded-md pr-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${platformName} - Dashboard`}
      >
        <Image src="/brand/logo.png" alt="" width={32} height={32} className="h-8 w-8" />
        {/* The institute name is long - let it wrap to two tight lines instead
            of crowding out the search bar. */}
        <span className="hidden max-w-60 font-serif text-sm font-semibold leading-tight text-primary line-clamp-2 sm:block dark:text-foreground">
          {platformName}
        </span>
      </Link>
      <div className="flex flex-1 items-center justify-end gap-1 md:justify-start">
        <SearchBar className="hidden md:flex" />
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Search"
          className="md:hidden"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-5 w-5" />
        </Button>
        <NotificationsMenu initialUnreadCount={initialUnreadCount} />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
