import type { SubmissionStatus } from "@/generated/prisma/enums";

/**
 * A 5-bucket presentational status shared by the student panel, the teacher's
 * submission list, and the review page - collapses "no row yet" and the raw
 * SubmissionStatus enum (whose REVIEWED/MISSING values are unused this phase)
 * into one consistent vocabulary so every surface labels things identically.
 */
export type SubmissionDisplayStatus = "NOT_SUBMITTED" | "DRAFT" | "SUBMITTED" | "LATE" | "RETURNED";

export function toDisplayStatus(status: SubmissionStatus | null): SubmissionDisplayStatus {
  switch (status) {
    case "ASSIGNED":
      return "DRAFT";
    case "SUBMITTED":
      return "SUBMITTED";
    case "LATE":
      return "LATE";
    case "RETURNED":
    case "REVIEWED":
      return "RETURNED";
    case "MISSING":
    case null:
    case undefined:
    default:
      return "NOT_SUBMITTED";
  }
}

export const SUBMISSION_DISPLAY_STATUS_LABEL: Record<SubmissionDisplayStatus, string> = {
  NOT_SUBMITTED: "Not submitted",
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  LATE: "Late",
  RETURNED: "Returned",
};

export const SUBMISSION_DISPLAY_STATUS_BADGE_VARIANT: Record<
  SubmissionDisplayStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  NOT_SUBMITTED: "outline",
  DRAFT: "outline",
  SUBMITTED: "default",
  LATE: "destructive",
  RETURNED: "secondary",
};
