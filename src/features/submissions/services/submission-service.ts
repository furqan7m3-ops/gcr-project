import { randomUUID } from "node:crypto";

import type { SessionUser } from "@/auth/session";
import {
  assertClassroomActive,
  assertManagementAccess,
} from "@/features/classroom/services/classroom-service";
import { canManageClassroom } from "@/features/classroom/lib/can-manage";
import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { notifySubmissionReturned } from "@/features/notifications/services/notification-generator";
import { getFileAttachmentsByEntityIds, type AttachedFileSummary } from "@/lib/file-attachments";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  AssignmentStatus,
  ClassroomMembershipRole,
  ClassroomMembershipStatus,
  ClassroomStatus,
  CommentVisibility,
  FileAttachmentType,
  SubmissionStatus,
  UserRole,
} from "@/generated/prisma/enums";

import { toDisplayStatus } from "../lib/display-status";
import type {
  GradeSummary,
  PrivateCommentSummary,
  SubmissionOverview,
  SubmissionReviewDetail,
  SubmissionView,
} from "../types";

export interface FileMeta {
  fileName: string;
  mimeType: string;
  size: number;
}

export interface SubmissionInput {
  textAnswer?: string;
}

export interface GradeInput {
  grade: number;
  feedback?: string;
}

type AssignmentContext = {
  id: string;
  classroomId: string;
  status: AssignmentStatus;
  dueDate: Date | null;
  allowLateSubmission: boolean;
  classroom: { status: ClassroomStatus };
};

async function loadAssignmentContext(assignmentId: string): Promise<AssignmentContext> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      classroomId: true,
      status: true,
      dueDate: true,
      allowLateSubmission: true,
      deletedAt: true,
      classroom: { select: { status: true } },
    },
  });

  // Drafts and deleted assignments are hidden from students entirely, not just forbidden.
  if (!assignment || assignment.deletedAt || assignment.status === AssignmentStatus.DRAFT) {
    throw new ClassroomServiceError("NOT_FOUND", "Assignment not found.");
  }

  return assignment;
}

/** Any active, non-management classroom member may hold a submission - platform admins never can. */
async function assertStudentEligibility(classroomId: string, user: SessionUser): Promise<void> {
  if (user.role === UserRole.ADMIN) {
    throw new ClassroomServiceError("FORBIDDEN", "Admins cannot submit assignments.");
  }

  const membership = await prisma.classroomMembership.findUnique({
    where: { classroomId_userId: { classroomId, userId: user.id } },
  });

  if (!membership || membership.status !== ClassroomMembershipStatus.ACTIVE) {
    throw new ClassroomServiceError("FORBIDDEN", "You are not a member of this classroom.");
  }

  if (canManageClassroom(membership.role)) {
    throw new ClassroomServiceError("FORBIDDEN", "Teachers cannot submit assignments.");
  }
}

function assertAssignmentAcceptsWork(assignment: AssignmentContext): void {
  assertClassroomActive(
    assignment.classroom,
    "This class is archived and no longer accepts submissions.",
  );

  if (assignment.status === AssignmentStatus.CLOSED) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "This assignment has been closed and no longer accepts submissions.",
    );
  }
}

async function findSubmissionByAssignmentAndStudent(assignmentId: string, studentId: string) {
  return prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
  });
}

type SubmissionRow = NonNullable<Awaited<ReturnType<typeof findSubmissionByAssignmentAndStudent>>>;

// A student's in-progress draft (status ASSIGNED) is never visible to a
// teacher - it's treated identically to "no submission at all" everywhere a
// teacher looks (overview counts, the review page, and private comments).
// Only the student's own queries see draft content.
function toTeacherVisibleSubmission(row: SubmissionRow | null): SubmissionRow | null {
  if (!row || row.deletedAt || row.status === SubmissionStatus.ASSIGNED) {
    return null;
  }
  return row;
}

async function upsertSubmissionRow(
  tx: Prisma.TransactionClient,
  assignmentId: string,
  studentId: string,
  data: { textAnswer: string | null; status: SubmissionStatus; submittedAt: Date | null },
): Promise<SubmissionRow> {
  return tx.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    create: { assignmentId, studentId, ...data },
    update: data,
  });
}

