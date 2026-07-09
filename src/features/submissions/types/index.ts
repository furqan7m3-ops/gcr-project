import type { SubmissionStatus } from "@/generated/prisma/enums";
import type { AttachedFileSummary } from "@/lib/file-attachments";

import type { SubmissionDisplayStatus } from "../lib/display-status";

export type { ActionResult } from "@/types/action-result";
export type { SubmissionStatus } from "@/generated/prisma/enums";
export type { SubmissionDisplayStatus } from "../lib/display-status";

export interface SubmissionDetail {
  id: string;
  textAnswer: string | null;
  status: SubmissionStatus;
  submittedAt: Date | null;
  updatedAt: Date;
  returnedAt: Date | null;
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

export interface PrivateCommentSummary {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    image: string | null;
    isTeacher: boolean;
  };
  canDelete: boolean;
}

export interface StudentSubmissionRow {
  studentId: string;
  studentName: string;
  studentImage: string | null;
  /** Never "DRAFT" here - a student's in-progress draft is invisible to teachers. */
  displayStatus: SubmissionDisplayStatus;
  submittedAt: Date | null;
  updatedAt: Date | null;
  hasSubmission: boolean;
}

export interface SubmissionOverview {
  totalStudents: number;
  submitted: number;
  notSubmitted: number;
  late: number;
  returned: number;
  rows: StudentSubmissionRow[];
}

export interface SubmissionReviewDetail {
  student: { id: string; name: string; image: string | null };
  submission: SubmissionDetail | null;
  canReturn: boolean;
  comments: PrivateCommentSummary[];
}
