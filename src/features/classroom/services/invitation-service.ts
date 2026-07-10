import type { SessionUser } from "@/auth/session";
import { prisma } from "@/lib/prisma";
import {
  ClassroomMembershipStatus,
  ClassroomStatus,
  InvitationStatus,
  InvitationType,
} from "@/generated/prisma/enums";

import { assertManagementAccess } from "./classroom-service";
import { ClassroomServiceError } from "../lib/errors";
import type { PendingInvitation } from "../types";

function invitationWithInviterInclude() {
  return { invitedBy: { select: { name: true } } } as const;
}

function toPendingInvitation(invitation: {
  id: string;
  inviteeEmail: string;
  createdAt: Date;
  invitedBy: { name: string };
}): PendingInvitation {
  return {
    id: invitation.id,
    email: invitation.inviteeEmail,
    invitedByName: invitation.invitedBy.name,
    createdAt: invitation.createdAt,
  };
}

async function assertClassroomAcceptsInvitations(classroomId: string): Promise<void> {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });

  if (!classroom || classroom.status === ClassroomStatus.DELETED) {
    throw new ClassroomServiceError("NOT_FOUND", "Classroom not found.");
  }

  if (classroom.status === ClassroomStatus.ARCHIVED) {
    throw new ClassroomServiceError(
      "ARCHIVED",
      "This class is archived and can't accept new invitations.",
    );
  }
}

export async function listPendingInvitations(
  classroomId: string,
  user: SessionUser,
): Promise<PendingInvitation[]> {
  await assertManagementAccess(classroomId, user);

  const invitations = await prisma.invitation.findMany({
    where: { classroomId, status: InvitationStatus.PENDING },
    include: invitationWithInviterInclude(),
    orderBy: { createdAt: "desc" },
  });

  return invitations.map(toPendingInvitation);
}

export async function inviteMember(
  classroomId: string,
  user: SessionUser,
  email: string,
): Promise<PendingInvitation> {
  await assertClassroomAcceptsInvitations(classroomId);
  await assertManagementAccess(classroomId, user);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    const membership = await prisma.classroomMembership.findUnique({
      where: { classroomId_userId: { classroomId, userId: existingUser.id } },
    });

    if (membership?.status === ClassroomMembershipStatus.ACTIVE) {
      throw new ClassroomServiceError(
        "ALREADY_ENROLLED",
        "This person is already a member of this class.",
      );
    }
  }

  const existingInvitation = await prisma.invitation.findFirst({
    where: { classroomId, inviteeEmail: email, status: InvitationStatus.PENDING },
  });

  if (existingInvitation) {
    throw new ClassroomServiceError(
      "VALIDATION_ERROR",
      "An invitation is already pending for this email.",
    );
  }

  const created = await prisma.invitation.create({
    data: {
      classroomId,
      invitedById: user.id,
      inviteeUserId: existingUser?.id ?? null,
      inviteeEmail: email,
      type: InvitationType.EMAIL,
      status: InvitationStatus.PENDING,
    },
    include: invitationWithInviterInclude(),
  });

  return toPendingInvitation(created);
}

export async function cancelInvitation(
  classroomId: string,
  invitationId: string,
  user: SessionUser,
): Promise<void> {
  await assertManagementAccess(classroomId, user);

  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });

  if (!invitation || invitation.classroomId !== classroomId) {
    throw new ClassroomServiceError("NOT_FOUND", "Invitation not found.");
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new ClassroomServiceError("VALIDATION_ERROR", "This invitation is no longer pending.");
  }

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: InvitationStatus.REVOKED },
  });
}