async function attachFiles(
  tx: Prisma.TransactionClient,
  submissionId: string,
  fileMetas: FileMeta[],
  uploadedById: string,
): Promise<void> {
  for (const fileMeta of fileMetas) {
    // No object storage is wired up yet - this records file metadata only.
    const file = await tx.file.create({
      data: {
        storagePath: `metadata-only/${randomUUID()}/${fileMeta.fileName}`,
        fileName: fileMeta.fileName,
        mimeType: fileMeta.mimeType || "application/octet-stream",
        size: fileMeta.size,
        uploadedById,
      },
    });

    await tx.fileAttachment.create({
      data: {
        fileId: file.id,
        attachmentType: FileAttachmentType.SUBMISSION,
        entityId: submissionId,
      },
    });
  }
}

function toSubmissionView(
  submission: SubmissionRow | null,
  assignment: AssignmentContext,
  attachments: { id: string; fileName: string }[],
): SubmissionView {
  if (!submission) {
    return { submission: null, canEdit: true, canUnsubmit: false };
  }

  const canEdit = submission.status === SubmissionStatus.ASSIGNED;
  const dueDatePassed = assignment.dueDate !== null && new Date() > assignment.dueDate;
  const canUnsubmit =
    submission.status === SubmissionStatus.SUBMITTED &&
    assignment.status !== AssignmentStatus.CLOSED &&
    !dueDatePassed;

  // Grading is invisible to the student until the teacher actually returns
  // the work - the columns may already hold a value while REVIEWED (grading
  // in progress), but that must never leak to the student early.
  const isReturned = submission.status === SubmissionStatus.RETURNED;

  return {
    submission: {
      id: submission.id,
      textAnswer: submission.textAnswer,
      status: submission.status,
      submittedAt: submission.submittedAt,
      updatedAt: submission.updatedAt,
      returnedAt: submission.returnedAt,
      grade: isReturned ? submission.grade : null,
      feedback: isReturned ? submission.feedback : null,
      gradedAt: isReturned ? submission.gradedAt : null,
      attachments,
    },
    canEdit,
    canUnsubmit,
  };
}

export async function getSubmissionForStudent(
  assignmentId: string,
  user: SessionUser,
): Promise<SubmissionView> {
  const assignment = await loadAssignmentContext(assignmentId);
  await assertStudentEligibility(assignment.classroomId, user);

  const submission = await findSubmissionByAssignmentAndStudent(assignmentId, user.id);

  if (!submission || submission.deletedAt) {
    return toSubmissionView(null, assignment, []);
  }

  const attachmentsBySubmissionId = await getFileAttachmentsByEntityIds(
    [submission.id],
    FileAttachmentType.SUBMISSION,
  );

  return toSubmissionView(
    submission,
    assignment,
    attachmentsBySubmissionId.get(submission.id) ?? [],
  );
}

/** Shared upsert used by both the draft-save and submit flows. */
export async function createOrUpdateSubmission(
  assignmentId: string,
  user: SessionUser,
  input: SubmissionInput,
  fileMetas: FileMeta[],
): Promise<SubmissionView> {
  const assignment = await loadAssignmentContext(assignmentId);
  await assertStudentEligibility(assignment.classroomId, user);
  assertAssignmentAcceptsWork(assignment);

  const existing = await findSubmissionByAssignmentAndStudent(assignmentId, user.id);

  if (existing && existing.status !== SubmissionStatus.ASSIGNED) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "Unsubmit your work before making changes.",
    );
  }

  const submission = await prisma.$transaction(async (tx) => {
    const row = await upsertSubmissionRow(tx, assignmentId, user.id, {
      textAnswer: input.textAnswer ?? null,
      status: SubmissionStatus.ASSIGNED,
      submittedAt: null,
    });

    await attachFiles(tx, row.id, fileMetas, user.id);

    return row;
  });

  const attachmentsBySubmissionId = await getFileAttachmentsByEntityIds(
    [submission.id],
    FileAttachmentType.SUBMISSION,
  );
  return toSubmissionView(
    submission,
    assignment,
    attachmentsBySubmissionId.get(submission.id) ?? [],
  );
}

