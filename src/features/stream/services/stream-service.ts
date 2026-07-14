import type { SessionUser } from "@/auth/session";
import {
  assertManagementAccess,
  assertMembership,
  hasManagementAccess,
} from "@/features/classroom/services/classroom-service";
import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { notifyAnnouncementPublished } from "@/features/notifications/services/notification-generator";
import { recordAuditEvent } from "@/lib/audit-log";
import { getFileAttachmentsByEntityIds } from "@/lib/file-attachments";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  ActivityAction,
  AnnouncementStatus,
  ClassroomStatus,
  CommentVisibility,
  FileAttachmentType,
} from "@/generated/prisma/enums";

import type { AnnouncementAttachmentSummary, AnnouncementSummary, CommentSummary } from "../types";

// An announcement is considered "edited" if it was updated meaningfully after
// creation - a small threshold avoids flagging clock-precision no-ops as edits.
const EDITED_THRESHOLD_MS = 60_000;
const MAX_TITLE_LENGTH = 120;

function announcementWithRelationsInclude() {
  return {
    author: { select: { name: true, image: true, avatarUrl: true } },
    comments: {
      where: { deletedAt: null },
      include: { author: { select: { id: true, name: true, image: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    },
  } as const;
}

async function createAnnouncementRecord(data: Prisma.AnnouncementCreateArgs["data"]) {
  return prisma.announcement.create({ data, include: announcementWithRelationsInclude() });
}

type AnnouncementWithRelations = Awaited<ReturnType<typeof createAnnouncementRecord>>;
type CommentWithAuthor = AnnouncementWithRelations["comments"][number];

function toCommentSummary(
  comment: CommentWithAuthor,
  viewerId: string,
  canModerate: boolean,
): CommentSummary {
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: {
      id: comment.author.id,
      name: comment.author.name,
      image: comment.author.image ?? comment.author.avatarUrl ?? null,
    },
    canDelete: canModerate || comment.authorId === viewerId,
  };
}

function toAnnouncementSummary(
  announcement: AnnouncementWithRelations,
  attachments: AnnouncementAttachmentSummary[],
  viewerId: string,
  canModerate: boolean,
): AnnouncementSummary {
  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    createdAt: announcement.createdAt,
    isEdited:
      announcement.updatedAt.getTime() - announcement.createdAt.getTime() > EDITED_THRESHOLD_MS,
    isPinned: announcement.isPinned,
    author: {
      name: announcement.author.name,
      image: announcement.author.image ?? announcement.author.avatarUrl ?? null,
    },
    comments: announcement.comments.map((comment) =>
      toCommentSummary(comment, viewerId, canModerate),
    ),
    attachments,
    canManage: canModerate,
  };
}

async function findActiveAnnouncementOrThrow(announcementId: string) {
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });

  if (
    !announcement ||
    announcement.deletedAt ||
    announcement.status !== AnnouncementStatus.PUBLISHED
  ) {
    throw new ClassroomServiceError("NOT_FOUND", "Announcement not found.");
  }

  return announcement;
}

