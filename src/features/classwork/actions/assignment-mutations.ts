"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/permissions";
import { AssignmentStatus } from "@/generated/prisma/enums";

const STATUS_MAP = {
  DRAFT: AssignmentStatus.DRAFT,
  SCHEDULED: AssignmentStatus.SCHEDULED,
  PUBLISHED: AssignmentStatus.PUBLISHED,
} as const;

import * as assignmentService from "../services/assignment-service";
import type { ActionResult, AssignmentSummary } from "../types";
import {
  assignmentIdSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
} from "../validation/assignment-schema";
import { extractFileMetas, formDataToObject, toErrorResult } from "./shared";

export async function createAssignmentAction(
  _prevState: ActionResult<AssignmentSummary> | null,
  formData: FormData,
): Promise<ActionResult<AssignmentSummary>> {
  try {
    const user = await requireUser();

    const parsed = createAssignmentSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const assignment = await assignmentService.createAssignment(
      parsed.data.classroomId,
      user,
      {
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: parsed.data.dueDate,
        points: parsed.data.points,
        topicId: parsed.data.topicId,
      },
      STATUS_MAP[parsed.data.status],
      extractFileMetas(formData),
      parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null,
    );
    revalidatePath(`/classes/${parsed.data.classroomId}/classwork`);

    return { status: "success", data: assignment };
  } catch (error) {
    return toErrorResult(error, "Couldn't create the assignment. Please try again.");
  }
}

export async function updateAssignmentAction(
  _prevState: ActionResult<AssignmentSummary> | null,
  formData: FormData,
): Promise<ActionResult<AssignmentSummary>> {
  try {
    const user = await requireUser();

    const parsed = updateAssignmentSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const assignment = await assignmentService.updateAssignment(parsed.data.assignmentId, user, {
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate,
      points: parsed.data.points,
      topicId: parsed.data.topicId,
    });
    revalidatePath(`/classes/${parsed.data.classroomId}/classwork`);

    return { status: "success", data: assignment };
  } catch (error) {
    return toErrorResult(error, "Couldn't update the assignment. Please try again.");
  }
}

// Publishing a draft/scheduled assignment immediately now goes through the
// shared scheduling feature's publishNow action - see
// src/features/scheduling/actions/scheduling-mutations.ts.

export async function closeAssignmentAction(
  classroomId: string,
  assignmentId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = assignmentIdSchema.safeParse({ assignmentId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid assignment." };
    }

    await assignmentService.closeAssignment(parsed.data.assignmentId, user);
    revalidatePath(`/classes/${classroomId}/classwork`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't close the assignment. Please try again.");
  }
}

export async function deleteAssignmentAction(
  classroomId: string,
  assignmentId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = assignmentIdSchema.safeParse({ assignmentId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid assignment." };
    }

    await assignmentService.deleteAssignment(parsed.data.assignmentId, user);
    revalidatePath(`/classes/${classroomId}/classwork`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't delete the assignment. Please try again.");
  }
}
