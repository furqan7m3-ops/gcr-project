import { canManageClassroom } from "@/features/classroom/lib/can-manage";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  AssignmentStatus,
  ClassroomMembershipRole,
  ClassroomMembershipStatus,
  ClassroomStatus,
  SubmissionStatus,
  UserRole,
  UserStatus,
} from "@/generated/prisma/enums";

import { sortRows } from "../lib/sort-rows";
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

const MANAGER_ROLES = [
  ClassroomMembershipRole.OWNER,
  ClassroomMembershipRole.TEACHER,
  ClassroomMembershipRole.CO_TEACHER,
];
const LEARNER_ROLES = [ClassroomMembershipRole.STUDENT, ClassroomMembershipRole.ASSISTANT];
const SUBMITTED_STATUSES = [
  SubmissionStatus.SUBMITTED,
  SubmissionStatus.LATE,
  SubmissionStatus.REVIEWED,
  SubmissionStatus.RETURNED,
];

function searchClause<Where>(search: string | undefined, fields: string[]): Where {
  if (!search) {
    return {} as Where;
  }
  return {
    OR: fields.map((field) => ({ [field]: { contains: search, mode: "insensitive" } })),
  } as Where;
}

// --- Teacher activity -------------------------------------------------------

const teacherActivityColumns: ReportResult<TeacherActivityRow>["columns"] = [
  { key: "teacherName", label: "Teacher" },
  { key: "teacherEmail", label: "Email" },
  { key: "classroomCount", label: "Classrooms", align: "right" },
  { key: "assignmentsCreated", label: "Assignments created", align: "right" },
  { key: "announcementsPosted", label: "Announcements", align: "right" },
  { key: "materialsPosted", label: "Materials", align: "right" },
  { key: "submissionsGraded", label: "Submissions graded", align: "right" },
  { key: "lastActiveAt", label: "Last active" },
];

export async function getTeacherActivityReport(
  params: TeacherActivityParams,
): Promise<ReportResult<TeacherActivityRow>> {
  const sortField = params.sortField ?? "teacherName";
  const sortDir = params.sortDir ?? "asc";

  const [
    teachers,
    memberships,
    assignmentCounts,
    announcementCounts,
    materialCounts,
    lastActivity,
    assignments,
    gradedByAssignment,
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: UserRole.TEACHER,
        ...searchClause<Prisma.UserWhereInput>(params.search, ["name", "email"]),
      },
      select: { id: true, name: true, email: true },
    }),
    prisma.classroomMembership.findMany({
      where: { status: ClassroomMembershipStatus.ACTIVE, role: { in: MANAGER_ROLES } },
      select: { userId: true, classroomId: true },
    }),
    prisma.assignment.groupBy({ by: ["authorId"], where: { deletedAt: null }, _count: true }),
    prisma.announcement.groupBy({ by: ["authorId"], where: { deletedAt: null }, _count: true }),
    prisma.material.groupBy({ by: ["authorId"], where: { deletedAt: null }, _count: true }),
    prisma.activityLog.groupBy({ by: ["actorId"], _max: { createdAt: true } }),
    prisma.assignment.findMany({
      where: { deletedAt: null },
      select: { id: true, classroomId: true },
    }),
    prisma.submission.groupBy({
      by: ["assignmentId"],
      where: { deletedAt: null, gradedAt: { not: null } },
      _count: true,
    }),
  ]);

  const classroomIdByAssignment = new Map(assignments.map((row) => [row.id, row.classroomId]));
  // There is no grader column on Submission, so "graded" is attributed to
  // every teacher managing the classroom the assignment belongs to - this
  // joins two already-aggregated result sets in memory rather than issuing a
  // query per assignment or per teacher.
  const gradedByClassroom = new Map<string, number>();
  for (const row of gradedByAssignment) {
    const classroomId = classroomIdByAssignment.get(row.assignmentId);
    if (!classroomId) {
      continue;
    }
    gradedByClassroom.set(classroomId, (gradedByClassroom.get(classroomId) ?? 0) + row._count);
  }

  const classroomsByTeacher = new Map<string, string[]>();
  for (const membership of memberships) {
    const list = classroomsByTeacher.get(membership.userId) ?? [];
    list.push(membership.classroomId);
    classroomsByTeacher.set(membership.userId, list);
  }

  const assignmentMap = new Map(assignmentCounts.map((row) => [row.authorId, row._count]));
  const announcementMap = new Map(announcementCounts.map((row) => [row.authorId, row._count]));
  const materialMap = new Map(materialCounts.map((row) => [row.authorId, row._count]));
  const lastActiveMap = new Map(lastActivity.map((row) => [row.actorId, row._max.createdAt]));

  let rows: TeacherActivityRow[] = teachers
    .filter((teacher) => {
      if (!params.classroomId) {
        return true;
      }
      return (classroomsByTeacher.get(teacher.id) ?? []).includes(params.classroomId);
    })
    .map((teacher) => {
      const managedClassrooms = classroomsByTeacher.get(teacher.id) ?? [];
      const submissionsGraded = managedClassrooms.reduce(
        (sum, classroomId) => sum + (gradedByClassroom.get(classroomId) ?? 0),
        0,
      );

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        classroomCount: managedClassrooms.length,
        assignmentsCreated: assignmentMap.get(teacher.id) ?? 0,
        announcementsPosted: announcementMap.get(teacher.id) ?? 0,
        materialsPosted: materialMap.get(teacher.id) ?? 0,
        submissionsGraded,
        lastActiveAt: lastActiveMap.get(teacher.id) ?? null,
      };
    });

  rows = sortRows<TeacherActivityRow>(rows, sortField, sortDir);

  return { columns: teacherActivityColumns, rows, generatedAt: new Date() };
}

