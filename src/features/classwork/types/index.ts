import type { MaterialType } from "@/generated/prisma/enums";
import type { AttachedFileSummary } from "@/lib/file-attachments";

export type { ActionResult } from "@/types/action-result";
export type { MaterialType } from "@/generated/prisma/enums";
export type MaterialAttachedFile = AttachedFileSummary;

export interface TopicSummary {
  id: string;
  title: string;
  position: number;
  /** Whether the current viewer may create/rename/delete/reorder topics. */
  canManage: boolean;
}

export interface MaterialSummary {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  type: MaterialType;
  topicId: string | null;
  authorName: string;
  createdAt: Date;
  attachments: MaterialAttachedFile[];
  /** Whether the current viewer may edit/delete this material. */
  canManage: boolean;
}
