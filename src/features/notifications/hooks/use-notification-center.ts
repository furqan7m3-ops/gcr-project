"use client";

import { useCallback, useState } from "react";

import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../actions/notification-mutations";
import { getNotificationsAction } from "../actions/notification-queries";
import type { NotificationSummary, NotificationType } from "../types";

export type NotificationTypeFilter = "ALL" | NotificationType;

interface UseNotificationCenterOptions {
  initialNotifications: NotificationSummary[];
  initialCursor: string | null;
}

const PAGE_SIZE = 20;

/**
 * Owns state for the full-page notification center: server-seeded initial
 * data, filter-driven reloads (type + unread-only), cursor pagination, and
 * optimistic mark-read/mark-all/delete. Kept separate from useNotifications
 * (the header dropdown's hook) since the two widgets have different data
 * flows - this one starts from SSR-provided data and resets its whole list
 * whenever a filter changes, which the lazily-opened dropdown never does.
 */
export function useNotificationCenter({
  initialNotifications,
  initialCursor,
}: UseNotificationCenterOptions) {
  const [notifications, setNotifications] = useState<NotificationSummary[]>(initialNotifications);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (nextType: NotificationTypeFilter, nextUnreadOnly: boolean) => {
    setIsLoading(true);
    setError(null);

    const result = await getNotificationsAction({
      limit: PAGE_SIZE,
      unreadOnly: nextUnreadOnly,
      type: nextType === "ALL" ? undefined : nextType,
    });

    if (result.status === "success") {
      setNotifications(result.data.notifications);
      setNextCursor(result.data.nextCursor);
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  }, []);

  const setFilter = useCallback(
    (nextType: NotificationTypeFilter) => {
      setTypeFilter(nextType);
      reload(nextType, unreadOnly);
    },
    [reload, unreadOnly],
  );

  const setUnreadOnlyFilter = useCallback(
    (nextUnreadOnly: boolean) => {
      setUnreadOnly(nextUnreadOnly);
      reload(typeFilter, nextUnreadOnly);
    },
    [reload, typeFilter],
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    const result = await getNotificationsAction({
      cursor: nextCursor,
      limit: PAGE_SIZE,
      unreadOnly,
      type: typeFilter === "ALL" ? undefined : typeFilter,
    });

    if (result.status === "success") {
      setNotifications((previous) => [...previous, ...result.data.notifications]);
      setNextCursor(result.data.nextCursor);
    } else {
      setError(result.message);
    }

    setIsLoadingMore(false);
  }, [nextCursor, isLoadingMore, unreadOnly, typeFilter]);

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

      const result = await markNotificationReadAction(notificationId);

      if (result.status !== "success") {
        setNotifications((previous) =>
          previous.map((notification) =>
            notification.id === notificationId ? { ...notification, isRead: false } : notification,
          ),
        );
      }
    },
    [notifications],
  );

  const markAllRead = useCallback(async () => {
    const previousNotifications = notifications;

    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, isRead: true })),
    );

    const result = await markAllNotificationsReadAction();

    if (result.status !== "success") {
      setNotifications(previousNotifications);
    }
  }, [notifications]);

  const remove = useCallback(
    async (notificationId: string) => {
      const target = notifications.find((notification) => notification.id === notificationId);
      if (!target) {
        return;
      }

      const previousIndex = notifications.findIndex(
        (notification) => notification.id === notificationId,
      );
      setNotifications((previous) =>
        previous.filter((notification) => notification.id !== notificationId),
      );

      const result = await deleteNotificationAction(notificationId);

      if (result.status !== "success") {
        setNotifications((previous) => {
          const next = [...previous];
          next.splice(previousIndex, 0, target);
          return next;
        });
      }
    },
    [notifications],
  );

  return {
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
    retry: () => reload(typeFilter, unreadOnly),
  };
}