// --- Student activity -----------------------------------------------------

const studentActivityColumns: ReportResult<StudentActivityRow>["columns"] = [
  { key: "studentName", label: "Student" },
  { key: "studentEmail", label: "Email" },
  { key: "classroomCount", label: "Classrooms", align: "right" },
  { key: "submissionsSubmitted", label: "Submissions", align: "right" },
  { key: "submissionsGraded", label: "Graded", align: "right" },
  { key: "averageGrade", label: "Average grade", align: "right" },
  { key: "lastActiveAt", label: "Last active" },
];

export async function getStudentActivityReport(
  params: StudentActivityParams,
): Promise<ReportResult<StudentActivityRow>> {
  const sortField = params.sortField ?? "studentName";
  const sortDir = params.sortDir ?? "asc";

  const [students, memberships, submissionStats, gradedCounts, lastActivity] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        ...searchClause<Prisma.UserWhereInput>(params.search, ["name", "email"]),
      },
      select: { id: true, name: true, email: true },
    }),
    prisma.classroomMembership.findMany({
      where: { status: ClassroomMembershipStatus.ACTIVE, role: { in: LEARNER_ROLES } },
      select: { userId: true, classroomId: true },
    }),
    prisma.submission.groupBy({
      by: ["studentId"],
      where: { deletedAt: null, status: { in: SUBMITTED_STATUSES } },
      _count: true,
      _avg: { grade: true },
    }),
    prisma.submission.groupBy({
      by: ["studentId"],
      where: { deletedAt: null, gradedAt: { not: null } },
      _count: true,
    }),
    prisma.activityLog.groupBy({ by: ["actorId"], _max: { createdAt: true } }),
  ]);

  const classroomsByStudent = new Map<string, string[]>();
  for (const membership of memberships) {
    const list = classroomsByStudent.get(membership.userId) ?? [];
    list.push(membership.classroomId);
    classroomsByStudent.set(membership.userId, list);
  }

  const submissionMap = new Map(submissionStats.map((row) => [row.studentId, row]));
  const gradedMap = new Map(gradedCounts.map((row) => [row.studentId, row._count]));
  const lastActiveMap = new Map(lastActivity.map((row) => [row.actorId, row._max.createdAt]));

  let rows: StudentActivityRow[] = students
    .filter((student) => {
      if (!params.classroomId) {
        return true;
      }
      return (classroomsByStudent.get(student.id) ?? []).includes(params.classroomId);
    })
    .map((student) => {
      const stat = submissionMap.get(student.id);

      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        classroomCount: (classroomsByStudent.get(student.id) ?? []).length,
        submissionsSubmitted: stat?._count ?? 0,
        submissionsGraded: gradedMap.get(student.id) ?? 0,
        averageGrade: stat?._avg.grade ?? null,
        lastActiveAt: lastActiveMap.get(student.id) ?? null,
      };
    });

  rows = sortRows<StudentActivityRow>(rows, sortField, sortDir);

  return { columns: studentActivityColumns, rows, generatedAt: new Date() };
}

// --- Assignment completion ---------------------------------------------------

