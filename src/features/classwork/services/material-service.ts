import { randomUUID } from "node:crypto";

import type { SessionUser } from "@/auth/session";
import {
  assertManagementAccess,
  hasManagementAccess,
} from "@/features/classroom/services/classroom-service";
import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { getFileAttachmentsByEntityIds } from "@/lib/file-attachments";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { ClassroomStatus, FileAttachmentType, MaterialType } from "@/generated/prisma/enums";

import { assertTopicBelongsToClassroom } from "./topic-service";
import type { MaterialAttachedFile, MaterialSummary } from "../types";

const VIDEO_URL_PATTERN = /(youtube\.com|youtu\.be|vimeo\.com)/i;

export interface FileMeta {
  fileName: string;
  mimeType: string;
  size: number;
}

export interface MaterialInput {
  title: string;
  description?: string;
  url?: string;
  topicId?: string;
}

function materialWithAuthorInclude() {
  return { author: { select: { name: true } } } as const;
}

async function updateMaterialRecord(materialId: string, data: Prisma.MaterialUpdateInput) {
  return prisma.material.update({
    where: { id: materialId },
    data,
    include: materialWithAuthorInclude(),
  });
}

type MaterialWithAuthor = Awaited<ReturnType<typeof updateMaterialRecord>>;

function toMaterialSummary(
  material: MaterialWithAuthor,
  attachments: MaterialAttachedFile[],
  canManage: boolean,
): MaterialSummary {
  return {
    id: material.id,
    title: material.title,
    description: material.description,
    url: material.url,
    type: material.type,
    topicId: material.topicId,
    authorName: material.author.name,
    createdAt: material.createdAt,
    attachments,
    canManage,
  };
}

// Type is inferred from what's attached, matching Google Classroom's own UX
// (there's no explicit "type" field for the teacher to fill in).
function deriveMaterialType(url: string | undefined, fileMetas: FileMeta[]): MaterialType {
  if (url) {
    return VIDEO_URL_PATTERN.test(url) ? MaterialType.VIDEO : MaterialType.LINK;
  }

  if (fileMetas.length > 0) {
    return fileMetas.every((file) => file.mimeType.startsWith("image/"))
      ? MaterialType.IMAGE
      : MaterialType.DOCUMENT;
  }

  return MaterialType.OTHER;
}

async function findActiveMaterialOrThrow(materialId: string) {
  const material = await prisma.material.findUnique({ where: { id: materialId } });

  if (!material || material.deletedAt) {
    throw new ClassroomServiceError("NOT_FOUND", "Material not found.");
  }

  return material;
}

export async function listClassroomMaterials(
  classroomId: string,
  viewer: SessionUser,
): Promise<MaterialSummary[]> {
  const [materials, canManage] = await Promise.all([
    prisma.material.findMany({
      where: { classroomId, deletedAt: null },
      include: materialWithAuthorInclude(),
      orderBy: { createdAt: "desc" },
    }),
    hasManagementAccess(classroomId, viewer),
  ]);

  if (materials.length === 0) {
    return [];
  }

  const attachmentsByMaterialId = await getFileAttachmentsByEntityIds(
    materials.map((material) => material.id),
    FileAttachmentType.MATERIAL,
  );

  return materials.map((material) =>
    toMaterialSummary(material, attachmentsByMaterialId.get(material.id) ?? [], canManage),
  );
}

export async function createMaterial(
  classroomId: string,
  user: SessionUser,
  input: MaterialInput,
  fileMetas: FileMeta[],
): Promise<MaterialSummary> {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });

  if (!classroom || classroom.status === ClassroomStatus.DELETED) {
    throw new ClassroomServiceError("NOT_FOUND", "Classroom not found.");
  }

  if (classroom.status === ClassroomStatus.ARCHIVED) {
    throw new ClassroomServiceError(
      "ARCHIVED",
      "This class is archived and can't accept new materials.",
    );
  }

  await assertManagementAccess(classroomId, user);

  if (input.topicId) {
    await assertTopicBelongsToClassroom(input.topicId, classroomId);
  }

  const type = deriveMaterialType(input.url, fileMetas);

  const created = await prisma.$transaction(async (tx) => {
    const material = await tx.material.create({
      data: {
        classroomId,
        topicId: input.topicId ?? null,
        authorId: user.id,
        title: input.title,
        description: input.description ?? null,
        url: input.url ?? null,
        type,
      },
      include: materialWithAuthorInclude(),
    });

    for (const fileMeta of fileMetas) {
      // No object storage is wired up yet (see docs/ui-architecture.md open questions) -
      // this records file metadata only, not the file's bytes.
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
          attachmentType: FileAttachmentType.MATERIAL,
          entityId: material.id,
        },
      });
    }

    return material;
  });

  const attachmentsByMaterialId = await getFileAttachmentsByEntityIds(
    [created.id],
    FileAttachmentType.MATERIAL,
  );
  return toMaterialSummary(created, attachmentsByMaterialId.get(created.id) ?? [], true);
}

export async function updateMaterial(
  materialId: string,
  user: SessionUser,
  input: MaterialInput,
): Promise<MaterialSummary> {
  const existing = await findActiveMaterialOrThrow(materialId);
  await assertManagementAccess(existing.classroomId, user);

  if (input.topicId) {
    await assertTopicBelongsToClassroom(input.topicId, existing.classroomId);
  }

  const updated = await updateMaterialRecord(materialId, {
    title: input.title,
    description: input.description ?? null,
    url: input.url ?? null,
    topic: input.topicId ? { connect: { id: input.topicId } } : { disconnect: true },
  });

  const attachmentsByMaterialId = await getFileAttachmentsByEntityIds(
    [materialId],
    FileAttachmentType.MATERIAL,
  );
  return toMaterialSummary(updated, attachmentsByMaterialId.get(materialId) ?? [], true);
}

export async function deleteMaterial(materialId: string, user: SessionUser): Promise<void> {
  const existing = await findActiveMaterialOrThrow(materialId);
  await assertManagementAccess(existing.classroomId, user);

  await prisma.material.update({
    where: { id: materialId },
    data: { deletedAt: new Date() },
  });
}
