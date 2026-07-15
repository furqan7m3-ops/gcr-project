import { randomUUID } from "node:crypto";

import type { SessionUser } from "@/auth/session";
import {
  assertClassroomActive,
  assertManagementAccess,
  hasManagementAccess,
  loadActiveClassroom,
} from "@/features/classroom/services/classroom-service";
import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { notifyAssignmentPublished } from "@/features/notifications/services/notification-generator";
import { recordAuditEvent } from "@/lib/audit-log";
import { getFileAttachmentsByEntityIds, type AttachedFileSummary } from "@/lib/file-attachments";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  ActivityAction,
  AssignmentStatus,
  ClassroomStatus,
  FileAttachmentType,
} from "@/generated/prisma/enums";
import type { ScheduleAdapter, SchedulableRecord } from "@/lib/scheduling/types";

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
    scheduledFor: assignment.scheduledFor,
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
  // Includes the classroom title so publishAssignment doesn't need a second
  // round trip just to build its notification message - the other three
  // callers (update/close/delete) simply don't touch the extra field.
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { classroom: { select: { title: true, status: true } } },
  });

  if (!assignment || assignment.deletedAt) {
    throw new ClassroomServiceError("NOT_FOUND", "Assignment not found.");
  }

  return assignment;
}

export async function getAssignmentForUser(
  classroomId: string,
  assignmentId: string,
  viewer: SessionUser,
): Promise<AssignmentSummary> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: assignmentWithAuthorInclude(),
  });

  if (!assignment || assignment.deletedAt || assignment.classroomId !== classroomId) {
    throw new ClassroomServiceError("NOT_FOUND", "Assignment not found.");
  }

  const canManage = await hasManagementAccess(assignment.classroomId, viewer);

  // Drafts and scheduled assignments don't exist yet as far as students are
  // concerned - hide, don't forbid.
  if (
    !canManage &&
    (assignment.status === AssignmentStatus.DRAFT ||
      assignment.status === AssignmentStatus.SCHEDULED)
  ) {
    throw new ClassroomServiceError("NOT_FOUND", "Assignment not found.");
  }

  const attachmentsByAssignmentId = await getFileAttachmentsByEntityIds(
    [assignment.id],
    FileAttachmentType.ASSIGNMENT,
  );

  return toAssignmentSummary(
    assignment,
    attachmentsByAssignmentId.get(assignment.id) ?? [],
    canManage,
  );
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
  status:
    | typeof AssignmentStatus.DRAFT
    | typeof AssignmentStatus.SCHEDULED
    | typeof AssignmentStatus.PUBLISHED,
  fileMetas: FileMeta[],
  scheduledFor: Date | null = null,
): Promise<AssignmentSummary> {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });

  if (!classroom || classroom.status === ClassroomStatus.DELETED) {
    throw new ClassroomServiceError("NOT_FOUND", "Classroom not found.");
  }

  assertClassroomActive(classroom, "This class is archived and can't accept new assignments.");

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
        scheduledFor: status === AssignmentStatus.SCHEDULED ? scheduledFor : null,
        publishedAt: status === AssignmentStatus.PUBLISHED ? new Date() : null,
        publishedById: status === AssignmentStatus.PUBLISHED ? user.id : null,
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

  if (status === AssignmentStatus.PUBLISHED) {
    await notifyAssignmentPublished({
      classroomId,
      classroomTitle: classroom.title,
      authorId: user.id,
      assignmentId: created.id,
      assignmentTitle: created.title,
    });
  }

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
  assertClassroomActive(
    existing.classroom,
    "This class is archived and its content can't be edited.",
  );
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

// Publishing a draft/scheduled assignment immediately now goes through the
// shared scheduling engine's publishNow() + assignmentScheduleAdapter below,
// rather than a dedicated function here - see src/features/scheduling.

export async function closeAssignment(assignmentId: string, user: SessionUser): Promise<void> {
  const existing = await findActiveAssignmentOrThrow(assignmentId);
  assertClassroomActive(
    existing.classroom,
    "This class is archived and its assignments can't be closed.",
  );
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
  assertClassroomActive(
    existing.classroom,
    "This class is archived and its content can't be deleted.",
  );
  await assertManagementAccess(existing.classroomId, user);

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { deletedAt: new Date() },
  });

  await recordAuditEvent({
    actorId: user.id,
    action: ActivityAction.DELETED,
    entityType: "Assignment",
    entityId: assignmentId,
    targetLabel: existing.title,
    classroomId: existing.classroomId,
  });
}

interface SchedulableAssignment extends SchedulableRecord {
  title: string;
}

function toSchedulableAssignment(assignment: {
  id: string;
  classroomId: string;
  status: AssignmentStatus;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  title: string;
}): SchedulableAssignment {
  return {
    id: assignment.id,
    classroomId: assignment.classroomId,
    status: assignment.status,
    scheduledFor: assignment.scheduledFor,
    publishedAt: assignment.publishedAt,
    title: assignment.title,
  };
}

/** Bridges Assignment to the shared scheduling engine - see stream-service.ts's adapter for the counterpart. */
export const assignmentScheduleAdapter: ScheduleAdapter<SchedulableAssignment> = {
  contentType: "assignment",

  async findById(id) {
    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment || assignment.deletedAt) {
      return null;
    }
    return toSchedulableAssignment(assignment);
  },

  async findDueForPublishing(now) {
    const assignments = await prisma.assignment.findMany({
      where: {
        status: AssignmentStatus.SCHEDULED,
        scheduledFor: { lte: now },
        deletedAt: null,
      },
    });
    return assignments.map(toSchedulableAssignment);
  },

  async assertSchedulable(record) {
    // Closed assignments can never be (re-)scheduled - they're a terminal state.
    if (record.status === AssignmentStatus.CLOSED) {
      throw new ClassroomServiceError(
        "VALIDATION_ERROR",
        "Closed assignments can't be scheduled or published.",
      );
    }

    const classroom = await loadActiveClassroom(record.classroomId);
    assertClassroomActive(
      classroom,
      "This class is archived and its assignments can't be scheduled or published.",
    );
  },

  async updateSchedule(id, input) {
    await prisma.assignment.update({
      where: { id },
      data: {
        status: input.status === "SCHEDULED" ? AssignmentStatus.SCHEDULED : AssignmentStatus.DRAFT,
        scheduledFor: input.scheduledFor,
      },
    });
  },

  async publish(id, publishedById, publishedAt) {
    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        status: AssignmentStatus.PUBLISHED,
        scheduledFor: null,
        publishedAt,
        publishedById,
      },
    });
    return toSchedulableAssignment(updated);
  },

  async afterPublish(record) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: record.id },
      include: { classroom: { select: { title: true } } },
    });
    if (!assignment) {
      return;
    }
    await notifyAssignmentPublished({
      classroomId: assignment.classroomId,
      classroomTitle: assignment.classroom.title,
      authorId: assignment.authorId,
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
    });
  },
};
