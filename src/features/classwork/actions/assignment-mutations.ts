"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/permissions";
import { AssignmentStatus } from "@/generated/prisma/enums";

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
      parsed.data.status === "PUBLISHED" ? AssignmentStatus.PUBLISHED : AssignmentStatus.DRAFT,
      extractFileMetas(formData),
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

export async function publishAssignmentAction(
  classroomId: string,
  assignmentId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = assignmentIdSchema.safeParse({ assignmentId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid assignment." };
    }

    await assignmentService.publishAssignment(parsed.data.assignmentId, user);
    revalidatePath(`/classes/${classroomId}/classwork`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't publish the assignment. Please try again.");
  }
}

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
