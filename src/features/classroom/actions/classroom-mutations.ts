"use server";

import { revalidatePath } from "next/cache";

import { AuthError, requireRole, requireUser } from "@/lib/auth/permissions";
import { UserRole } from "@/generated/prisma/enums";

import { ClassroomServiceError } from "../lib/errors";
import * as classroomService from "../services/classroom-service";
import type { ActionResult, ClassroomSummary } from "../types";
import {
  createClassroomSchema,
  joinClassroomSchema,
  updateClassroomSchema,
} from "../validation/classroom-schema";
import { changeMemberRoleSchema, removeMemberSchema } from "../validation/member-schema";

function formDataToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

function toErrorResult<T>(error: unknown, fallbackMessage: string): ActionResult<T> {
  if (error instanceof AuthError) {
    return { status: "error", message: error.message };
  }

  if (error instanceof ClassroomServiceError) {
    return { status: "error", message: error.message };
  }

  console.error(error);
  return { status: "error", message: fallbackMessage };
}

export async function createClassroomAction(
  _prevState: ActionResult<ClassroomSummary> | null,
  formData: FormData,
): Promise<ActionResult<ClassroomSummary>> {
  try {
    const user = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);

    const parsed = createClassroomSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const classroom = await classroomService.createClassroom(user.id, parsed.data);
    revalidatePath("/classes");
    revalidatePath("/dashboard");

    return { status: "success", data: classroom };
  } catch (error) {
    return toErrorResult(error, "Couldn't create the class. Please try again.");
  }
}

export async function updateClassroomAction(
  _prevState: ActionResult<ClassroomSummary> | null,
  formData: FormData,
): Promise<ActionResult<ClassroomSummary>> {
  try {
    const user = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);

    const parsed = updateClassroomSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { classroomId, ...data } = parsed.data;
    const classroom = await classroomService.updateClassroom(classroomId, user, data);
    revalidatePath("/classes");
    revalidatePath(`/classes/${classroomId}`);

    return { status: "success", data: classroom };
  } catch (error) {
    return toErrorResult(error, "Couldn't update the class. Please try again.");
  }
}

export async function archiveClassroomAction(
  classroomId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
    await classroomService.archiveClassroom(classroomId, user);

    revalidatePath("/classes");
    revalidatePath(`/classes/${classroomId}`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't archive the class. Please try again.");
  }
}

export async function joinClassroomAction(
  _prevState: ActionResult<ClassroomSummary> | null,
  formData: FormData,
): Promise<ActionResult<ClassroomSummary>> {
  try {
    const user = await requireUser();

    const parsed = joinClassroomSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const classroom = await classroomService.joinClassroomByCode(user.id, parsed.data.code);
    revalidatePath("/classes");
    revalidatePath("/dashboard");

    return { status: "success", data: classroom };
  } catch (error) {
    return toErrorResult(error, "Couldn't join the class. Please try again.");
  }
}

export async function leaveClassroomAction(classroomId: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await classroomService.leaveClassroom(user.id, classroomId);

    revalidatePath("/classes");
    revalidatePath(`/classes/${classroomId}`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't leave the class. Please try again.");
  }
}

export async function removeMemberAction(
  classroomId: string,
  userId: string,
): Promise<ActionResult<undefined>> {
  try {
    const actor = await requireUser();

    const parsed = removeMemberSchema.safeParse({ classroomId, userId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid member." };
    }

    await classroomService.removeMember(parsed.data.classroomId, parsed.data.userId, actor);
    revalidatePath(`/classes/${classroomId}/people`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't remove this member. Please try again.");
  }
}

export async function changeMemberRoleAction(
  classroomId: string,
  userId: string,
  role: string,
): Promise<ActionResult<undefined>> {
  try {
    const actor = await requireUser();

    const parsed = changeMemberRoleSchema.safeParse({ classroomId, userId, role });
    if (!parsed.success) {
      return { status: "error", message: "Invalid role change." };
    }

    await classroomService.changeMemberRole(
      parsed.data.classroomId,
      parsed.data.userId,
      parsed.data.role,
      actor,
    );
    revalidatePath(`/classes/${classroomId}/people`);
    revalidatePath(`/classes/${classroomId}`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't change this member's role. Please try again.");
  }
}
