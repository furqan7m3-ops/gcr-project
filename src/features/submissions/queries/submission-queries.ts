import { requireUser } from "@/lib/auth/permissions";

import * as submissionService from "../services/submission-service";
import type { SubmissionView } from "../types";

// Classroom/assignment visibility is already enforced by the classwork route -
// this only requires a signed-in user. Ownership and assignment-state rules are
// enforced inside the service itself.
export async function getStudentSubmission(assignmentId: string): Promise<SubmissionView> {
  const user = await requireUser();
  return submissionService.getSubmissionForStudent(assignmentId, user);
}