export async function submitSubmission(
  assignmentId: string,
  user: SessionUser,
  input: SubmissionInput,
  fileMetas: FileMeta[],
): Promise<SubmissionView> {
  const assignment = await loadAssignmentContext(assignmentId);
  await assertStudentEligibility(assignment.classroomId, user);
  assertAssignmentAcceptsWork(assignment);

  const existing = await findSubmissionByAssignmentAndStudent(assignmentId, user.id);

  if (existing && existing.status !== SubmissionStatus.ASSIGNED) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "This assignment has already been turned in.",
    );
  }

  const now = new Date();
  const isLate = assignment.dueDate !== null && now > assignment.dueDate;

  if (isLate && !assignment.allowLateSubmission) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "This assignment does not accept late submissions.",
    );
  }

  const nextStatus = isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED;

  const submission = await prisma.$transaction(async (tx) => {
    const row = await upsertSubmissionRow(tx, assignmentId, user.id, {
      textAnswer: input.textAnswer ?? null,
      status: nextStatus,
      submittedAt: now,
    });

    await attachFiles(tx, row.id, fileMetas, user.id);

    return row;
  });

  const attachmentsBySubmissionId = await getFileAttachmentsByEntityIds(
    [submission.id],
    FileAttachmentType.SUBMISSION,
  );
  return toSubmissionView(
    submission,
    assignment,
    attachmentsBySubmissionId.get(submission.id) ?? [],
  );
}

export async function unsubmitSubmission(
  assignmentId: string,
  user: SessionUser,
): Promise<SubmissionView> {
  const assignment = await loadAssignmentContext(assignmentId);
  await assertStudentEligibility(assignment.classroomId, user);
  assertClassroomActive(
    assignment.classroom,
    "This class is archived and submissions can no longer be changed.",
  );

  const existing = await findSubmissionByAssignmentAndStudent(assignmentId, user.id);

  if (!existing || existing.status !== SubmissionStatus.SUBMITTED) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "Only a submitted assignment can be unsubmitted.",
    );
  }

  if (assignment.status === AssignmentStatus.CLOSED) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "This assignment has been closed by your teacher and can no longer be unsubmitted.",
    );
  }

  if (assignment.dueDate !== null && new Date() > assignment.dueDate) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "The due date has passed - this assignment can no longer be unsubmitted.",
    );
  }

  const submission = await prisma.submission.update({
    where: { id: existing.id },
    data: { status: SubmissionStatus.ASSIGNED, submittedAt: null },
  });

  const attachmentsBySubmissionId = await getFileAttachmentsByEntityIds(
    [submission.id],
    FileAttachmentType.SUBMISSION,
  );
  return toSubmissionView(
    submission,
    assignment,
    attachmentsBySubmissionId.get(submission.id) ?? [],
  );
}

export async function removeSubmissionAttachment(
  submissionId: string,
  fileAttachmentId: string,
  user: SessionUser,
): Promise<void> {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });

  if (!submission || submission.deletedAt) {
    throw new ClassroomServiceError("NOT_FOUND", "Submission not found.");
  }

  if (submission.studentId !== user.id) {
    throw new ClassroomServiceError("FORBIDDEN", "You can only edit your own submission.");
  }

  if (submission.status !== SubmissionStatus.ASSIGNED) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "Unsubmit your work before removing an attachment.",
    );
  }

  const attachment = await prisma.fileAttachment.findUnique({
    where: { id: fileAttachmentId },
  });

  if (
    !attachment ||
    attachment.attachmentType !== FileAttachmentType.SUBMISSION ||
    attachment.entityId !== submissionId
  ) {
    throw new ClassroomServiceError("NOT_FOUND", "Attachment not found.");
  }

  await prisma.fileAttachment.delete({ where: { id: fileAttachmentId } });
}

// ---------------------------------------------------------------------------
// Teacher review workflow (Phase 9.2) - everything below is manager-only,
// scoped to the specific classroom the assignment belongs to.
// ---------------------------------------------------------------------------

/** Confirms the assignment exists, isn't deleted, and actually belongs to this classroom. */
async function assertAssignmentInClassroom(
  classroomId: string,
  assignmentId: string,
): Promise<void> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { classroomId: true, deletedAt: true },
  });

  if (!assignment || assignment.deletedAt || assignment.classroomId !== classroomId) {
    throw new ClassroomServiceError("NOT_FOUND", "Assignment not found.");
  }
}

type ManagedAssignment = {
  id: string;
  classroomId: string;
  title: string;
  status: AssignmentStatus;
  dueDate: Date | null;
  points: number | null;
};

/**
 * The manager-only counterpart to assertAssignmentInClassroom - asserts
 * management access to classroomId first (cheap, no assignment row needed),
 * then loads the fields grading/review functions need (status, dueDate,
 * points) so they don't each issue their own follow-up query.
 */
