import { prisma } from "@/lib/prisma";
import { AnnouncementStatus, FileAttachmentType } from "@/generated/prisma/enums";

import type { AnnouncementAttachmentSummary, AnnouncementSummary } from "../types";

// An announcement is considered "edited" if it was updated meaningfully after
// creation - a small threshold avoids flagging clock-precision no-ops as edits.
const EDITED_THRESHOLD_MS = 60_000;

export async function listClassroomAnnouncements(
  classroomId: string,
): Promise<AnnouncementSummary[]> {
  const announcements = await prisma.announcement.findMany({
    where: {
      classroomId,
      status: AnnouncementStatus.PUBLISHED,
      deletedAt: null,
    },
    include: {
      author: { select: { name: true, image: true, avatarUrl: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (announcements.length === 0) {
    return [];
  }

  const attachmentsByAnnouncementId = await getAttachmentsByAnnouncementId(
    announcements.map((announcement) => announcement.id),
  );

  return announcements.map((announcement) => ({
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
    attachments: attachmentsByAnnouncementId.get(announcement.id) ?? [],
  }));
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
