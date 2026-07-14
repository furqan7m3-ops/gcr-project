"use server";

import { revalidatePath } from "next/cache";

import { canAccessAdminArea } from "@/lib/auth/permissions";

import * as classroomAdminService from "../services/classroom-admin-service";
import type { ActionResult, AdminClassroomMember, AdminClassroomSummary } from "../types";
import { assignTeacherSchema, transferOwnershipSchema } from "../validation/classroom-admin-schema";
import { formDataToObject, toErrorResult } from "./shared";

export async function archiveClassroomAction(
  classroomId: string,
): Promise<ActionResult<AdminClassroomSummary>> {
  try {
    const actor = await canAccessAdminArea();
    const classroom = await classroomAdminService.archiveClassroom(classroomId, actor);
    revalidatePath("/admin/classrooms");

    return { status: "success", data: classroom };
  } catch (error) {
    return toErrorResult(error, "Couldn't archive this classroom. Please try again.");
  }
}

export async function restoreClassroomAction(
  classroomId: string,
): Promise<ActionResult<AdminClassroomSummary>> {
  try {
    await canAccessAdminArea();
    const classroom = await classroomAdminService.restoreClassroom(classroomId);
    revalidatePath("/admin/classrooms");

    return { status: "success", data: classroom };
  } catch (error) {
    return toErrorResult(error, "Couldn't restore this classroom. Please try again.");
  }
}

export async function deleteClassroomAction(
  classroomId: string,
): Promise<ActionResult<AdminClassroomSummary>> {
  try {
    await canAccessAdminArea();
    const classroom = await classroomAdminService.deleteClassroom(classroomId);
    revalidatePath("/admin/classrooms");

    return { status: "success", data: classroom };
  } catch (error) {
    return toErrorResult(error, "Couldn't delete this classroom. Please try again.");
  }
}

export async function transferOwnershipAction(
  _prevState: ActionResult<AdminClassroomSummary> | null,
  formData: FormData,
): Promise<ActionResult<AdminClassroomSummary>> {
  try {
    await canAccessAdminArea();

    const parsed = transferOwnershipSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const classroom = await classroomAdminService.transferOwnership(
      parsed.data.classroomId,
      parsed.data.newOwnerEmail,
    );
    revalidatePath("/admin/classrooms");

    return { status: "success", data: classroom };
  } catch (error) {
    return toErrorResult(error, "Couldn't transfer ownership. Please try again.");
  }
}

export async function assignTeacherAction(
  _prevState: ActionResult<AdminClassroomMember> | null,
  formData: FormData,
): Promise<ActionResult<AdminClassroomMember>> {
  try {
    await canAccessAdminArea();

    const parsed = assignTeacherSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const member = await classroomAdminService.assignTeacher(
      parsed.data.classroomId,
      parsed.data.teacherEmail,
    );
    revalidatePath("/admin/classrooms");

    return { status: "success", data: member };
  } catch (error) {
    return toErrorResult(error, "Couldn't assign this teacher. Please try again.");
  }
}
