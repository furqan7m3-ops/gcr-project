"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { AdminNavItem } from "./admin-nav-config";

interface AdminNavListProps {
  items: AdminNavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function AdminNavList({ items, collapsed = false, onNavigate }: AdminNavListProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = item.icon;

        if (item.disabled) {
          const content = (
            <div
              aria-disabled
              className={cn(
                "flex cursor-not-allowed items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-sidebar-foreground/40",
                collapsed && "justify-center px-2.5",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="flex flex-1 items-center justify-between gap-2 truncate">
                  {item.label}
                  <span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Soon
                  </span>
                </span>
              )}
            </div>
          );

          if (!collapsed) {
            return <div key={item.href}>{content}</div>;
          }

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{content}</TooltipTrigger>
              <TooltipContent side="right">{item.label} (coming soon)</TooltipContent>
            </Tooltip>
          );
        }

        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        const link = (
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              collapsed && "justify-center px-2.5",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );

        if (!collapsed) {
          return <div key={item.href}>{link}</div>;
        }

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
