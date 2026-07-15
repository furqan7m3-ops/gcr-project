import { requireRole, requireUser } from "@/lib/auth/permissions";
import { UserRole } from "@/generated/prisma/enums";

import * as dashboardService from "../services/dashboard-service";
import type { AdminDashboardData, StudentDashboardData, TeacherDashboardData } from "../types";

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const user = await requireRole([UserRole.TEACHER]);
  return dashboardService.getTeacherDashboard(user);
}

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const user = await requireUser();
  return dashboardService.getStudentDashboard(user);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireRole([UserRole.ADMIN]);
  return dashboardService.getAdminDashboard();
}
