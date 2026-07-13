"use server";

import { requireUser } from "@/lib/auth/permissions";

import * as notificationService from "../services/notification-service";
import type { ActionResult } from "../types";
import { notificationIdSchema } from "../validation/notification-schema";
import { toErrorResult } from "./shared";

export async function markNotificationReadAction(
  notificationId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = notificationIdSchema.safeParse({ notificationId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid notification." };
    }

    await notificationService.markNotificationRead(parsed.data.notificationId, user.id);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't mark this notification as read. Please try again.");
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult<{ updated: number }>> {
  try {
    const user = await requireUser();

    const updated = await notificationService.markAllNotificationsRead(user.id);

    return { status: "success", data: { updated } };
  } catch (error) {
    return toErrorResult(error, "Couldn't mark all notifications as read. Please try again.");
  }
}

export async function deleteNotificationAction(
  notificationId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = notificationIdSchema.safeParse({ notificationId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid notification." };
    }

    await notificationService.deleteNotification(parsed.data.notificationId, user.id);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't delete this notification. Please try again.");
  }
}
