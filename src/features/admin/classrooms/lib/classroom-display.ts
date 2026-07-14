import type { BadgeProps } from "@/components/ui/badge";
import { ClassroomStatus } from "@/generated/prisma/enums";

export const statusLabels: Record<ClassroomStatus, string> = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
  DELETED: "Deleted",
};

export const statusBadgeVariant: Record<ClassroomStatus, NonNullable<BadgeProps["variant"]>> = {
  ACTIVE: "default",
  ARCHIVED: "secondary",
  DELETED: "destructive",
};

export const allClassroomStatuses = [
  ClassroomStatus.ACTIVE,
  ClassroomStatus.ARCHIVED,
  ClassroomStatus.DELETED,
] as const;
