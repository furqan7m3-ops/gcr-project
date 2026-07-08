import { prisma } from "@/lib/prisma";
import type { FileAttachmentType } from "@/generated/prisma/enums";

export interface AttachedFileSummary {
  id: string;
  fileName: string;
}

// FileAttachment is polymorphic (attachmentType + entityId), so it isn't a typed
// Prisma relation on Announcement/Material - fetched separately and grouped in memory.
export async function getFileAttachmentsByEntityIds(
  entityIds: string[],
  attachmentType: FileAttachmentType,
): Promise<Map<string, AttachedFileSummary[]>> {
  if (entityIds.length === 0) {
    return new Map();
  }

  const attachments = await prisma.fileAttachment.findMany({
    where: {
      attachmentType,
      entityId: { in: entityIds },
    },
    include: { file: { select: { fileName: true } } },
  });

  const byEntityId = new Map<string, AttachedFileSummary[]>();

  for (const attachment of attachments) {
    const existing = byEntityId.get(attachment.entityId) ?? [];
    existing.push({ id: attachment.id, fileName: attachment.file.fileName });
    byEntityId.set(attachment.entityId, existing);
  }

  return byEntityId;
}