async function loadAssignmentForManager(
  classroomId: string,
  assignmentId: string,
  user: SessionUser,
): Promise<ManagedAssignment> {
  await assertManagementAccess(classroomId, user);

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      classroomId: true,
      title: true,
      status: true,
      dueDate: true,
      points: true,
      deletedAt: true,
    },
  });

  if (!assignment || assignment.deletedAt || assignment.classroomId !== classroomId) {
    throw new ClassroomServiceError("NOT_FOUND", "Assignment not found.");
  }

  return assignment;
}

function toDisplayName(user: { image: string | null; avatarUrl: string | null }): string | null {
  return user.image ?? user.avatarUrl ?? null;
}

export async function getAssignmentSubmissions(
  classroomId: string,
  assignmentId: string,
  user: SessionUser,
): Promise<SubmissionOverview> {
  // Per-classroom check (not just "is a teacher somewhere") - a teacher who
  // doesn't manage this specific classroom gets FORBIDDEN, full stop.
  const assignment = await loadAssignmentForManager(classroomId, assignmentId, user);

  const members = await prisma.classroomMembership.findMany({
    where: {
      classroomId,
      status: ClassroomMembershipStatus.ACTIVE,
      role: ClassroomMembershipRole.STUDENT,
    },
    include: { user: { select: { id: true, name: true, image: true, avatarUrl: true } } },
    orderBy: { user: { name: "asc" } },
  });

  const submissions = await prisma.submission.findMany({
    where: {
      assignmentId,
      deletedAt: null,
      studentId: { in: members.map((member) => member.userId) },
    },
  });
  const submissionByStudentId = new Map(submissions.map((row) => [row.studentId, row]));

  const rows = members.map((member) => {
    // A draft-in-progress (ASSIGNED) submission is invisible to the teacher -
    // it reads exactly like the student never started, by design.
    const submission = toTeacherVisibleSubmission(submissionByStudentId.get(member.userId) ?? null);
    // REVIEWED collapses the original on-time/late distinction into one enum
    // value - recompute it from submittedAt vs. the due date for display.
    const wasLate = Boolean(
      submission?.submittedAt && assignment.dueDate && submission.submittedAt > assignment.dueDate,
    );
    return {
      studentId: member.userId,
      studentName: member.user.name,
      studentImage: toDisplayName(member.user),
      displayStatus: toDisplayStatus(submission?.status ?? null, { wasLate }),
      submittedAt: submission?.submittedAt ?? null,
      updatedAt: submission?.updatedAt ?? null,
      grade: submission?.grade ?? null,
      hasSubmission: submission !== null,
    };
  });

  const overview: SubmissionOverview = {
    totalStudents: rows.length,
    submitted: 0,
    notSubmitted: 0,
    late: 0,
    returned: 0,
    rows,
  };

  for (const row of rows) {
    if (row.displayStatus === "SUBMITTED") overview.submitted += 1;
    else if (row.displayStatus === "NOT_SUBMITTED") overview.notSubmitted += 1;
    else if (row.displayStatus === "LATE") overview.late += 1;
    else if (row.displayStatus === "RETURNED") overview.returned += 1;
  }

  return overview;
}

async function assertActiveStudentOfClassroom(
  classroomId: string,
  studentId: string,
): Promise<void> {
  const membership = await prisma.classroomMembership.findUnique({
    where: { classroomId_userId: { classroomId, userId: studentId } },
  });

  if (
    !membership ||
    membership.status !== ClassroomMembershipStatus.ACTIVE ||
    canManageClassroom(membership.role)
  ) {
    throw new ClassroomServiceError("NOT_FOUND", "Student not found in this classroom.");
  }
}

