import type { SubmissionStatus } from "@/generated/prisma/enums";
import type { AttachedFileSummary } from "@/lib/file-attachments";

export type { ActionResult } from "@/types/action-result";
export type { SubmissionStatus } from "@/generated/prisma/enums";

export interface SubmissionDetail {
  id: string;
  textAnswer: string | null;
  status: SubmissionStatus;
  submittedAt: Date | null;
  updatedAt: Date;
  attachments: AttachedFileSummary[];
}

export interface SubmissionView {
  /** Null until the student's first Save Draft or Turn In - no row is created before that. */
  submission: SubmissionDetail | null;
  /** Whether the text response and attachments may currently be changed. */
  canEdit: boolean;
  /** Whether Unsubmit is currently allowed (submitted, due date not passed, assignment not closed). */
  canUnsubmit: boolean;
}
