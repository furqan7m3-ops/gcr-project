import { requireUser } from "@/lib/auth/permissions";

import * as assignmentService from "../services/assignment-service";
import type { AssignmentSummary } from "../types";

// Classroom membership is already enforced by the classroom detail layout that
// renders this route's children - this only requires a signed-in user. Draft
// visibility (teacher-only) is enforced inside the service itself.
export async function listAssignmentsForClassroom(
  classroomId: string,
): Promise<AssignmentSummary[]> {
  const user = await requireUser();
  return assignmentService.listClassroomAssignments(classroomId, user);
}
