import type { SessionUser } from "@/auth/session";
import { assertManagementAccess } from "@/features/classroom/services/classroom-service";
import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { AnnouncementStatus, ClassroomStatus, FileAttachmentType } from "@/generated/prisma/enums";

import type { AnnouncementAttachmentSummary, AnnouncementSummary } from "../types";

// An announcement is considered "edited" if it was updated meaningfully after
// creation - a small threshold avoids flagging clock-precision no-ops as edits.
const EDITED_THRESHOLD_MS = 60_000;
const MAX_TITLE_LENGTH = 120;

function announcementWithAuthorInclude() {
  return {
    author: { select: { name: true, image: true, avatarUrl: true } },
    _count: { select: { comments: true } },
  } as const;
}

async function createAnnouncementRecord(data: Prisma.AnnouncementCreateArgs["data"]) {
  return prisma.announcement.create({ data, include: announcementWithAuthorInclude() });
}

type AnnouncementWithAuthor = Awaited<ReturnType<typeof createAnnouncementRecord>>;

function toAnnouncementSummary(
  announcement: AnnouncementWithAuthor,
  attachments: AnnouncementAttachmentSummary[],
): AnnouncementSummary {
  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    createdAt: announcement.createdAt,
    isEdited:
      announcement.updatedAt.getTime() - announcement.createdAt.getTime() > EDITED_THRESHOLD_MS,
    author: {
      name: announcement.author.name,
      image: announcement.author.image ?? announcement.author.avatarUrl ?? null,
    },
    commentCount: announcement._count.comments,
    attachments,
  };
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
): Promise<AnnouncementSummary[]> {
  const announcements = await prisma.announcement.findMany({
    where: {
      classroomId,
      status: AnnouncementStatus.PUBLISHED,
      deletedAt: null,
    },
    include: announcementWithAuthorInclude(),
    orderBy: { createdAt: "desc" },
  });

  if (announcements.length === 0) {
    return [];
  }

  const attachmentsByAnnouncementId = await getAttachmentsByAnnouncementId(
    announcements.map((announcement) => announcement.id),
  );

  return announcements.map((announcement) =>
    toAnnouncementSummary(announcement, attachmentsByAnnouncementId.get(announcement.id) ?? []),
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

  return toAnnouncementSummary(created, []);
}

// FileAttachment is polymorphic (attachmentType + entityId), so it isn't a typed
// Prisma relation on Announcement - fetched separately and grouped in memory.
async function getAttachmentsByAnnouncementId(
  announcementIds: string[],
): Promise<Map<string, AnnouncementAttachmentSummary[]>> {
  const attachments = await prisma.fileAttachment.findMany({
    where: {
      attachmentType: FileAttachmentType.ANNOUNCEMENT,
      entityId: { in: announcementIds },
    },
    include: { file: { select: { fileName: true } } },
  });

  const byAnnouncementId = new Map<string, AnnouncementAttachmentSummary[]>();

  for (const attachment of attachments) {
    const existing = byAnnouncementId.get(attachment.entityId) ?? [];
    existing.push({ id: attachment.id, fileName: attachment.file.fileName });
    byAnnouncementId.set(attachment.entityId, existing);
  }

  return byAnnouncementId;
}
