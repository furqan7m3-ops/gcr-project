import { requireUser } from "@/lib/auth/permissions";

import * as materialService from "../services/material-service";
import type { MaterialSummary } from "../types";

// Classroom membership is already enforced by the classroom detail layout that
// renders this route's children - this only requires a signed-in user.
export async function listMaterialsForClassroom(classroomId: string): Promise<MaterialSummary[]> {
  const user = await requireUser();
  return materialService.listClassroomMaterials(classroomId, user);
}
