import { requireUser } from "@/lib/auth/permissions";

import { ClassroomServiceError } from "../lib/errors";
import * as invitationService from "../services/invitation-service";
import type { PendingInvitation } from "../types";

// Teacher-only surface - the page only calls this when the viewer already
// canManage the classroom, so FORBIDDEN here is defensive-only, collapsed to
// null like every other "you can't see this" case in the app.
export async function getPendingInvitations(
  classroomId: string,
): Promise<PendingInvitation[] | null> {
  const user = await requireUser();

  try {
    return await invitationService.listPendingInvitations(classroomId, user);
  } catch (error) {
    if (error instanceof ClassroomServiceError && error.code === "FORBIDDEN") {
      return null;
    }
    throw error;
  }
}
