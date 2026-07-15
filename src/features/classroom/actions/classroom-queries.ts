"use server";

import { requireUser } from "@/lib/auth/permissions";

import { ClassroomServiceError } from "../lib/errors";
import * as classroomService from "../services/classroom-service";
import type { ClassroomSummary } from "../types";

export async function getUserClassroomsAction(): Promise<ClassroomSummary[]> {
  const user = await requireUser();
  return classroomService.listUserClassrooms(user.id);
}

export async function getArchivedClassroomsAction(): Promise<ClassroomSummary[]> {
  const user = await requireUser();
  return classroomService.listArchivedClassrooms(user);
}

export async function getClassroomByIdAction(
  classroomId: string,
): Promise<ClassroomSummary | null> {
  const user = await requireUser();

  try {
    return await classroomService.getClassroomForUser(classroomId, user);
  } catch (error) {
    if (error instanceof ClassroomServiceError && error.code === "NOT_FOUND") {
      return null;
    }
    throw error;
  }
}
