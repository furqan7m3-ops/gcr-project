import { requireUser } from "@/lib/auth/permissions";

import { ClassroomServiceError } from "../lib/errors";
import * as classroomService from "../services/classroom-service";
import type { ClassroomRoster } from "../types";

// The classroom layout already gates every nested route (including this one)
// on active membership via getClassroomByIdAction, so FORBIDDEN here should be
// unreachable in practice - handled defensively anyway, collapsed to null like
// every other "you can't see this" case in the app.
export async function getClassroomRoster(classroomId: string): Promise<ClassroomRoster | null> {
  const user = await requireUser();

  try {
    return await classroomService.getClassroomRoster(classroomId, user);
  } catch (error) {
    if (error instanceof ClassroomServiceError && error.code === "FORBIDDEN") {
      return null;
    }
    throw error;
  }
}
