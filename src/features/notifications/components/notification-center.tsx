"use client";

import { Bell, Check } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  useNotificationCenter,
  type NotificationTypeFilter,
} from "../hooks/use-notification-center";
import { groupNotificationsByDate } from "../lib/group-by-date";
import { NOTIFICATION_TYPE_LABEL } from "../lib/format";
import type { NotificationSummary, NotificationType } from "../types";
import { NotificationItem } from "./notification-item";

interface NotificationCenterProps {
  initialNotifications: NotificationSummary[];
  initialCursor: string | null;
}

const TYPE_FILTER_OPTIONS: NotificationType[] = [
  "NEW_ASSIGNMENT",
  "NEW_MATERIAL",
  "NEW_ANNOUNCEMENT",
  "SUBMISSION_RETURNED",
  "PRIVATE_COMMENT",
  "GENERAL",
];

function NotificationListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex items-start gap-3 rounded-lg border border-border p-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationCenter({
  initialNotifications,
  initialCursor,
}: NotificationCenterProps) {
  const {
    notifications,
    nextCursor,
    typeFilter,
    unreadOnly,
    isLoading,
    isLoadingMore,
    error,
    setFilter,
    setUnreadOnlyFilter,
    loadMore,
    markRead,
    markAllRead,
    remove,
    retry,
  } = useNotificationCenter({ initialNotifications, initialCursor });

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const groups = groupNotificationsByDate(notifications);
  const hasActiveFilter = typeFilter !== "ALL" || unreadOnly;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={unreadOnly ? "outline" : "default"}
            size="sm"
            onClick={() => setUnreadOnlyFilter(false)}
          >
            All
          </Button>
          <Button
            type="button"
            variant={unreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setUnreadOnlyFilter(true)}
          >
            Unread
          </Button>

          <Select
            aria-label="Filter by notification type"
            value={typeFilter}
            onChange={(event) => setFilter(event.target.value as NotificationTypeFilter)}
            className="h-9 w-auto min-w-[9rem] text-sm"
          >
            <option value="ALL">All types</option>
            {TYPE_FILTER_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {NOTIFICATION_TYPE_LABEL[type]}
              </option>
            ))}
          </Select>
        </div>

        {unreadCount > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => markAllRead()}>
            <Check className="h-4 w-4" aria-hidden /> Mark all as read
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <NotificationListSkeleton />
      ) : error ? (
        <ErrorState title="Couldn't load notifications" description={error} onRetry={retry} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={hasActiveFilter ? "No matching notifications" : "You're all caught up"}
          description={
            hasActiveFilter
              ? "Try a different filter to see more notifications."
              : "New notifications about your classes will show up here."
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.label} aria-labelledby={`notification-group-${group.label}`}>
              <h2
                id={`notification-group-${group.label}`}
                className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {group.label}
              </h2>
              <div className="flex flex-col gap-1.5">
                {group.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "rounded-lg border border-border bg-card",
                      !notification.isRead && "border-primary/30",
                    )}
                  >
                    <NotificationItem
                      notification={notification}
                      onMarkRead={markRead}
                      onRemove={remove}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}

          {nextCursor ? (
            <Button
              type="button"
              variant="outline"
              className="self-center"
              onClick={loadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Loading…" : "Load more"}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
