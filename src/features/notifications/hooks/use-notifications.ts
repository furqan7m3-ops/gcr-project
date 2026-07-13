"use client";

import { useCallback, useState } from "react";

import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../actions/notification-mutations";
import { getNotificationsAction } from "../actions/notification-queries";
import type { NotificationSummary } from "../types";

interface UseNotificationsOptions {
  initialUnreadCount: number;
}

/**
 * Owns all client-side state for the notification dropdown: the list (fetched
 * lazily on open), the badge count, and optimistic mark-read/mark-all/delete
 * with revert-on-failure. Kept as plain useState rather than useOptimistic
 * since this widget isn't bound to a Server Component's props the way a page
 * list is - it's a self-contained, lazily-opened overlay with its own state.
 */
export function useNotifications({ initialUnreadCount }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getNotificationsAction({});

    if (result.status === "success") {
      setNotifications(result.data.notifications);
      setNextCursor(result.data.nextCursor);
      setHasLoadedOnce(true);
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    const result = await getNotificationsAction({ cursor: nextCursor });

    if (result.status === "success") {
      setNotifications((previous) => [...previous, ...result.data.notifications]);
      setNextCursor(result.data.nextCursor);
    } else {
      setError(result.message);
    }

    setIsLoadingMore(false);
  }, [nextCursor, isLoadingMore]);

  const markRead = useCallback(
    async (notificationId: string) => {
      const target = notifications.find((notification) => notification.id === notificationId);
      if (!target || target.isRead) {
        return;
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification,
        ),
      );
      setUnreadCount((previous) => Math.max(0, previous - 1));

      const result = await markNotificationReadAction(notificationId);

      if (result.status !== "success") {
        setNotifications((previous) =>
          previous.map((notification) =>
            notification.id === notificationId ? { ...notification, isRead: false } : notification,
          ),
        );
        setUnreadCount((previous) => previous + 1);
      }
    },
    [notifications],
  );

  const markAllRead = useCallback(async () => {
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, isRead: true })),
    );
    setUnreadCount(0);

    const result = await markAllNotificationsReadAction();

    if (result.status !== "success") {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  }, [notifications, unreadCount]);

  const remove = useCallback(
    async (notificationId: string) => {
      const target = notifications.find((notification) => notification.id === notificationId);
      if (!target) {
        return;
      }

      setNotifications((previous) =>
        previous.filter((notification) => notification.id !== notificationId),
      );
      if (!target.isRead) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }

      const result = await deleteNotificationAction(notificationId);

      if (result.status !== "success") {
        setNotifications((previous) => [target, ...previous]);
        if (!target.isRead) {
          setUnreadCount((previous) => previous + 1);
        }
      }
    },
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    hasLoadedOnce,
    load,
    loadMore,
    markRead,
    markAllRead,
    remove,
  };
}
