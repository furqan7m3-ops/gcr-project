"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatNotificationTime, NOTIFICATION_TYPE_ICON } from "../lib/format";
import type { NotificationSummary } from "../types";

interface NotificationItemProps {
  notification: NotificationSummary;
  onMarkRead: (notificationId: string) => void;
  onRemove: (notificationId: string) => void;
}

export function NotificationItem({ notification, onMarkRead, onRemove }: NotificationItemProps) {
  const Icon = NOTIFICATION_TYPE_ICON[notification.type];

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent",
        !notification.isRead && "bg-primary/5",
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
        onClick={() => onMarkRead(notification.id)}
      >
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Icon className="h-4 w-4 text-secondary-foreground" aria-hidden />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            {!notification.isRead ? (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />
            ) : null}
            <p className="truncate text-sm font-medium text-foreground">{notification.title}</p>
          </div>
          <p className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
          <p className="text-xs text-muted-foreground">
            {formatNotificationTime(notification.createdAt)}
          </p>
        </div>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        aria-label={`Delete notification: ${notification.title}`}
        onClick={() => onRemove(notification.id)}
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </div>
  );
}
