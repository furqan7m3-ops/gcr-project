import type { ClassroomStatus, UserRole, UserStatus } from "@/generated/prisma/enums";

export type SortDirection = "asc" | "desc";

/** Column metadata for a report - the same shape a future CSV/PDF exporter would consume. */
export interface ReportColumn<Row> {
  key: Extract<keyof Row, string>;
  label: string;
  align?: "left" | "right";
}

/** A report's full output: the data and the column metadata describing it, ready to hand to an exporter. */
export interface ReportResult<Row> {
  columns: ReportColumn<Row>[];
  rows: Row[];
  generatedAt: Date;
}

export interface ReportListParams {
  search?: string;
  sortField?: string;
  sortDir?: SortDirection;
}

// --- Teacher activity ---------------------------------------------------

export interface TeacherActivityRow {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  classroomCount: number;
  assignmentsCreated: number;
  announcementsPosted: number;
  materialsPosted: number;
  submissionsGraded: number;
  lastActiveAt: Date | null;
}

export interface TeacherActivityParams extends ReportListParams {
  classroomId?: string;
}

// --- Student activity -----------------------------------------------------

export interface StudentActivityRow {
  studentId: string;
  studentName: string;
  studentEmail: string;
  classroomCount: number;
  submissionsSubmitted: number;
  submissionsGraded: number;
  averageGrade: number | null;
  lastActiveAt: Date | null;
}

export interface StudentActivityParams extends ReportListParams {
  classroomId?: string;
}

// --- Assignment completion -------------------------------------------------

export interface AssignmentCompletionRow {
  assignmentId: string;
  title: string;
  classroomTitle: string;
  status: string;
  dueDate: Date | null;
  totalStudents: number;
  submittedCount: number;
  completionRate: number;
  averageGrade: number | null;
}

export interface AssignmentCompletionParams extends ReportListParams {
  classroomId?: string;
  status?: string;
}

// --- Submission rates -------------------------------------------------------

export interface SubmissionRateRow {
  classroomId: string;
  classroomTitle: string;
  totalAssignments: number;
  activeStudentCount: number;
  totalPossibleSubmissions: number;
  actualSubmissions: number;
  submissionRate: number;
  lateSubmissions: number;
  missingSubmissions: number;
}

export type SubmissionRateParams = ReportListParams;

// --- Classroom activity -----------------------------------------------------

export interface ClassroomActivityRow {
  classroomId: string;
  title: string;
  status: ClassroomStatus;
  memberCount: number;
  teacherCount: number;
  studentCount: number;
  assignmentCount: number;
  announcementCount: number;
  materialCount: number;
  submissionCount: number;
  lastActivityAt: Date | null;
}

export interface ClassroomActivityParams extends ReportListParams {
  status?: ClassroomStatus;
}

// --- Inactive users -----------------------------------------------------

export interface InactiveUserRow {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActiveAt: Date | null;
  daysSinceActive: number | null;
  accountCreatedAt: Date;
}

export interface InactiveUsersParams extends ReportListParams {
  role?: UserRole;
  minDaysInactive?: number;
}

export interface ClassroomOption {
  id: string;
  title: string;
}
