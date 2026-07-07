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
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex h-full flex-col gap-2 overflow-y-auto px-3 py-4">
        <NavList sections={sections} collapsed={isCollapsed} />
      </div>
    </aside>
  );
}
