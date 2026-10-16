import type { BadgeProps } from "@/components/ui/badge";
import { ModerationStatus } from "@/generated/prisma/enums";

import type { ModeratedContentType } from "../types";

export const statusLabels: Record<ModerationStatus, string> = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
  DELETED: "Deleted",
};

export const statusBadgeVariant: Record<ModerationStatus, NonNullable<BadgeProps["variant"]>> = {
  ACTIVE: "success",
  ARCHIVED: "secondary",
  DELETED: "destructive",
};

export const allModerationStatuses = [
  ModerationStatus.ACTIVE,
  ModerationStatus.ARCHIVED,
  ModerationStatus.DELETED,
] as const;

export const contentTypeLabels: Record<ModeratedContentType, string> = {
  announcement: "Announcement",
  comment: "Comment",
  material: "Material",
  assignment: "Assignment",
};

export const contentTypeOptions: { value: ModeratedContentType; label: string }[] = [
  { value: "announcement", label: "Announcements" },
  { value: "comment", label: "Comments" },
  { value: "material", label: "Materials" },
  { value: "assignment", label: "Assignments" },
];
