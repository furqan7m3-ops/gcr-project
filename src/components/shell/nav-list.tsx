"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUnreadCount } from "@/features/notifications/context/unread-count-context";
import { cn } from "@/lib/utils";

import type { NavSection } from "./nav-config";

interface NavListProps {
  sections: NavSection[];
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function NavList({ sections, collapsed = false, onNavigate }: NavListProps) {
  const pathname = usePathname();
  const unreadCount = useUnreadCount()?.count ?? 0;

  return (
    <nav aria-label="Primary" className="flex flex-col gap-4">
      {sections.map((section, sectionIndex) => (
        <div key={section.label ?? sectionIndex} className="flex flex-col gap-0.5">
          {section.label && !collapsed ? (
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.label}
            </p>
          ) : null}
          {section.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const showDot = Boolean(item.showUnreadDot) && unreadCount > 0;

            const link = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  collapsed && "justify-center px-2.5",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {showDot ? (
                  <>
                    <span
                      aria-hidden
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full bg-destructive",
                        collapsed ? "absolute right-2 top-1.5" : "ml-auto",
                      )}
                    />
                    <span className="sr-only">(unread)</span>
                  </>
                ) : null}
              </Link>
            );

            if (!collapsed) {
              return link;
            }

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