async function listPrivateComments(
  submissionId: string,
  viewerId: string,
  studentId: string,
): Promise<PrivateCommentSummary[]> {
  const comments = await prisma.comment.findMany({
    where: { submissionId, deletedAt: null, visibility: CommentVisibility.PRIVATE },
    include: { author: { select: { id: true, name: true, image: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Only the owning student or a classroom manager can ever author a private
  // comment on this submission (enforced in createPrivateComment) - so any
  // author who isn't the student is necessarily a teacher. No extra query needed.
  return comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: {
      id: comment.author.id,
      name: comment.author.name,
      image: toDisplayName(comment.author),
      isTeacher: comment.authorId !== studentId,
    },
    canDelete: comment.authorId === viewerId,
  }));
}

export async function getSubmissionDetails(
  classroomId: string,
  assignmentId: string,
  studentId: string,
  user: SessionUser,
): Promise<SubmissionReviewDetail> {
  const assignment = await loadAssignmentForManager(classroomId, assignmentId, user);
  await assertActiveStudentOfClassroom(classroomId, studentId);

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, image: true, avatarUrl: true },
  });

  if (!student) {
    throw new ClassroomServiceError("NOT_FOUND", "Student not found in this classroom.");
  }

  const submission = toTeacherVisibleSubmission(
    await findSubmissionByAssignmentAndStudent(assignmentId, studentId),
  );

  const [attachmentsBySubmissionId, comments] = await Promise.all([
    submission
      ? getFileAttachmentsByEntityIds([submission.id], FileAttachmentType.SUBMISSION)
      : Promise.resolve(new Map<string, AttachedFileSummary[]>()),
    submission ? listPrivateComments(submission.id, user.id, studentId) : Promise.resolve([]),
  ]);

  const canReturn =
    submission !== null &&
    (submission.status === SubmissionStatus.SUBMITTED ||
      submission.status === SubmissionStatus.LATE ||
      submission.status === SubmissionStatus.REVIEWED);

  return {
    student: { id: student.id, name: student.name, image: toDisplayName(student) },
    submission: submission
      ? {
          id: submission.id,
          textAnswer: submission.textAnswer,
          status: submission.status,
          submittedAt: submission.submittedAt,
          updatedAt: submission.updatedAt,
          returnedAt: submission.returnedAt,
          grade: submission.grade,
          feedback: submission.feedback,
          gradedAt: submission.gradedAt,
          attachments: attachmentsBySubmissionId.get(submission.id) ?? [],
        }
      : null,
    canReturn,
    canGrade:
      submission !== null &&
      submission.status !== SubmissionStatus.RETURNED &&
      assignment.points !== null,
    comments,
  };
}

export async function getOwnSubmissionComments(
  assignmentId: string,
  user: SessionUser,
): Promise<PrivateCommentSummary[]> {
  const assignment = await loadAssignmentContext(assignmentId);
  await assertStudentEligibility(assignment.classroomId, user);

  const submission = await findSubmissionByAssignmentAndStudent(assignmentId, user.id);

  if (!submission || submission.deletedAt) {
    return [];
  }

  return listPrivateComments(submission.id, user.id, user.id);
}

export async function createPrivateComment(
  classroomId: string,
  assignmentId: string,
  studentId: string,
  user: SessionUser,
  content: string,
): Promise<PrivateCommentSummary> {
  await assertAssignmentInClassroom(classroomId, assignmentId);

  const isOwner = user.id === studentId;
  if (isOwner) {
    await assertStudentEligibility(classroomId, user);
  } else {
    await assertManagementAccess(classroomId, user);
    await assertActiveStudentOfClassroom(classroomId, studentId);
  }

  const rawSubmission = await findSubmissionByAssignmentAndStudent(assignmentId, studentId);
  // A teacher can't comment on (or thereby detect) a draft-in-progress - only
  // the owning student can interact with their own submission at that stage.
  const submission = isOwner
    ? rawSubmission && !rawSubmission.deletedAt
      ? rawSubmission
      : null
    : toTeacherVisibleSubmission(rawSubmission);

  if (!submission) {
    throw new ClassroomServiceError("VALIDATION_ERROR", "There's no submission to comment on yet.");
  }

  const created = await prisma.comment.create({
    data: {
      submissionId: submission.id,
      authorId: user.id,
      content,
      visibility: CommentVisibility.PRIVATE,
    },
    include: { author: { select: { id: true, name: true, image: true, avatarUrl: true } } },
  });

  return {
    id: created.id,
    content: created.content,
    createdAt: created.createdAt,
    author: {
      id: created.author.id,
      name: created.author.name,
      image: toDisplayName(created.author),
      isTeacher: created.authorId !== studentId,
    },
    canDelete: true,
  };
}

