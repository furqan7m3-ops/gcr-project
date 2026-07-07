"use client";

import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { UserRole } from "@/generated/prisma/enums";

import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { getVisibleSections } from "./nav-config";
import { Sidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";
import type { ShellUser } from "./user-menu";

interface ShellProps {
  user: ShellUser;
  children: ReactNode;
}

export function Shell({ user, children }: ShellProps) {
  const sections = getVisibleSections(user.role as UserRole);

  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <Header user={user} />
          <div className="flex flex-1">
            <Sidebar sections={sections} />
            <MobileNav sections={sections} />
            <main className="flex-1 overflow-x-hidden">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}

export type { ShellUser };
