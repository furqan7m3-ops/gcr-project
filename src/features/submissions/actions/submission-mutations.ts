"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/permissions";

import * as submissionService from "../services/submission-service";
import type { ActionResult, SubmissionView } from "../types";
import {
  classroomAssignmentIdSchema,
  removeAttachmentSchema,
  submissionMutationSchema,
} from "../validation/submission-schema";
import { extractFileMetas, formDataToObject, toErrorResult } from "./shared";

function classworkPath(classroomId: string, assignmentId: string) {
  return `/classes/${classroomId}/classwork/${assignmentId}`;
}

export async function saveSubmissionDraftAction(
  formData: FormData,
): Promise<ActionResult<SubmissionView>> {
  try {
    const user = await requireUser();

    const parsed = submissionMutationSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const view = await submissionService.createOrUpdateSubmission(
      parsed.data.assignmentId,
      user,
      { textAnswer: parsed.data.textAnswer },
      extractFileMetas(formData),
    );
    revalidatePath(classworkPath(parsed.data.classroomId, parsed.data.assignmentId));

    return { status: "success", data: view };
  } catch (error) {
    return toErrorResult(error, "Couldn't save your draft. Please try again.");
  }
}

export async function submitAssignmentAction(
  formData: FormData,
): Promise<ActionResult<SubmissionView>> {
  try {
    const user = await requireUser();

    const parsed = submissionMutationSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const view = await submissionService.submitSubmission(
      parsed.data.assignmentId,
      user,
      { textAnswer: parsed.data.textAnswer },
      extractFileMetas(formData),
    );
    revalidatePath(classworkPath(parsed.data.classroomId, parsed.data.assignmentId));

    return { status: "success", data: view };
  } catch (error) {
    return toErrorResult(error, "Couldn't turn in your assignment. Please try again.");
  }
}

export async function unsubmitAssignmentAction(
  classroomId: string,
  assignmentId: string,
): Promise<ActionResult<SubmissionView>> {
  try {
    const user = await requireUser();

    const parsed = classroomAssignmentIdSchema.safeParse({ classroomId, assignmentId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid assignment." };
    }

    const view = await submissionService.unsubmitSubmission(parsed.data.assignmentId, user);
    revalidatePath(classworkPath(parsed.data.classroomId, parsed.data.assignmentId));

    return { status: "success", data: view };
  } catch (error) {
    return toErrorResult(error, "Couldn't unsubmit your work. Please try again.");
  }
}

export async function removeSubmissionAttachmentAction(
  classroomId: string,
  assignmentId: string,
  submissionId: string,
  fileAttachmentId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const idsParsed = classroomAssignmentIdSchema.safeParse({ classroomId, assignmentId });
    const attachmentParsed = removeAttachmentSchema.safeParse({ submissionId, fileAttachmentId });
    if (!idsParsed.success || !attachmentParsed.success) {
      return { status: "error", message: "Invalid attachment." };
    }

    await submissionService.removeSubmissionAttachment(
      attachmentParsed.data.submissionId,
      attachmentParsed.data.fileAttachmentId,
      user,
    );
    revalidatePath(classworkPath(idsParsed.data.classroomId, idsParsed.data.assignmentId));

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't remove that attachment. Please try again.");
  }
}
