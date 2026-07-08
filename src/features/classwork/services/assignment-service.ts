import { randomUUID } from "node:crypto";

import type { SessionUser } from "@/auth/session";
import {
  assertManagementAccess,
  hasManagementAccess,
} from "@/features/classroom/services/classroom-service";
import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { getFileAttachmentsByEntityIds, type AttachedFileSummary } from "@/lib/file-attachments";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { AssignmentStatus, ClassroomStatus, FileAttachmentType } from "@/generated/prisma/enums";

import { assertTopicBelongsToClassroom } from "./topic-service";
import type { AssignmentSummary } from "../types";
import type { FileMeta } from "./material-service";

export interface AssignmentInput {
  title: string;
  description?: string;
  dueDate?: string;
  points?: string;
  topicId?: string;
}

function assignmentWithAuthorInclude() {
  return { author: { select: { name: true } } } as const;
}

async function updateAssignmentRecord(assignmentId: string, data: Prisma.AssignmentUpdateInput) {
  return prisma.assignment.update({
    where: { id: assignmentId },
    data,
    include: assignmentWithAuthorInclude(),
  });
}

type AssignmentWithAuthor = Awaited<ReturnType<typeof updateAssignmentRecord>>;

function toAssignmentSummary(
  assignment: AssignmentWithAuthor,
  attachments: AttachedFileSummary[],
  canManage: boolean,
): AssignmentSummary {
  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    status: assignment.status,
    dueDate: assignment.dueDate,
    points: assignment.points,
    topicId: assignment.topicId,
    authorName: assignment.author.name,
    createdAt: assignment.createdAt,
    attachments,
    canManage,
  };
}

async function findActiveAssignmentOrThrow(assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });

  if (!assignment || assignment.deletedAt) {
    throw new ClassroomServiceError("NOT_FOUND", "Assignment not found.");
  }

  return assignment;
}

export async function listClassroomAssignments(
  classroomId: string,
  viewer: SessionUser,
): Promise<AssignmentSummary[]> {
  const canManage = await hasManagementAccess(classroomId, viewer);

  const assignments = await prisma.assignment.findMany({
    where: {
      classroomId,
      deletedAt: null,
      // Drafts are only visible to whoever can manage this classroom - students
      // never see an assignment before it's published, matching Google Classroom.
      ...(canManage
        ? {}
        : { status: { in: [AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED] } }),
    },
    include: assignmentWithAuthorInclude(),
    orderBy: { createdAt: "desc" },
  });

  if (assignments.length === 0) {
    return [];
  }

  const attachmentsByAssignmentId = await getFileAttachmentsByEntityIds(
    assignments.map((assignment) => assignment.id),
    FileAttachmentType.ASSIGNMENT,
  );

  return assignments.map((assignment) =>
    toAssignmentSummary(assignment, attachmentsByAssignmentId.get(assignment.id) ?? [], canManage),
  );
}

export async function createAssignment(
  classroomId: string,
  user: SessionUser,
  input: AssignmentInput,
  status: typeof AssignmentStatus.DRAFT | typeof AssignmentStatus.PUBLISHED,
  fileMetas: FileMeta[],
): Promise<AssignmentSummary> {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });

  if (!classroom || classroom.status === ClassroomStatus.DELETED) {
    throw new ClassroomServiceError("NOT_FOUND", "Classroom not found.");
  }

  if (classroom.status === ClassroomStatus.ARCHIVED) {
    throw new ClassroomServiceError(
      "ARCHIVED",
      "This class is archived and can't accept new assignments.",
    );
  }

  await assertManagementAccess(classroomId, user);

  if (input.topicId) {
    await assertTopicBelongsToClassroom(input.topicId, classroomId);
  }

  const created = await prisma.$transaction(async (tx) => {
    const assignment = await tx.assignment.create({
      data: {
        classroomId,
        topicId: input.topicId ?? null,
        authorId: user.id,
        title: input.title,
        description: input.description ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        points: input.points ? Number(input.points) : null,
        status,
      },
      include: assignmentWithAuthorInclude(),
    });

    for (const fileMeta of fileMetas) {
      // No object storage is wired up yet - this records file metadata only.
      const file = await tx.file.create({
        data: {
          storagePath: `metadata-only/${randomUUID()}/${fileMeta.fileName}`,
          fileName: fileMeta.fileName,
          mimeType: fileMeta.mimeType || "application/octet-stream",
          size: fileMeta.size,
          uploadedById: user.id,
        },
      });

      await tx.fileAttachment.create({
        data: {
          fileId: file.id,
          attachmentType: FileAttachmentType.ASSIGNMENT,
          entityId: assignment.id,
        },
      });
    }

    return assignment;
  });

  const attachmentsByAssignmentId = await getFileAttachmentsByEntityIds(
    [created.id],
    FileAttachmentType.ASSIGNMENT,
  );
  return toAssignmentSummary(created, attachmentsByAssignmentId.get(created.id) ?? [], true);
}

export async function updateAssignment(
  assignmentId: string,
  user: SessionUser,
  input: AssignmentInput,
): Promise<AssignmentSummary> {
  const existing = await findActiveAssignmentOrThrow(assignmentId);
  await assertManagementAccess(existing.classroomId, user);

  if (input.topicId) {
    await assertTopicBelongsToClassroom(input.topicId, existing.classroomId);
  }

  const updated = await updateAssignmentRecord(assignmentId, {
    title: input.title,
    description: input.description ?? null,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    points: input.points ? Number(input.points) : null,
    topic: input.topicId ? { connect: { id: input.topicId } } : { disconnect: true },
  });

  const attachmentsByAssignmentId = await getFileAttachmentsByEntityIds(
    [assignmentId],
    FileAttachmentType.ASSIGNMENT,
  );
  return toAssignmentSummary(updated, attachmentsByAssignmentId.get(assignmentId) ?? [], true);
}

export async function publishAssignment(assignmentId: string, user: SessionUser): Promise<void> {
  const existing = await findActiveAssignmentOrThrow(assignmentId);
  await assertManagementAccess(existing.classroomId, user);

  if (existing.status !== AssignmentStatus.DRAFT) {
    throw new ClassroomServiceError("VALIDATION_ERROR", "Only draft assignments can be published.");
  }

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: AssignmentStatus.PUBLISHED },
  });
}

export async function closeAssignment(assignmentId: string, user: SessionUser): Promise<void> {
  const existing = await findActiveAssignmentOrThrow(assignmentId);
  await assertManagementAccess(existing.classroomId, user);

  if (existing.status !== AssignmentStatus.PUBLISHED) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "Only published assignments can be closed.",
    );
  }

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: AssignmentStatus.CLOSED },
  });
}

export async function deleteAssignment(assignmentId: string, user: SessionUser): Promise<void> {
  const existing = await findActiveAssignmentOrThrow(assignmentId);
  await assertManagementAccess(existing.classroomId, user);

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { deletedAt: new Date() },
  });
}
