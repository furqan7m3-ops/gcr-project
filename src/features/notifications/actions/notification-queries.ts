"use server";

import * as notificationQueries from "../queries/notification-queries";
import type { ActionResult, NotificationPage, NotificationType } from "../types";
import { listNotificationsSchema } from "../validation/notification-schema";
import { toErrorResult } from "./shared";

// Thin "use server" wrappers around the plain query layer - these exist purely
// so client components (the header dropdown and the notification center page)
// can call them directly; all the actual logic lives once, in
// queries/notification-queries.ts.

export async function getNotificationsAction(
  input: {
    cursor?: string;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {},
): Promise<ActionResult<NotificationPage>> {
  try {
    const parsed = listNotificationsSchema.safeParse(input);
    if (!parsed.success) {
      return { status: "error", message: "Invalid request." };
    }

    const page = await notificationQueries.getNotifications(parsed.data);
    return { status: "success", data: page };
  } catch (error) {
    return toErrorResult(error, "Couldn't load notifications. Please try again.");
  }
}

export async function getUnreadNotificationCountAction(): Promise<ActionResult<number>> {
  try {
    const count = await notificationQueries.getUnreadNotificationCount();
    return { status: "success", data: count };
  } catch (error) {
    return toErrorResult(error, "Couldn't load your notification count.");
  }
}
