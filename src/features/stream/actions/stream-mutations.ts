"use server";

import { revalidatePath } from "next/cache";

import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { AuthError, requireUser } from "@/lib/auth/permissions";

import * as streamService from "../services/stream-service";
import type { ActionResult, AnnouncementSummary } from "../types";
import {
  announcementIdSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "../validation/announcement-schema";

function formDataToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

function toErrorResult<T>(error: unknown, fallbackMessage: string): ActionResult<T> {
  if (error instanceof AuthError || error instanceof ClassroomServiceError) {
    return { status: "error", message: error.message };
  }

  console.error(error);
  return { status: "error", message: fallbackMessage };
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
    return toErrorResult(error, "Couldn't post the announcement. Please try again.");
  }
}

export async function updateAnnouncementAction(
  _prevState: ActionResult<AnnouncementSummary> | null,
  formData: FormData,
): Promise<ActionResult<AnnouncementSummary>> {
  try {
    const user = await requireUser();

    const parsed = updateAnnouncementSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const announcement = await streamService.updateAnnouncement(
      parsed.data.announcementId,
      user,
      parsed.data.content,
    );
    revalidatePath(`/classes/${parsed.data.classroomId}/stream`);

    return { status: "success", data: announcement };
  } catch (error) {
    return toErrorResult(error, "Couldn't update the announcement. Please try again.");
  }
}

export async function deleteAnnouncementAction(
  classroomId: string,
  announcementId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = announcementIdSchema.safeParse({ announcementId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid announcement." };
    }

    await streamService.deleteAnnouncement(parsed.data.announcementId, user);
    revalidatePath(`/classes/${classroomId}/stream`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't delete the announcement. Please try again.");
  }
}

export async function setAnnouncementPinnedAction(
  classroomId: string,
  announcementId: string,
  pinned: boolean,
): Promise<ActionResult<AnnouncementSummary>> {
  try {
    const user = await requireUser();

    const parsed = announcementIdSchema.safeParse({ announcementId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid announcement." };
    }

    const announcement = await streamService.setAnnouncementPinned(
      parsed.data.announcementId,
      user,
      pinned,
    );
    revalidatePath(`/classes/${classroomId}/stream`);

    return { status: "success", data: announcement };
  } catch (error) {
    return toErrorResult(
      error,
      pinned
        ? "Couldn't pin the announcement. Please try again."
        : "Couldn't unpin the announcement. Please try again.",
    );
  }
}
