"use client";

import type { ReactNode } from "react";

import { SidebarProvider } from "@/components/shell/sidebar-context";
import type { ShellUser } from "@/components/shell/user-menu";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AdminHeader } from "./admin-header";
import { AdminMobileNav } from "./admin-mobile-nav";
import { AdminSidebar } from "./admin-sidebar";

interface AdminShellProps {
  user: ShellUser;
  children: ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider>
        <a
          href="#admin-main-content"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col bg-background">
          <AdminHeader user={user} />
          <div className="flex flex-1">
            <AdminSidebar />
            <AdminMobileNav />
            <main
              id="admin-main-content"
              tabIndex={-1}
              className="flex-1 overflow-x-hidden outline-none"
            >
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
