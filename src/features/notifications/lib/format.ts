import {
  Bell,
  ClipboardCheck,
  FileText,
  type LucideIcon,
  Megaphone,
  MessageSquare,
  Undo2,
} from "lucide-react";

import type { NotificationType } from "@/generated/prisma/enums";

export function formatNotificationTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "Just now";
  }
  if (diffMs < hour) {
    return `${Math.floor(diffMs / minute)}m ago`;
  }
  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)}h ago`;
  }
  if (diffMs < 7 * day) {
    return `${Math.floor(diffMs / day)}d ago`;
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const NOTIFICATION_TYPE_ICON: Record<NotificationType, LucideIcon> = {
  NEW_ASSIGNMENT: ClipboardCheck,
  NEW_MATERIAL: FileText,
  NEW_ANNOUNCEMENT: Megaphone,
  SUBMISSION_RETURNED: Undo2,
  PRIVATE_COMMENT: MessageSquare,
  GENERAL: Bell,
};

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  NEW_ASSIGNMENT: "Assignments",
  NEW_MATERIAL: "Materials",
  NEW_ANNOUNCEMENT: "Announcements",
  SUBMISSION_RETURNED: "Returned work",
  PRIVATE_COMMENT: "Comments",
  GENERAL: "General",
};
