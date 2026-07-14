"use client";

import { ShieldCheck } from "lucide-react";

import { useSidebar } from "@/components/shell/sidebar-context";
import { cn } from "@/lib/utils";

import { adminNavItems } from "./admin-nav-config";
import { AdminNavList } from "./admin-nav-list";

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
        {!isCollapsed ? (
          <div className="flex items-center gap-2 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Administration
          </div>
        ) : null}
        <AdminNavList items={adminNavItems} collapsed={isCollapsed} />
      </div>
    </aside>
  );
}
