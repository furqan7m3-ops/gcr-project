"use server";

import { canAccessAdminArea } from "@/lib/auth/permissions";

import * as classroomAdminService from "../services/classroom-admin-service";
import type { AdminClassroomDetail, ClassroomsPage, ListClassroomsParams } from "../types";

export async function getClassroomsPageAction(
  params: ListClassroomsParams,
): Promise<ClassroomsPage> {
  await canAccessAdminArea();
  return classroomAdminService.listClassrooms(params);
}

export async function getClassroomDetailAction(classroomId: string): Promise<AdminClassroomDetail> {
  await canAccessAdminArea();
  return classroomAdminService.getClassroomDetail(classroomId);
}
