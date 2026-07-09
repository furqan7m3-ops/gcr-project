import { randomUUID } from "node:crypto";

import type { SessionUser } from "@/auth/session";
import { canManageClassroom } from "@/features/classroom/lib/can-manage";
import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { getFileAttachmentsByEntityIds } from "@/lib/file-attachments";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  AssignmentStatus,
  ClassroomMembershipStatus,
  ClassroomStatus,
  FileAttachmentType,
  SubmissionStatus,
  UserRole,
} from "@/generated/prisma/enums";

import type { SubmissionView } from "../types";

export interface FileMeta {
  fileName: string;
  mimeType: string;
  size: number;
}

export interface SubmissionInput {
  textAnswer?: string;
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
  if (assignment.classroom.status === ClassroomStatus.ARCHIVED) {
    throw new ClassroomServiceError(
      "ARCHIVED",
      "This class is archived and no longer accepts submissions.",
    );
  }

  if (assignment.status === AssignmentStatus.CLOSED) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "This assignment has been closed and no longer accepts submissions.",
    );
  }
}

async function findOwnSubmission(assignmentId: string, studentId: string) {
  return prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
  });
}

type SubmissionRow = NonNullable<Awaited<ReturnType<typeof findOwnSubmission>>>;

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

  return {
    submission: {
      id: submission.id,
      textAnswer: submission.textAnswer,
      status: submission.status,
      submittedAt: submission.submittedAt,
      updatedAt: submission.updatedAt,
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

  const submission = await findOwnSubmission(assignmentId, user.id);

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

  const existing = await findOwnSubmission(assignmentId, user.id);

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

  const existing = await findOwnSubmission(assignmentId, user.id);

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

  const existing = await findOwnSubmission(assignmentId, user.id);

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