const assignmentCompletionColumns: ReportResult<AssignmentCompletionRow>["columns"] = [
  { key: "title", label: "Assignment" },
  { key: "classroomTitle", label: "Classroom" },
  { key: "status", label: "Status" },
  { key: "dueDate", label: "Due date" },
  { key: "totalStudents", label: "Students", align: "right" },
  { key: "submittedCount", label: "Submitted", align: "right" },
  { key: "completionRate", label: "Completion rate", align: "right" },
  { key: "averageGrade", label: "Average grade", align: "right" },
];

export async function getAssignmentCompletionReport(
  params: AssignmentCompletionParams,
): Promise<ReportResult<AssignmentCompletionRow>> {
  const sortField = params.sortField ?? "dueDate";
  const sortDir = params.sortDir ?? "desc";

  const where: Prisma.AssignmentWhereInput = {
    deletedAt: null,
    ...(params.classroomId ? { classroomId: params.classroomId } : {}),
    ...(params.status ? { status: params.status as AssignmentStatus } : {}),
    ...(params.search ? { title: { contains: params.search, mode: "insensitive" } } : {}),
  };

  const [assignments, studentCounts, submissionStats] = await Promise.all([
    prisma.assignment.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        classroomId: true,
        classroom: { select: { title: true } },
      },
    }),
    prisma.classroomMembership.groupBy({
      by: ["classroomId"],
      where: { role: ClassroomMembershipRole.STUDENT, status: ClassroomMembershipStatus.ACTIVE },
      _count: true,
    }),
    prisma.submission.groupBy({
      by: ["assignmentId"],
      where: { deletedAt: null, status: { in: SUBMITTED_STATUSES } },
      _count: true,
      _avg: { grade: true },
    }),
  ]);

  const studentCountMap = new Map(studentCounts.map((row) => [row.classroomId, row._count]));
  const submissionMap = new Map(submissionStats.map((row) => [row.assignmentId, row]));

  let rows: AssignmentCompletionRow[] = assignments.map((assignment) => {
    const totalStudents = studentCountMap.get(assignment.classroomId) ?? 0;
    const stat = submissionMap.get(assignment.id);
    const submittedCount = stat?._count ?? 0;

    return {
      assignmentId: assignment.id,
      title: assignment.title,
      classroomTitle: assignment.classroom.title,
      status: assignment.status,
      dueDate: assignment.dueDate,
      totalStudents,
      submittedCount,
      completionRate: totalStudents > 0 ? submittedCount / totalStudents : 0,
      averageGrade: stat?._avg.grade ?? null,
    };
  });

  rows = sortRows<AssignmentCompletionRow>(rows, sortField, sortDir);

  return { columns: assignmentCompletionColumns, rows, generatedAt: new Date() };
}

// --- Submission rates ---------------------------------------------------------

const submissionRateColumns: ReportResult<SubmissionRateRow>["columns"] = [
  { key: "classroomTitle", label: "Classroom" },
  { key: "totalAssignments", label: "Assignments", align: "right" },
  { key: "activeStudentCount", label: "Students", align: "right" },
  { key: "actualSubmissions", label: "Submissions", align: "right" },
  { key: "submissionRate", label: "Submission rate", align: "right" },
  { key: "lateSubmissions", label: "Late", align: "right" },
  { key: "missingSubmissions", label: "Missing", align: "right" },
];

