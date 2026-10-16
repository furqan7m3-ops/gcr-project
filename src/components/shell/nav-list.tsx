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

  // Only the most specific matching link is active - otherwise a parent route
  // like /admin would light up alongside /admin/users.
  const matchesPath = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const activeHref = sections
    .flatMap((section) => section.items.map((item) => item.href))
    .filter(matchesPath)
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav aria-label="Primary" className="flex flex-col gap-4">
      {sections.map((section, sectionIndex) => (
        <div key={section.label ?? sectionIndex} className="flex flex-col gap-0.5">
          {section.label && !collapsed ? (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
              {section.label}
            </p>
          ) : null}
          {section.items.map((item) => {
            const isActive = item.href === activeHref;
            const Icon = item.icon;
            const showDot = Boolean(item.showUnreadDot) && unreadCount > 0;

            const link = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  collapsed && "justify-center px-2.5",
                  // Active route: gold bar + gold icon on a lifted navy row. The
                  // bar and aria-current carry the state, not color alone.
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-r-full before:bg-sidebar-primary [&>svg]:text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {showDot ? (
                  <>
                    <span
                      aria-hidden
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full bg-gold ring-2 ring-sidebar",
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
