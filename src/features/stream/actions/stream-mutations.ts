"use server";

import { revalidatePath } from "next/cache";

import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { AuthError, requireUser } from "@/lib/auth/permissions";

import * as streamService from "../services/stream-service";
import type { ActionResult, AnnouncementSummary } from "../types";
import { createAnnouncementSchema } from "../validation/announcement-schema";

function formDataToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

export async function createAnnouncementAction(
  _prevState: ActionResult<AnnouncementSummary> | null,
  formData: FormData,
): Promise<ActionResult<AnnouncementSummary>> {
  try {
    const user = await requireUser();

    const parsed = createAnnouncementSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const announcement = await streamService.createAnnouncement(
      parsed.data.classroomId,
      user,
      parsed.data.content,
    );
    revalidatePath(`/classes/${parsed.data.classroomId}/stream`);

    return { status: "success", data: announcement };
  } catch (error) {
    if (error instanceof AuthError || error instanceof ClassroomServiceError) {
      return { status: "error", message: error.message };
    }

    console.error(error);
    return { status: "error", message: "Couldn't post the announcement. Please try again." };
  }
}
