import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { requireUser } from "@/lib/auth/permissions";

import * as submissionService from "../services/submission-service";
import type {
  PrivateCommentSummary,
  SubmissionOverview,
  SubmissionReviewDetail,
  SubmissionView,
} from "../types";

// Classroom/assignment visibility is already enforced by the classwork route -
// this only requires a signed-in user. Ownership and assignment-state rules are
// enforced inside the service itself.
export async function getStudentSubmission(assignmentId: string): Promise<SubmissionView> {
  const user = await requireUser();
  return submissionService.getSubmissionForStudent(assignmentId, user);
}

export async function getOwnSubmissionComments(
  assignmentId: string,
): Promise<PrivateCommentSummary[]> {
  const user = await requireUser();
  return submissionService.getOwnSubmissionComments(assignmentId, user);
}

// These two are teacher-only surfaces - NOT_FOUND and FORBIDDEN are both
// collapsed to null so a teacher from another classroom (or a student who
// guesses the URL) sees the same "not found" page either way, without
// distinguishing "doesn't exist" from "exists but you can't see it."
export async function getAssignmentSubmissions(
  classroomId: string,
  assignmentId: string,
): Promise<SubmissionOverview | null> {
  const user = await requireUser();

  try {
    return await submissionService.getAssignmentSubmissions(classroomId, assignmentId, user);
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

export async function getSubmissionDetails(
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
