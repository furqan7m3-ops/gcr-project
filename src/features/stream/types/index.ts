export type { ActionResult } from "@/types/action-result";

export interface AnnouncementAttachmentSummary {
  id: string;
  fileName: string;
}

export interface CommentSummary {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
  /** Whether the current viewer may delete this specific comment. */
  canDelete: boolean;
}

export interface AnnouncementSummary {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  isEdited: boolean;
  author: {
    name: string;
    image: string | null;
  };
  comments: CommentSummary[];
  attachments: AnnouncementAttachmentSummary[];
}
