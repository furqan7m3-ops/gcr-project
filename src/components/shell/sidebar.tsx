"use client";

import { cn } from "@/lib/utils";

import type { NavSection } from "./nav-config";
import { NavList } from "./nav-list";
import { useSidebar } from "./sidebar-context";

export function Sidebar({ sections }: { sections: NavSection[] }) {
  const { isCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 flex-col self-start border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      <div className="scrollbar-on-hover flex h-full flex-col gap-2 overflow-y-auto px-3 py-4">
        <NavList sections={sections} collapsed={isCollapsed} />
      </div>
    </aside>
  );
}
