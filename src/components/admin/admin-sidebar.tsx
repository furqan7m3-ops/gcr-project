"use client";

import { NavList } from "@/components/shell/nav-list";
import { getVisibleSections } from "@/components/shell/nav-config";
import { useSidebar } from "@/components/shell/sidebar-context";
import { cn } from "@/lib/utils";
import { UserRole } from "@/generated/prisma/enums";

// Every /admin/* route is already gated to ADMIN-only by admin/layout.tsx,
// so this can call getVisibleSections with a fixed role rather than needing
// the current user passed in - same nav config and same NavList component
// the shared Shell uses elsewhere, so the sidebar's contents (and available
// destinations) never change depending on which shell happens to be
// mounted, only the surrounding header/chrome does.
const sections = getVisibleSections(UserRole.ADMIN);

export function AdminSidebar() {
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
