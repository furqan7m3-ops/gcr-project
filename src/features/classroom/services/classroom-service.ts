import type { SessionUser } from "@/auth/session";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  ClassroomMembershipRole,
  ClassroomMembershipStatus,
  ClassroomStatus,
  UserRole,
} from "@/generated/prisma/enums";

import { generateClassroomCode } from "../lib/generate-code";
import { ClassroomServiceError } from "../lib/errors";
import type { CreateClassroomInput, UpdateClassroomInput } from "../validation/classroom-schema";
import type { ClassroomSummary } from "../types";

const MAX_CODE_ATTEMPTS = 5;

function classroomWithOwnerInclude() {
  return { owner: { select: { name: true } } } as const;
}

async function findClassroomWithOwnerByWhere(where: Prisma.ClassroomWhereUniqueInput) {
  return prisma.classroom.findUnique({ where, include: classroomWithOwnerInclude() });
}

type ClassroomWithOwner = NonNullable<Awaited<ReturnType<typeof findClassroomWithOwnerByWhere>>>;

function toClassroomSummary(
  classroom: ClassroomWithOwner,
  role: ClassroomMembershipRole,
): ClassroomSummary {
  return {
    id: classroom.id,
    title: classroom.title,
    section: classroom.section,
    subject: classroom.subject,
    room: classroom.room,
    description: classroom.description,
    code: classroom.code,
    coverImageUrl: classroom.coverImageUrl,
    status: classroom.status,
    ownerId: classroom.ownerId,
    ownerName: classroom.owner.name,
    role,
    createdAt: classroom.createdAt,
  };
}

function isUniqueCodeConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    (error.meta.target as string[]).includes("code")
  );
}

/**
 * Only OWNER/TEACHER/CO_TEACHER on this specific classroom (or a platform ADMIN) may
 * manage it - a global TEACHER role does not imply access to every classroom.
 */
async function assertManagementAccess(classroomId: string, user: SessionUser): Promise<void> {
  if (user.role === UserRole.ADMIN) {
    return;
  }

  const membership = await prisma.classroomMembership.findUnique({
    where: { classroomId_userId: { classroomId, userId: user.id } },
  });

  const canManage =
    membership?.status === ClassroomMembershipStatus.ACTIVE &&
    (membership.role === ClassroomMembershipRole.OWNER ||
      membership.role === ClassroomMembershipRole.TEACHER ||
      membership.role === ClassroomMembershipRole.CO_TEACHER);

  if (!canManage) {
    throw new ClassroomServiceError(
      "FORBIDDEN",
      "You do not have permission to manage this classroom.",
    );
  }
}

export async function listUserClassrooms(userId: string): Promise<ClassroomSummary[]> {
  const memberships = await prisma.classroomMembership.findMany({
    where: {
      userId,
      status: ClassroomMembershipStatus.ACTIVE,
      classroom: { status: { not: ClassroomStatus.DELETED } },
    },
    include: { classroom: { include: classroomWithOwnerInclude() } },
    orderBy: { classroom: { updatedAt: "desc" } },
  });

  return memberships.map((membership) => toClassroomSummary(membership.classroom, membership.role));
}

export async function getClassroomForUser(
  classroomId: string,
  user: SessionUser,
): Promise<ClassroomSummary> {
  const classroom = await findClassroomWithOwnerByWhere({ id: classroomId });

  if (!classroom || classroom.status === ClassroomStatus.DELETED) {
    throw new ClassroomServiceError("NOT_FOUND", "Classroom not found.");
  }

  if (user.role === UserRole.ADMIN) {
    return toClassroomSummary(classroom, ClassroomMembershipRole.TEACHER);
  }

  const membership = await prisma.classroomMembership.findUnique({
    where: { classroomId_userId: { classroomId, userId: user.id } },
  });

  // Don't distinguish "doesn't exist" from "you can't see it" - avoids leaking existence.
  if (!membership || membership.status !== ClassroomMembershipStatus.ACTIVE) {
    throw new ClassroomServiceError("NOT_FOUND", "Classroom not found.");
  }

  return toClassroomSummary(classroom, membership.role);
}

