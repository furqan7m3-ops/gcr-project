import type { ModerationStatus } from "@/generated/prisma/enums";

export type { ModerationStatus } from "@/generated/prisma/enums";

export type ModeratedContentType = "announcement" | "comment" | "material" | "assignment";

export interface ModerationItem {
  id: string;
  contentType: ModeratedContentType;
  title: string;
  authorName: string;
  authorEmail: string;
  classroomTitle: string;
  moderationStatus: ModerationStatus;
  createdAt: Date;
}

export interface ListModerationParams {
  contentType: ModeratedContentType;
  search?: string;
  status?: ModerationStatus;
  page?: number;
  pageSize?: number;
}

export interface ModerationPage {
  items: ModerationItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
