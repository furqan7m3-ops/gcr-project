import { requireRole, requireUser } from "@/lib/auth/permissions";
import { UserRole } from "@/generated/prisma/enums";

import * as dashboardService from "../services/dashboard-service";
import type { AdminDashboardData, StudentDashboardData, TeacherDashboardData } from "../types";

// Admins are allowed here too - getTeacherDashboard's underlying queries
// already bypass to platform-wide data for ADMIN (same convention as
// getManageableClassrooms/countArchivedClassrooms elsewhere), which is what
// an admin should see if they "Exit to app" into the shared shell rather
// than staying on their dedicated /admin dashboard.
export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const user = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
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
