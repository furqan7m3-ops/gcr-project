"use client";

import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SearchDialogProvider } from "@/features/search/context/search-dialog-context";
import { GlobalSearchDialog } from "@/features/search/components/global-search-dialog";
import { UnreadCountProvider } from "@/features/notifications/context/unread-count-context";
import { UserRole } from "@/generated/prisma/enums";

import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { getVisibleSections } from "./nav-config";
import { Sidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";
import type { ShellUser } from "./user-menu";

interface ShellProps {
  user: ShellUser;
  initialUnreadCount: number;
  platformName?: string;
  children: ReactNode;
}

export function Shell({ user, initialUnreadCount, platformName, children }: ShellProps) {
  const sections = getVisibleSections(user.role as UserRole);

  return (
    <UnreadCountProvider initialCount={initialUnreadCount}>
      <TooltipProvider delayDuration={200}>
        <SearchDialogProvider>
          <SidebarProvider>
            <a
              href="#main-content"
              className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Skip to main content
            </a>
            <div className="flex min-h-screen flex-col bg-background">
              <Header
                user={user}
                initialUnreadCount={initialUnreadCount}
                platformName={platformName}
              />
              <div className="flex flex-1">
                <Sidebar sections={sections} />
                <MobileNav sections={sections} platformName={platformName} />
                <main
                  id="main-content"
                  tabIndex={-1}
                  className="flex-1 overflow-x-hidden outline-none"
                >
                  {children}
                </main>
              </div>
            </div>
            <GlobalSearchDialog userKey={user.email ?? "anonymous"} />
          </SidebarProvider>
        </SearchDialogProvider>
      </TooltipProvider>
    </UnreadCountProvider>
  );
}

export type { ShellUser };