export async function deletePrivateComment(commentId: string, user: SessionUser): Promise<void> {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });

  if (!comment || comment.deletedAt || !comment.submissionId) {
    throw new ClassroomServiceError("NOT_FOUND", "Comment not found.");
  }

  // Deletion is author-only in this phase - even a teacher can't remove a
  // student's private comment (or another teacher's), only their own.
  if (comment.authorId !== user.id) {
    throw new ClassroomServiceError("FORBIDDEN", "You can only delete your own comments.");
  }

  await prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
}

/**
 * Returns a submission to the student - whether or not it's been graded.
 * A grade already set (status REVIEWED) gets locked and timestamped here,
 * not when it was first assigned - matching Google Classroom, where a grade
 * stays private and editable until the teacher explicitly returns it.
 */
export async function returnSubmission(
  classroomId: string,
  assignmentId: string,
  studentId: string,
  user: SessionUser,
): Promise<SubmissionReviewDetail> {
  const assignment = await loadAssignmentForManager(classroomId, assignmentId, user);
  await assertActiveStudentOfClassroom(classroomId, studentId);

  const submission = await findSubmissionByAssignmentAndStudent(assignmentId, studentId);

  if (!submission || submission.deletedAt) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "This student hasn't submitted anything yet.",
    );
  }

  if (submission.status === SubmissionStatus.RETURNED) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "This submission has already been returned.",
    );
  }

  if (
    submission.status !== SubmissionStatus.SUBMITTED &&
    submission.status !== SubmissionStatus.LATE &&
    submission.status !== SubmissionStatus.REVIEWED
  ) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "Only a turned-in submission can be returned.",
    );
  }

  const now = new Date();
  const isGraded = submission.grade !== null;
  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: SubmissionStatus.RETURNED,
      returnedAt: now,
      gradedAt: isGraded ? now : null,
    },
  });

  await notifySubmissionReturned({
    studentId,
    classroomId,
    assignmentId,
    assignmentTitle: assignment.title,
    isGraded,
  });

  return getSubmissionDetails(classroomId, assignmentId, studentId, user);
}

/** Shared upsert used by both the initial grade-entry and edit-before-return flows. */
export async function setSubmissionGrade(
  classroomId: string,
  assignmentId: string,
  studentId: string,
  user: SessionUser,
  input: GradeInput,
): Promise<SubmissionReviewDetail> {
  const assignment = await loadAssignmentForManager(classroomId, assignmentId, user);
  await assertActiveStudentOfClassroom(classroomId, studentId);

  if (assignment.status === AssignmentStatus.DRAFT) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "This assignment hasn't been published yet.",
    );
  }

  if (assignment.points === null) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "This assignment has no maximum points set, so it can't be graded.",
    );
  }

  if (input.grade < 0) {
    throw new ClassroomServiceError("VALIDATION_ERROR", "Grade cannot be negative.");
  }

  if (input.grade > assignment.points) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      `Grade cannot exceed the maximum of ${assignment.points} points.`,
    );
  }

  const submission = toTeacherVisibleSubmission(
    await findSubmissionByAssignmentAndStudent(assignmentId, studentId),
  );

  if (!submission) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "This student hasn't submitted anything yet.",
    );
  }

  if (submission.status === SubmissionStatus.RETURNED) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "This submission has already been returned - the grade is locked.",
    );
  }

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      grade: input.grade,
      feedback: input.feedback ?? null,
      status: SubmissionStatus.REVIEWED,
    },
  });

  return getSubmissionDetails(classroomId, assignmentId, studentId, user);
}

export async function getAssignmentGradeSummary(
  classroomId: string,
  assignmentId: string,
  user: SessionUser,
): Promise<GradeSummary> {
  await loadAssignmentForManager(classroomId, assignmentId, user);

  const [aggregate, pendingCount, returnedCount] = await Promise.all([
    prisma.submission.aggregate({
      where: { assignmentId, deletedAt: null, grade: { not: null } },
      _avg: { grade: true },
      _max: { grade: true },
      _min: { grade: true },
      _count: { grade: true },
    }),
    prisma.submission.count({
      where: {
        assignmentId,
        deletedAt: null,
        status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE] },
      },
    }),
    prisma.submission.count({
      where: { assignmentId, deletedAt: null, status: SubmissionStatus.RETURNED },
    }),
  ]);

  return {
    gradedCount: aggregate._count.grade,
    pendingCount,
    returnedCount,
    averageGrade: aggregate._avg.grade,
    highestGrade: aggregate._max.grade,
    lowestGrade: aggregate._min.grade,
  };
}
