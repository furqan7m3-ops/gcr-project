"use server";

import { canAccessAdminArea } from "@/lib/auth/permissions";

import * as service from "../services/detailed-reports-service";
import type {
  AssignmentCompletionParams,
  AssignmentCompletionRow,
  ClassroomActivityParams,
  ClassroomActivityRow,
  ClassroomOption,
  InactiveUserRow,
  InactiveUsersParams,
  ReportResult,
  StudentActivityParams,
  StudentActivityRow,
  SubmissionRateParams,
  SubmissionRateRow,
  TeacherActivityParams,
  TeacherActivityRow,
} from "../detailed-types";

export async function getTeacherActivityReportAction(
  params: TeacherActivityParams,
): Promise<ReportResult<TeacherActivityRow>> {
  await canAccessAdminArea();
  return service.getTeacherActivityReport(params);
}

export async function getStudentActivityReportAction(
  params: StudentActivityParams,
): Promise<ReportResult<StudentActivityRow>> {
  await canAccessAdminArea();
  return service.getStudentActivityReport(params);
}

export async function getAssignmentCompletionReportAction(
  params: AssignmentCompletionParams,
): Promise<ReportResult<AssignmentCompletionRow>> {
  await canAccessAdminArea();
  return service.getAssignmentCompletionReport(params);
}

export async function getSubmissionRatesReportAction(
  params: SubmissionRateParams,
): Promise<ReportResult<SubmissionRateRow>> {
  await canAccessAdminArea();
  return service.getSubmissionRatesReport(params);
}

export async function getClassroomActivityReportAction(
  params: ClassroomActivityParams,
): Promise<ReportResult<ClassroomActivityRow>> {
  await canAccessAdminArea();
  return service.getClassroomActivityReport(params);
}

export async function getInactiveUsersReportAction(
  params: InactiveUsersParams,
): Promise<ReportResult<InactiveUserRow>> {
  await canAccessAdminArea();
  return service.getInactiveUsersReport(params);
}

export async function getClassroomOptionsAction(): Promise<ClassroomOption[]> {
  await canAccessAdminArea();
  return service.getClassroomOptions();
}