// Announcement.title is required by the schema but the composer only collects a
// body - derive a short title from the content so no fake/placeholder text is stored.
function deriveTitleFromContent(content: string): string {
  const trimmed = content.trim();

  if (trimmed.length <= MAX_TITLE_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, MAX_TITLE_LENGTH - 3)}...`;
}

export async function listClassroomAnnouncements(
  classroomId: string,
  viewer: SessionUser,
): Promise<AnnouncementSummary[]> {
  const [announcements, canModerate] = await Promise.all([
    prisma.announcement.findMany({
      where: {
        classroomId,
        status: AnnouncementStatus.PUBLISHED,
        deletedAt: null,
      },
      include: announcementWithRelationsInclude(),
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
    hasManagementAccess(classroomId, viewer),
  ]);

  if (announcements.length === 0) {
    return [];
  }

  const attachmentsByAnnouncementId = await getFileAttachmentsByEntityIds(
    announcements.map((announcement) => announcement.id),
    FileAttachmentType.ANNOUNCEMENT,
  );

  return announcements.map((announcement) =>
    toAnnouncementSummary(
      announcement,
      attachmentsByAnnouncementId.get(announcement.id) ?? [],
      viewer.id,
      canModerate,
    ),
  );
}

export async function createAnnouncement(
  classroomId: string,
  user: SessionUser,
  content: string,
): Promise<AnnouncementSummary> {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });

  if (!classroom || classroom.status === ClassroomStatus.DELETED) {
    throw new ClassroomServiceError("NOT_FOUND", "Classroom not found.");
  }

  if (classroom.status === ClassroomStatus.ARCHIVED) {
    throw new ClassroomServiceError(
      "ARCHIVED",
      "This class is archived and can't accept new announcements.",
    );
  }

  // Per-classroom check (not just a global role check) - a TEACHER who doesn't
  // teach this specific classroom can't post to it.
  await assertManagementAccess(classroomId, user);

  const created = await createAnnouncementRecord({
    classroomId,
    authorId: user.id,
    title: deriveTitleFromContent(content),
    content,
    status: AnnouncementStatus.PUBLISHED,
  });

  await notifyAnnouncementPublished({
    classroomId,
    classroomTitle: classroom.title,
    authorId: user.id,
    announcementContent: content,
  });

  return toAnnouncementSummary(created, [], user.id, true);
}

export async function updateAnnouncement(
  announcementId: string,
  user: SessionUser,
  content: string,
): Promise<AnnouncementSummary> {
  const existing = await findActiveAnnouncementOrThrow(announcementId);
  await assertManagementAccess(existing.classroomId, user);

  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      content,
      title: deriveTitleFromContent(content),
    },
    include: announcementWithRelationsInclude(),
  });

  const attachmentsByAnnouncementId = await getFileAttachmentsByEntityIds(
    [announcementId],
    FileAttachmentType.ANNOUNCEMENT,
  );
  return toAnnouncementSummary(
    updated,
    attachmentsByAnnouncementId.get(announcementId) ?? [],
    user.id,
    true,
  );
}

export async function deleteAnnouncement(announcementId: string, user: SessionUser): Promise<void> {
  const existing = await findActiveAnnouncementOrThrow(announcementId);
  await assertManagementAccess(existing.classroomId, user);

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { deletedAt: new Date() },
  });

  await recordAuditEvent({
    actorId: user.id,
    action: ActivityAction.DELETED,
    entityType: "Announcement",
    entityId: announcementId,
    targetLabel: existing.title,
    classroomId: existing.classroomId,
  });
}

export async function setAnnouncementPinned(
  announcementId: string,
  user: SessionUser,
  pinned: boolean,
): Promise<AnnouncementSummary> {
  const existing = await findActiveAnnouncementOrThrow(announcementId);
  await assertManagementAccess(existing.classroomId, user);

  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: { isPinned: pinned },
    include: announcementWithRelationsInclude(),
  });

  const attachmentsByAnnouncementId = await getFileAttachmentsByEntityIds(
    [announcementId],
    FileAttachmentType.ANNOUNCEMENT,
  );
  return toAnnouncementSummary(
    updated,
    attachmentsByAnnouncementId.get(announcementId) ?? [],
    user.id,
    true,
  );
}

export async function createComment(
  announcementId: string,
  user: SessionUser,
  content: string,
): Promise<CommentSummary> {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    include: { classroom: { include: { settings: true } } },
  });

  if (
    !announcement ||
    announcement.deletedAt ||
    announcement.status !== AnnouncementStatus.PUBLISHED
  ) {
    throw new ClassroomServiceError("NOT_FOUND", "Announcement not found.");
  }

  if (announcement.classroom.status !== ClassroomStatus.ACTIVE) {
    throw new ClassroomServiceError(
      "ARCHIVED",
      "This class is archived and can't accept new comments.",
    );
  }

  // Any active member (any role) may comment - unlike posting an announcement,
  // this doesn't require management rights.
  await assertMembership(announcement.classroomId, user);

  if (announcement.classroom.settings && !announcement.classroom.settings.allowComments) {
    throw new ClassroomServiceError("FORBIDDEN", "Comments are turned off for this class.");
  }

  const created = await prisma.comment.create({
    data: {
      announcementId,
      authorId: user.id,
      content,
      visibility: CommentVisibility.PUBLIC,
    },
    include: { author: { select: { id: true, name: true, image: true, avatarUrl: true } } },
  });

  const canModerate = await hasManagementAccess(announcement.classroomId, user);
  return toCommentSummary(created, user.id, canModerate);
}

export async function deleteComment(commentId: string, user: SessionUser): Promise<void> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { announcement: { select: { classroomId: true } } },
  });

  if (!comment || comment.deletedAt || !comment.announcement) {
    throw new ClassroomServiceError("NOT_FOUND", "Comment not found.");
  }

  const isOwnComment = comment.authorId === user.id;
  const canModerate = await hasManagementAccess(comment.announcement.classroomId, user);

  if (!isOwnComment && !canModerate) {
    throw new ClassroomServiceError(
      "FORBIDDEN",
      "You do not have permission to delete this comment.",
    );
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });
}
