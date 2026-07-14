import { Activity } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import { formatNotificationTime } from "@/features/notifications/lib/format";

import type { RecentActivityItem } from "../types";

function describe(item: RecentActivityItem): string {
  const target = item.classroomTitle ? ` in ${item.classroomTitle}` : "";
  return `${item.actorName} ${item.actionLabel} a${
    /^[aeiou]/i.test(item.entityType) ? "n" : ""
  } ${item.entityType.toLowerCase()}${target}`;
}

export function RecentActivityList({ items }: { items: RecentActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>The latest actions recorded across the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState icon={Activity} title="No activity yet" />
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-accent/50"
              >
                <span className="text-sm text-foreground">{describe(item)}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatNotificationTime(item.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