export async function getSubmissionRatesReport(
  params: SubmissionRateParams,
): Promise<ReportResult<SubmissionRateRow>> {
  const sortField = params.sortField ?? "submissionRate";
  const sortDir = params.sortDir ?? "asc";

  const [classrooms, studentCounts, assignmentCounts, assignments, submissionStats] =
    await Promise.all([
      prisma.classroom.findMany({
        where: {
          status: { not: ClassroomStatus.DELETED },
          ...(params.search ? { title: { contains: params.search, mode: "insensitive" } } : {}),
        },
        select: { id: true, title: true },
      }),
      prisma.classroomMembership.groupBy({
        by: ["classroomId"],
        where: { role: ClassroomMembershipRole.STUDENT, status: ClassroomMembershipStatus.ACTIVE },
        _count: true,
      }),
      prisma.assignment.groupBy({ by: ["classroomId"], where: { deletedAt: null }, _count: true }),
      prisma.assignment.findMany({
        where: { deletedAt: null },
        select: { id: true, classroomId: true },
      }),
      prisma.submission.groupBy({
        by: ["assignmentId", "status"],
        where: { deletedAt: null },
        _count: true,
      }),
    ]);

  const studentCountMap = new Map(studentCounts.map((row) => [row.classroomId, row._count]));
  const assignmentCountMap = new Map(assignmentCounts.map((row) => [row.classroomId, row._count]));
  const classroomIdByAssignment = new Map(assignments.map((row) => [row.id, row.classroomId]));

  const actualByClassroom = new Map<string, number>();
  const lateByClassroom = new Map<string, number>();
  const missingByClassroom = new Map<string, number>();

  for (const row of submissionStats) {
    const classroomId = classroomIdByAssignment.get(row.assignmentId);
    if (!classroomId) {
      continue;
    }

    if (row.status === SubmissionStatus.MISSING) {
      missingByClassroom.set(classroomId, (missingByClassroom.get(classroomId) ?? 0) + row._count);
      continue;
    }
    if (row.status === SubmissionStatus.LATE) {
      lateByClassroom.set(classroomId, (lateByClassroom.get(classroomId) ?? 0) + row._count);
    }
    if (row.status !== SubmissionStatus.ASSIGNED) {
      actualByClassroom.set(classroomId, (actualByClassroom.get(classroomId) ?? 0) + row._count);
    }
  }

  let rows: SubmissionRateRow[] = classrooms.map((classroom) => {
    const activeStudentCount = studentCountMap.get(classroom.id) ?? 0;
    const totalAssignments = assignmentCountMap.get(classroom.id) ?? 0;
    const totalPossibleSubmissions = activeStudentCount * totalAssignments;
    const actualSubmissions = actualByClassroom.get(classroom.id) ?? 0;

    return {
      classroomId: classroom.id,
      classroomTitle: classroom.title,
      totalAssignments,
      activeStudentCount,
      totalPossibleSubmissions,
      actualSubmissions,
      submissionRate:
        totalPossibleSubmissions > 0 ? actualSubmissions / totalPossibleSubmissions : 0,
      lateSubmissions: lateByClassroom.get(classroom.id) ?? 0,
      missingSubmissions: missingByClassroom.get(classroom.id) ?? 0,
    };
  });

  rows = sortRows<SubmissionRateRow>(rows, sortField, sortDir);

  return { columns: submissionRateColumns, rows, generatedAt: new Date() };
}

// --- Classroom activity -------------------------------------------------------

const classroomActivityColumns: ReportResult<ClassroomActivityRow>["columns"] = [
  { key: "title", label: "Classroom" },
  { key: "status", label: "Status" },
  { key: "memberCount", label: "Members", align: "right" },
  { key: "teacherCount", label: "Teachers", align: "right" },
  { key: "studentCount", label: "Students", align: "right" },
  { key: "assignmentCount", label: "Assignments", align: "right" },
  { key: "announcementCount", label: "Announcements", align: "right" },
  { key: "materialCount", label: "Materials", align: "right" },
  { key: "submissionCount", label: "Submissions", align: "right" },
  { key: "lastActivityAt", label: "Last activity" },
];

