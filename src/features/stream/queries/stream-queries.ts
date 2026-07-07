import { requireUser } from "@/lib/auth/permissions";

import * as streamService from "../services/stream-service";
import type { AnnouncementSummary } from "../types";

// Classroom membership is already enforced by the classroom detail layout that
// renders this route's children - this only requires a signed-in user.
export async function listAnnouncementsForClassroom(
  classroomId: string,
): Promise<AnnouncementSummary[]> {
  const user = await requireUser();
  return streamService.listClassroomAnnouncements(classroomId, user);
}