export async function createClassroom(
  ownerId: string,
  input: CreateClassroomInput,
): Promise<ClassroomSummary> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateClassroomCode();

    try {
      const classroom = await prisma.$transaction(async (tx) => {
        const created = await tx.classroom.create({
          data: {
            ownerId,
            title: input.title,
            section: input.section ?? null,
            subject: input.subject ?? null,
            room: input.room ?? null,
            description: input.description ?? null,
            code,
          },
          include: classroomWithOwnerInclude(),
        });

        await tx.classroomMembership.create({
          data: {
            classroomId: created.id,
            userId: ownerId,
            role: ClassroomMembershipRole.OWNER,
            status: ClassroomMembershipStatus.ACTIVE,
          },
        });

        return created;
      });

      return toClassroomSummary(classroom, ClassroomMembershipRole.OWNER);
    } catch (error) {
      if (isUniqueCodeConflict(error)) {
        continue;
      }
      throw error;
    }
  }

  throw new ClassroomServiceError(
    "CODE_GENERATION_FAILED",
    "Could not generate a unique class code. Please try again.",
  );
}

export async function updateClassroom(
  classroomId: string,
  user: SessionUser,
  input: Omit<UpdateClassroomInput, "classroomId">,
): Promise<ClassroomSummary> {
  const existing = await prisma.classroom.findUnique({ where: { id: classroomId } });

  if (!existing || existing.status === ClassroomStatus.DELETED) {
    throw new ClassroomServiceError("NOT_FOUND", "Classroom not found.");
  }

  await assertManagementAccess(classroomId, user);

  const updated = await prisma.classroom.update({
    where: { id: classroomId },
    data: {
      title: input.title,
      section: input.section ?? null,
      subject: input.subject ?? null,
      room: input.room ?? null,
      description: input.description ?? null,
    },
    include: classroomWithOwnerInclude(),
  });

  const membership = await prisma.classroomMembership.findUnique({
    where: { classroomId_userId: { classroomId, userId: user.id } },
  });

  return toClassroomSummary(updated, membership?.role ?? ClassroomMembershipRole.TEACHER);
}

export async function archiveClassroom(classroomId: string, user: SessionUser): Promise<void> {
  const existing = await prisma.classroom.findUnique({ where: { id: classroomId } });

  if (!existing || existing.status === ClassroomStatus.DELETED) {
    throw new ClassroomServiceError("NOT_FOUND", "Classroom not found.");
  }

  await assertManagementAccess(classroomId, user);

  await prisma.classroom.update({
    where: { id: classroomId },
    data: { status: ClassroomStatus.ARCHIVED },
  });
}

export async function joinClassroomByCode(userId: string, code: string): Promise<ClassroomSummary> {
  // Case-insensitive: generated codes are lowercase, but codes can be stored or
  // typed in any case (e.g. seeded/legacy data), so match on either.
  const classroom = await prisma.classroom.findFirst({
    where: { code: { equals: code, mode: "insensitive" } },
    include: classroomWithOwnerInclude(),
  });

  if (!classroom || classroom.status === ClassroomStatus.DELETED) {
    throw new ClassroomServiceError("NOT_FOUND", "No class was found with that code.");
  }

  if (classroom.status === ClassroomStatus.ARCHIVED) {
    throw new ClassroomServiceError(
      "ARCHIVED",
      "This class has been archived and is no longer accepting new members.",
    );
  }

  const existingMembership = await prisma.classroomMembership.findUnique({
    where: { classroomId_userId: { classroomId: classroom.id, userId } },
  });

  if (existingMembership?.status === ClassroomMembershipStatus.ACTIVE) {
    throw new ClassroomServiceError("ALREADY_ENROLLED", "You're already a member of this class.");
  }

  const membership = existingMembership
    ? await prisma.classroomMembership.update({
        where: { id: existingMembership.id },
        data: {
          status: ClassroomMembershipStatus.ACTIVE,
          role: ClassroomMembershipRole.STUDENT,
          joinedAt: new Date(),
        },
      })
    : await prisma.classroomMembership.create({
        data: {
          classroomId: classroom.id,
          userId,
          role: ClassroomMembershipRole.STUDENT,
          status: ClassroomMembershipStatus.ACTIVE,
        },
      });

  return toClassroomSummary(classroom, membership.role);
}

export async function leaveClassroom(userId: string, classroomId: string): Promise<void> {
  const membership = await prisma.classroomMembership.findUnique({
    where: { classroomId_userId: { classroomId, userId } },
  });

  if (!membership || membership.status !== ClassroomMembershipStatus.ACTIVE) {
    throw new ClassroomServiceError("NOT_A_MEMBER", "You are not a member of this class.");
  }

  if (membership.role === ClassroomMembershipRole.OWNER) {
    throw new ClassroomServiceError(
      "OWNER_CANNOT_LEAVE",
      "Classroom owners can't leave their own class. Archive it instead.",
    );
  }

  await prisma.classroomMembership.update({
    where: { id: membership.id },
    data: { status: ClassroomMembershipStatus.REMOVED },
  });
}
