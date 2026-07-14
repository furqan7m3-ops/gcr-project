"use server";

import { revalidatePath } from "next/cache";

import { AuthError, canAccessAdminArea } from "@/lib/auth/permissions";
import type { ActionResult } from "@/types/action-result";

import { AdminModerationServiceError } from "../lib/errors";
import * as moderationService from "../services/moderation-service";
import type { ModeratedContentType } from "../types";

function toErrorResult(error: unknown, fallbackMessage: string): ActionResult<undefined> {
  if (error instanceof AuthError || error instanceof AdminModerationServiceError) {
    return { status: "error", message: error.message };
  }
  console.error(error);
  return { status: "error", message: fallbackMessage };
}

export async function archiveContentAction(
  contentType: ModeratedContentType,
  id: string,
): Promise<ActionResult<undefined>> {
  try {
    const actor = await canAccessAdminArea();
    await moderationService.archiveContent(contentType, id, actor);
    revalidatePath("/admin/moderation");

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't archive this content. Please try again.");
  }
}

export async function deleteContentAction(
  contentType: ModeratedContentType,
  id: string,
): Promise<ActionResult<undefined>> {
  try {
    const actor = await canAccessAdminArea();
    await moderationService.deleteContent(contentType, id, actor);
    revalidatePath("/admin/moderation");

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't delete this content. Please try again.");
  }
}

export async function restoreContentAction(
  contentType: ModeratedContentType,
  id: string,
): Promise<ActionResult<undefined>> {
  try {
    const actor = await canAccessAdminArea();
    await moderationService.restoreContent(contentType, id, actor);
    revalidatePath("/admin/moderation");

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't restore this content. Please try again.");
  }
}
