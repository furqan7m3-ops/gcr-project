"use server";

import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import * as submissionService from "@/features/submissions/services/submission-service";
import { requireUser } from "@/lib/auth/permissions";

import type { SubmissionReviewDetail } from "../types";

/**
 * Client-invokable read used by the review queue's quick-review dialog -
 * reuses the exact same submissionService.getSubmissionDetails the full
 * submission detail page already calls, so Grade/Return/Comment inside the
 * dialog (via the reused SubmissionReviewPanel) is backed by the identical
 * service logic, not a duplicate.
 */
export async function getReviewSubmissionDetailAction(
  classroomId: string,
  assignmentId: string,
  studentId: string,
): Promise<SubmissionReviewDetail | null> {
  const user = await requireUser();

  try {
    return await submissionService.getSubmissionDetails(classroomId, assignmentId, studentId, user);
  } catch (error) {
    if (
      error instanceof ClassroomServiceError &&
      (error.code === "NOT_FOUND" || error.code === "FORBIDDEN")
    ) {
      return null;
    }
    throw error;
  }
}
