"use server";

import { revalidatePath } from "next/cache";

import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { AuthError, requireUser } from "@/lib/auth/permissions";

import * as streamService from "../services/stream-service";
import type { ActionResult, CommentSummary } from "../types";
import { createCommentSchema, deleteCommentSchema } from "../validation/comment-schema";

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

export async function createCommentAction(
  _prevState: ActionResult<CommentSummary> | null,
  formData: FormData,
): Promise<ActionResult<CommentSummary>> {
  try {
    const user = await requireUser();

    const parsed = createCommentSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const comment = await streamService.createComment(
      parsed.data.announcementId,
      user,
      parsed.data.content,
    );
    revalidatePath(`/classes/${parsed.data.classroomId}/stream`);

    return { status: "success", data: comment };
  } catch (error) {
    return toErrorResult(error, "Couldn't post the comment. Please try again.");
  }
}

export async function deleteCommentAction(
  classroomId: string,
  commentId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = deleteCommentSchema.safeParse({ commentId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid comment." };
    }

    await streamService.deleteComment(parsed.data.commentId, user);
    revalidatePath(`/classes/${classroomId}/stream`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't delete the comment. Please try again.");
  }
}
