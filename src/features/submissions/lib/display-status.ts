import type { SubmissionStatus } from "@/generated/prisma/enums";

/**
 * A 5-bucket presentational status shared by the student panel, the teacher's
 * submission list, and the review page - collapses "no row yet" and the raw
 * SubmissionStatus enum into one consistent vocabulary so every surface
 * labels things identically.
 */
export type SubmissionDisplayStatus = "NOT_SUBMITTED" | "DRAFT" | "SUBMITTED" | "LATE" | "RETURNED";

/**
 * `wasLate` disambiguates REVIEWED (grading is in progress but not yet
 * returned) between "Submitted" and "Late" - grading itself is invisible
 * here on purpose, so REVIEWED must read exactly like its pre-grading state
 * to anyone who isn't allowed to know grading has started yet.
 */
export function toDisplayStatus(
  status: SubmissionStatus | null,
  options?: { wasLate?: boolean },
): SubmissionDisplayStatus {
  switch (status) {
    case "ASSIGNED":
      return "DRAFT";
    case "SUBMITTED":
      return "SUBMITTED";
    case "LATE":
      return "LATE";
    case "REVIEWED":
      return options?.wasLate ? "LATE" : "SUBMITTED";
    case "RETURNED":
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
  "default" | "secondary" | "outline" | "destructive" | "success"
> = {
  NOT_SUBMITTED: "outline",
  DRAFT: "outline",
  SUBMITTED: "success",
  LATE: "destructive",
  RETURNED: "secondary",
};
