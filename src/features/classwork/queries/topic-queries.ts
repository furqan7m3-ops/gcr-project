import { requireUser } from "@/lib/auth/permissions";

import * as topicService from "../services/topic-service";
import type { TopicSummary } from "../types";

// Classroom membership is already enforced by the classroom detail layout that
// renders this route's children - this only requires a signed-in user.
export async function listTopicsForClassroom(classroomId: string): Promise<TopicSummary[]> {
  const user = await requireUser();
  return topicService.listClassroomTopics(classroomId, user);
}
