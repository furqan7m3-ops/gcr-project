import type { SessionUser } from "@/auth/session";
import { recordAuditEvent, type AuditEntityType } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { ActivityAction, ClassroomStatus, ModerationStatus } from "@/generated/prisma/enums";

import { AdminModerationServiceError } from "../lib/errors";
import type {
  ListModerationParams,
  ModerationClassroomOption,
  ModerationItem,
  ModerationPage,
  ModeratedContentType,
} from "../types";

const DEFAULT_PAGE_SIZE = 20;

function truncate(text: string, max = 80): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function paginate(total: number, page: number, pageSize: number) {
  return { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

async function listAnnouncements(params: ListModerationParams): Promise<ModerationPage> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

  const where = {
    ...(params.status ? { moderationStatus: params.status } : {}),
    ...(params.search ? { title: { contains: params.search, mode: "insensitive" as const } } : {}),
    ...(params.classroomId ? { classroomId: params.classroomId } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      include: {
        author: { select: { name: true, email: true } },
        classroom: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.announcement.count({ where }),
  ]);

  const items: ModerationItem[] = rows.map((row) => ({
    id: row.id,
    contentType: "announcement",
    title: row.title,
    authorName: row.author.name,
    authorEmail: row.author.email,
    classroomTitle: row.classroom.title,
    moderationStatus: row.moderationStatus,
    createdAt: row.createdAt,
  }));

  return { items, ...paginate(total, page, pageSize) };
}

async function listMaterials(params: ListModerationParams): Promise<ModerationPage> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

  const where = {
    ...(params.status ? { moderationStatus: params.status } : {}),
    ...(params.search ? { title: { contains: params.search, mode: "insensitive" as const } } : {}),
    ...(params.classroomId ? { classroomId: params.classroomId } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.material.findMany({
      where,
      include: {
        author: { select: { name: true, email: true } },
        classroom: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.material.count({ where }),
  ]);

  const items: ModerationItem[] = rows.map((row) => ({
    id: row.id,
    contentType: "material",
    title: row.title,
    authorName: row.author.name,
    authorEmail: row.author.email,
    classroomTitle: row.classroom.title,
    moderationStatus: row.moderationStatus,
    createdAt: row.createdAt,
  }));

  return { items, ...paginate(total, page, pageSize) };
}

async function listAssignments(params: ListModerationParams): Promise<ModerationPage> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

  const where = {
    ...(params.status ? { moderationStatus: params.status } : {}),
    ...(params.search ? { title: { contains: params.search, mode: "insensitive" as const } } : {}),
    ...(params.classroomId ? { classroomId: params.classroomId } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      include: {
        author: { select: { name: true, email: true } },
        classroom: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.assignment.count({ where }),
  ]);

  const items: ModerationItem[] = rows.map((row) => ({
    id: row.id,
    contentType: "assignment",
    title: row.title,
    authorName: row.author.name,
    authorEmail: row.author.email,
    classroomTitle: row.classroom.title,
    moderationStatus: row.moderationStatus,
    createdAt: row.createdAt,
  }));

  return { items, ...paginate(total, page, pageSize) };
}

async function listComments(params: ListModerationParams): Promise<ModerationPage> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

  const where = {
    ...(params.status ? { moderationStatus: params.status } : {}),
    ...(params.search
      ? { content: { contains: params.search, mode: "insensitive" as const } }
      : {}),
    // A comment's classroom is indirect - via its parent announcement or via
    // its parent submission's assignment (a comment is on exactly one of the
    // two) - so filtering by classroom means matching either path.
    ...(params.classroomId
      ? {
          OR: [
            { announcement: { classroomId: params.classroomId } },
            { submission: { assignment: { classroomId: params.classroomId } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        author: { select: { name: true, email: true } },
        announcement: { select: { classroom: { select: { title: true } } } },
        submission: {
          select: { assignment: { select: { classroom: { select: { title: true } } } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.comment.count({ where }),
  ]);

  const items: ModerationItem[] = rows.map((row) => ({
    id: row.id,
    contentType: "comment",
    title: truncate(row.content),
    authorName: row.author.name,
    authorEmail: row.author.email,
    classroomTitle:
      row.announcement?.classroom.title ?? row.submission?.assignment.classroom.title ?? "—",
    moderationStatus: row.moderationStatus,
    createdAt: row.createdAt,
  }));

  return { items, ...paginate(total, page, pageSize) };
}

/** Populates the "Class" filter dropdown - every non-deleted classroom, so archived ones (whose content still needs moderating) stay filterable too. */
export async function listClassroomOptions(): Promise<ModerationClassroomOption[]> {
  const classrooms = await prisma.classroom.findMany({
    where: { status: { not: ClassroomStatus.DELETED } },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });
  return classrooms;
}

export async function listModeratedContent(params: ListModerationParams): Promise<ModerationPage> {
  switch (params.contentType) {
    case "announcement":
      return listAnnouncements(params);
    case "material":
      return listMaterials(params);
    case "assignment":
      return listAssignments(params);
    case "comment":
      return listComments(params);
  }
}

interface ModerationTarget {
  title: string;
  classroomId: string | null;
}

async function loadTarget(
  contentType: ModeratedContentType,
  id: string,
): Promise<ModerationTarget> {
  switch (contentType) {
    case "announcement": {
      const row = await prisma.announcement.findUnique({ where: { id } });
      if (!row) {
        throw new AdminModerationServiceError("NOT_FOUND", "Announcement not found.");
      }
      return { title: row.title, classroomId: row.classroomId };
    }
    case "material": {
      const row = await prisma.material.findUnique({ where: { id } });
      if (!row) {
        throw new AdminModerationServiceError("NOT_FOUND", "Material not found.");
      }
      return { title: row.title, classroomId: row.classroomId };
    }
    case "assignment": {
      const row = await prisma.assignment.findUnique({ where: { id } });
      if (!row) {
        throw new AdminModerationServiceError("NOT_FOUND", "Assignment not found.");
      }
      return { title: row.title, classroomId: row.classroomId };
    }
    case "comment": {
      const row = await prisma.comment.findUnique({
        where: { id },
        include: {
          announcement: { select: { classroomId: true } },
          submission: { select: { assignment: { select: { classroomId: true } } } },
        },
      });
      if (!row) {
        throw new AdminModerationServiceError("NOT_FOUND", "Comment not found.");
      }
      return {
        title: truncate(row.content),
        classroomId:
          row.announcement?.classroomId ?? row.submission?.assignment.classroomId ?? null,
      };
    }
  }
}

async function applyModeration(
  contentType: ModeratedContentType,
  id: string,
  data: { moderationStatus: ModerationStatus; deletedAt: Date | null },
): Promise<void> {
  switch (contentType) {
    case "announcement":
      await prisma.announcement.update({ where: { id }, data });
      return;
    case "material":
      await prisma.material.update({ where: { id }, data });
      return;
    case "assignment":
      await prisma.assignment.update({ where: { id }, data });
      return;
    case "comment":
      await prisma.comment.update({ where: { id }, data });
      return;
  }
}

const ENTITY_TYPE_MAP: Record<ModeratedContentType, AuditEntityType> = {
  announcement: "Announcement",
  material: "Material",
  assignment: "Assignment",
  comment: "Comment",
};

type ModerationAction = "archive" | "delete" | "restore";

async function moderate(
  contentType: ModeratedContentType,
  id: string,
  action: ModerationAction,
  actor: SessionUser,
): Promise<void> {
  const target = await loadTarget(contentType, id);

  const data =
    action === "restore"
      ? { moderationStatus: ModerationStatus.ACTIVE, deletedAt: null }
      : action === "archive"
        ? { moderationStatus: ModerationStatus.ARCHIVED, deletedAt: new Date() }
        : { moderationStatus: ModerationStatus.DELETED, deletedAt: new Date() };

  await applyModeration(contentType, id, data);

  const activityAction =
    action === "restore"
      ? ActivityAction.RESTORED
      : action === "archive"
        ? ActivityAction.ARCHIVED
        : ActivityAction.DELETED;

  await recordAuditEvent({
    actorId: actor.id,
    action: activityAction,
    entityType: ENTITY_TYPE_MAP[contentType],
    entityId: id,
    targetLabel: target.title,
    classroomId: target.classroomId ?? undefined,
  });
}

export async function archiveContent(
  contentType: ModeratedContentType,
  id: string,
  actor: SessionUser,
): Promise<void> {
  return moderate(contentType, id, "archive", actor);
}

export async function deleteContent(
  contentType: ModeratedContentType,
  id: string,
  actor: SessionUser,
): Promise<void> {
  return moderate(contentType, id, "delete", actor);
}

export async function restoreContent(
  contentType: ModeratedContentType,
  id: string,
  actor: SessionUser,
): Promise<void> {
  return moderate(contentType, id, "restore", actor);
}
