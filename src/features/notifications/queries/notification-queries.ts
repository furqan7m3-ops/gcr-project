import { requireUser } from "@/lib/auth/permissions";

import * as notificationService from "../services/notification-service";
import type { ListNotificationsInput } from "../validation/notification-schema";
import type { NotificationPage } from "../types";

// Plain, server-only reads (the "repository" layer) - called directly from
// Server Components (e.g. the app shell layout, for the initial badge count).
// Client components can't import these directly (they pull in Prisma), so the
// actions layer re-exports thin "use server" wrappers around the same functions.
export async function getNotifications(options: ListNotificationsInput): Promise<NotificationPage> {
  const user = await requireUser();
  return notificationService.listNotifications(user.id, options);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await requireUser();
  return notificationService.getUnreadCount(user.id);
}
