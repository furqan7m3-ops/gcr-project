import { assignmentScheduleAdapter } from "@/features/classwork/services/assignment-service";
import { materialScheduleAdapter } from "@/features/classwork/services/material-service";
import { announcementScheduleAdapter } from "@/features/stream/services/stream-service";
import type { ScheduleAdapter } from "@/lib/scheduling/types";

import type { SchedulableContentType } from "../types";

/**
 * The single place all three content-type scheduling adapters are wired
 * together. Kept out of src/lib (which must not import from src/features)
 * so the generic engine in src/lib/scheduling stays feature-agnostic while
 * this integration point owns the concrete list.
 */
const REGISTRY: Record<SchedulableContentType, ScheduleAdapter> = {
  announcement: announcementScheduleAdapter,
  assignment: assignmentScheduleAdapter,
  material: materialScheduleAdapter,
};

const REVALIDATE_SEGMENT: Record<SchedulableContentType, string> = {
  announcement: "stream",
  assignment: "classwork",
  material: "classwork",
};

export function getScheduleAdapter(contentType: SchedulableContentType): ScheduleAdapter {
  return REGISTRY[contentType];
}

/** Every adapter, in registration order - what a future cron/worker iterates over. */
export function getAllScheduleAdapters(): ScheduleAdapter[] {
  return Object.values(REGISTRY);
}

export function getRevalidatePath(
  classroomId: string,
  contentType: SchedulableContentType,
): string {
  return `/classes/${classroomId}/${REVALIDATE_SEGMENT[contentType]}`;
}
