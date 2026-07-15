import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";

export interface UpcomingListItem {
  id: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  href: string;
  icon: LucideIcon;
}

interface UpcomingItemsListProps {
  items: UpcomingListItem[];
  emptyTitle: string;
  emptyDescription?: string;
}

/**
 * Generic "soonest N items" list - shared presentational shell for both the
 * Teacher dashboard's Upcoming Publications and the Student dashboard's
 * Upcoming Deadlines. Callers map their own domain data (scheduled content,
 * assignments) into this shape rather than this component knowing about
 * either domain.
 */
export function UpcomingItemsList({ items, emptyTitle, emptyDescription }: UpcomingItemsListProps) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Card>
      <ul className="flex flex-col divide-y divide-border">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-foreground">{item.title}</span>
                  <span className="truncate text-xs text-muted-foreground">{item.subtitle}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{item.dateLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
