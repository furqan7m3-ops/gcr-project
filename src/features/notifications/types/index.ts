import type { NotificationType } from "@/generated/prisma/enums";

export type { ActionResult } from "@/types/action-result";
export type { NotificationType } from "@/generated/prisma/enums";

export interface NotificationSummary {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationPage {
  notifications: NotificationSummary[];
  /** Pass back as `cursor` to fetch the next page; null once there's nothing more. */
  nextCursor: string | null;
}