export async function getClassroomActivityReport(
  params: ClassroomActivityParams,
): Promise<ReportResult<ClassroomActivityRow>> {
  const sortField = params.sortField ?? "lastActivityAt";
  const sortDir = params.sortDir ?? "desc";

  const where: Prisma.ClassroomWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.search ? { title: { contains: params.search, mode: "insensitive" } } : {}),
  };

  const [
    classrooms,
    memberships,
    assignmentCounts,
    announcementCounts,
    materialCounts,
    assignments,
    submissionCounts,
    lastActivity,
  ] = await Promise.all([
    prisma.classroom.findMany({ where, select: { id: true, title: true, status: true } }),
    prisma.classroomMembership.findMany({
      where: { status: ClassroomMembershipStatus.ACTIVE },
      select: { classroomId: true, role: true },
    }),
    prisma.assignment.groupBy({ by: ["classroomId"], where: { deletedAt: null }, _count: true }),
    prisma.announcement.groupBy({ by: ["classroomId"], where: { deletedAt: null }, _count: true }),
    prisma.material.groupBy({ by: ["classroomId"], where: { deletedAt: null }, _count: true }),
    prisma.assignment.findMany({
      where: { deletedAt: null },
      select: { id: true, classroomId: true },
    }),
    prisma.submission.groupBy({ by: ["assignmentId"], where: { deletedAt: null }, _count: true }),
    prisma.activityLog.groupBy({ by: ["classroomId"], _max: { createdAt: true } }),
  ]);

  const memberCountMap = new Map<string, number>();
  const teacherCountMap = new Map<string, number>();
  const studentCountMap = new Map<string, number>();

  for (const membership of memberships) {
    memberCountMap.set(
      membership.classroomId,
      (memberCountMap.get(membership.classroomId) ?? 0) + 1,
    );
    if (canManageClassroom(membership.role)) {
      teacherCountMap.set(
        membership.classroomId,
        (teacherCountMap.get(membership.classroomId) ?? 0) + 1,
      );
    } else {
      studentCountMap.set(
        membership.classroomId,
        (studentCountMap.get(membership.classroomId) ?? 0) + 1,
      );
    }
  }

  const assignmentCountMap = new Map(assignmentCounts.map((row) => [row.classroomId, row._count]));
  const announcementCountMap = new Map(
    announcementCounts.map((row) => [row.classroomId, row._count]),
  );
  const materialCountMap = new Map(materialCounts.map((row) => [row.classroomId, row._count]));
  const classroomIdByAssignment = new Map(assignments.map((row) => [row.id, row.classroomId]));

  const submissionCountMap = new Map<string, number>();
  for (const row of submissionCounts) {
    const classroomId = classroomIdByAssignment.get(row.assignmentId);
    if (!classroomId) {
      continue;
    }
    submissionCountMap.set(classroomId, (submissionCountMap.get(classroomId) ?? 0) + row._count);
  }

  const lastActivityMap = new Map<string, Date | null>();
  for (const row of lastActivity) {
    if (row.classroomId) {
      lastActivityMap.set(row.classroomId, row._max.createdAt);
    }
  }

  let rows: ClassroomActivityRow[] = classrooms.map((classroom) => ({
    classroomId: classroom.id,
    title: classroom.title,
    status: classroom.status,
    memberCount: memberCountMap.get(classroom.id) ?? 0,
    teacherCount: teacherCountMap.get(classroom.id) ?? 0,
    studentCount: studentCountMap.get(classroom.id) ?? 0,
    assignmentCount: assignmentCountMap.get(classroom.id) ?? 0,
    announcementCount: announcementCountMap.get(classroom.id) ?? 0,
    materialCount: materialCountMap.get(classroom.id) ?? 0,
    submissionCount: submissionCountMap.get(classroom.id) ?? 0,
    lastActivityAt: lastActivityMap.get(classroom.id) ?? null,
  }));

  rows = sortRows<ClassroomActivityRow>(rows, sortField, sortDir);

  return { columns: classroomActivityColumns, rows, generatedAt: new Date() };
}

// --- Inactive users -----------------------------------------------------

const inactiveUsersColumns: ReportResult<InactiveUserRow>["columns"] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "lastActiveAt", label: "Last active" },
  { key: "daysSinceActive", label: "Inactive for", align: "right" },
  { key: "accountCreatedAt", label: "Account created" },
];

export async function getInactiveUsersReport(
  params: InactiveUsersParams,
): Promise<ReportResult<InactiveUserRow>> {
  const sortField = params.sortField ?? "daysSinceActive";
  const sortDir = params.sortDir ?? "desc";
  const minDaysInactive = params.minDaysInactive ?? 30;

  const [users, lastActivity] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...(params.role ? { role: params.role } : {}),
        ...searchClause<Prisma.UserWhereInput>(params.search, ["name", "email"]),
      },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    }),
    prisma.activityLog.groupBy({ by: ["actorId"], _max: { createdAt: true } }),
  ]);

  const lastActiveMap = new Map(lastActivity.map((row) => [row.actorId, row._max.createdAt]));
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let rows: InactiveUserRow[] = users
    .map((user) => {
      const lastActiveAt = lastActiveMap.get(user.id) ?? null;
      const referenceDate = lastActiveAt ?? user.createdAt;
      const daysSinceActive = Math.floor((now - referenceDate.getTime()) / dayMs);

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastActiveAt,
        daysSinceActive,
        accountCreatedAt: user.createdAt,
      };
    })
    .filter((row) => row.status !== UserStatus.ACTIVE || row.daysSinceActive >= minDaysInactive);

  rows = sortRows<InactiveUserRow>(rows, sortField, sortDir);

  return { columns: inactiveUsersColumns, rows, generatedAt: new Date() };
}

// --- Shared lookups -----------------------------------------------------

export async function getClassroomOptions(): Promise<ClassroomOption[]> {
  return prisma.classroom.findMany({
    where: { status: { not: ClassroomStatus.DELETED } },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });
}
