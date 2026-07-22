import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/generated/prisma/enums";
import {
  ClassroomMembershipRole,
  ClassroomMembershipStatus,
  UserRole,
} from "@/generated/prisma/enums";

/**
 * Centralized write-side of the notifications feature - every notification
 * created anywhere in the app goes through here, never through an ad-hoc
 * prisma.notification.create in some other feature's service. Each exported
 * function corresponds to exactly one application event and is safe to call
 * fire-and-forget: failures are swallowed (logged, not thrown) so a
 * notification hiccup never breaks the primary action that triggered it.
 */

interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  link: string;
}

const ADMIN_ONLY_NOTIFICATION_TYPES: NotificationType[] = [
  NotificationType.CLASS_CREATED,
  NotificationType.CLASS_ARCHIVED,
];

/**
 * Validates every recipient actually exists before writing - a stale or
 * bogus id in the input list is silently dropped rather than inserted.
 *
 * Also the single authoritative place admins are excluded from every
 * notification type except CLASS_CREATED/CLASS_ARCHIVED - individual
 * generator functions below don't need their own admin-awareness (and can't
 * accidentally forget it), since every write funnels through here regardless
 * of how its recipient list was built (membership query, a single hardcoded
 * id, whatever).
 */
async function createNotificationsForRecipients(
  recipientIds: string[],
  payload: NotificationPayload,
): Promise<void> {
  const uniqueIds = Array.from(new Set(recipientIds));
  if (uniqueIds.length === 0) {
    return;
  }

  const isAdminOnlyType = ADMIN_ONLY_NOTIFICATION_TYPES.includes(payload.type);

  const validUsers = await prisma.user.findMany({
    where: {
      id: { in: uniqueIds },
      ...(isAdminOnlyType ? {} : { role: { not: UserRole.ADMIN } }),
    },
    select: { id: true },
  });

  if (validUsers.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: validUsers.map((recipient) => ({
      recipientId: recipient.id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link,
    })),
  });
}

/**
 * Admins are auto-enrolled as a co-teacher on every classroom (see
 * classroom-service.ts's createClassroom), which would otherwise make them
 * "just another manager" here and pull them into every announcement/
 * assignment/material/private-comment/member-joined notification for every
 * classroom on the platform. Admins only ever get CLASS_CREATED/
 * CLASS_ARCHIVED (see notifyClassroomCreated/notifyClassroomArchived below) -
 * excluded here, once, rather than patched into every caller below.
 */
async function getActiveMemberIds(
  classroomId: string,
  options?: { excludeUserIds?: string[]; managersOnly?: boolean },
): Promise<string[]> {
  const memberships = await prisma.classroomMembership.findMany({
    where: {
      classroomId,
      status: ClassroomMembershipStatus.ACTIVE,
      user: { role: { not: UserRole.ADMIN } },
      ...(options?.managersOnly
        ? {
            role: {
              in: [
                ClassroomMembershipRole.OWNER,
                ClassroomMembershipRole.TEACHER,
                ClassroomMembershipRole.CO_TEACHER,
              ],
            },
          }
        : {}),
    },
    select: { userId: true },
  });

  const exclude = new Set(options?.excludeUserIds ?? []);
  return memberships.map((m) => m.userId).filter((id) => !exclude.has(id));
}

/** All current platform admins - the recipient set for CLASS_CREATED/CLASS_ARCHIVED. */
async function getAdminIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { id: true },
  });
  return admins.map((admin) => admin.id);
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

/** Fires when a new announcement is posted (announcements are always created
 * as published - there is no separate publish step for this entity). */
export async function notifyAnnouncementPublished(params: {
  classroomId: string;
  classroomTitle: string;
  authorId: string;
  announcementContent: string;
}): Promise<void> {
  try {
    const recipientIds = await getActiveMemberIds(params.classroomId, {
      excludeUserIds: [params.authorId],
    });
    await createNotificationsForRecipients(recipientIds, {
      type: NotificationType.NEW_ANNOUNCEMENT,
      title: `New announcement in ${params.classroomTitle}`,
      message: truncate(params.announcementContent, 140),
      link: `/classes/${params.classroomId}/stream`,
    });
  } catch (error) {
    console.error("notifyAnnouncementPublished failed:", error);
  }
}

/** Fires when an assignment becomes visible to the classroom - whether
 * created directly as published or transitioned from draft afterward. Those
 * two paths are mutually exclusive for a given assignment, so there's no
 * risk of a duplicate notification from both. */
export async function notifyAssignmentPublished(params: {
  classroomId: string;
  classroomTitle: string;
  authorId: string;
  assignmentId: string;
  assignmentTitle: string;
}): Promise<void> {
  try {
    const recipientIds = await getActiveMemberIds(params.classroomId, {
      excludeUserIds: [params.authorId],
    });
    await createNotificationsForRecipients(recipientIds, {
      type: NotificationType.NEW_ASSIGNMENT,
      title: `New assignment in ${params.classroomTitle}`,
      message: `"${params.assignmentTitle}" was just posted.`,
      link: `/classes/${params.classroomId}/classwork/${params.assignmentId}`,
    });
  } catch (error) {
    console.error("notifyAssignmentPublished failed:", error);
  }
}

/** Fires when a material becomes visible to the classroom - mirrors notifyAssignmentPublished. */
export async function notifyMaterialPublished(params: {
  classroomId: string;
  classroomTitle: string;
  authorId: string;
  materialTitle: string;
}): Promise<void> {
  try {
    const recipientIds = await getActiveMemberIds(params.classroomId, {
      excludeUserIds: [params.authorId],
    });
    await createNotificationsForRecipients(recipientIds, {
      type: NotificationType.NEW_MATERIAL,
      title: `New material in ${params.classroomTitle}`,
      message: `"${params.materialTitle}" was just posted.`,
      link: `/classes/${params.classroomId}/classwork`,
    });
  } catch (error) {
    console.error("notifyMaterialPublished failed:", error);
  }
}

/** Fires exactly once, at return time - never at grade-entry time. A grade
 * stays invisible to the student until the submission is returned (see
 * submission-service.ts), so notifying earlier would leak that a grade
 * exists before the student is allowed to see it. The message is tailored
 * based on whether a grade was actually set, which covers both the
 * "submission returned" and "assignment graded" events with one call site. */
export async function notifySubmissionReturned(params: {
  studentId: string;
  classroomId: string;
  assignmentId: string;
  assignmentTitle: string;
  isGraded: boolean;
}): Promise<void> {
  try {
    await createNotificationsForRecipients([params.studentId], {
      type: NotificationType.SUBMISSION_RETURNED,
      title: params.isGraded ? "Your assignment was graded" : "Your work was returned",
      message: params.isGraded
        ? `"${params.assignmentTitle}" was graded and returned.`
        : `"${params.assignmentTitle}" was returned by your teacher.`,
      // The assignment detail page is where a student sees both their
      // submission and (once returned) their grade and feedback - there's no
      // separate "my submission" route to link to instead.
      link: `/classes/${params.classroomId}/classwork/${params.assignmentId}`,
    });
  } catch (error) {
    console.error("notifySubmissionReturned failed:", error);
  }
}

/** Fires when a private comment is posted on a submission - to the student if
 * a teacher wrote it, or to every manager of the classroom if the student
 * wrote it (excluding the author either way, so nobody is notified of their
 * own comment). */
export async function notifyPrivateComment(params: {
  classroomId: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  authorId: string;
  authorIsTeacher: boolean;
}): Promise<void> {
  try {
    const recipientIds = params.authorIsTeacher
      ? [params.studentId]
      : await getActiveMemberIds(params.classroomId, {
          managersOnly: true,
          excludeUserIds: [params.authorId],
        });

    await createNotificationsForRecipients(recipientIds, {
      type: NotificationType.PRIVATE_COMMENT,
      title: "New private comment",
      message: `You have a new private comment on "${params.assignmentTitle}".`,
      link: `/classes/${params.classroomId}/classwork/${params.assignmentId}`,
    });
  } catch (error) {
    console.error("notifyPrivateComment failed:", error);
  }
}

/** Fires once per invitation, to the specific teacher who sent it - gated on
 * the invitation transitioning out of PENDING, so it can never double-fire
 * for the same invitation. */
export async function notifyInvitationAccepted(params: {
  inviterId: string;
  classroomId: string;
  memberName: string;
  classroomTitle: string;
}): Promise<void> {
  try {
    await createNotificationsForRecipients([params.inviterId], {
      type: NotificationType.GENERAL,
      title: "Invitation accepted",
      message: `${params.memberName} accepted your invitation to join ${params.classroomTitle}.`,
      link: `/classes/${params.classroomId}/people`,
    });
  } catch (error) {
    console.error("notifyInvitationAccepted failed:", error);
  }
}

/** Fires once, to the specific invited user - only when the invite matched an
 * existing registered account (inviteMember leaves inviteeUserId null for an
 * unregistered email, since there's nobody to notify yet). There's no
 * accept-invite page, so the link lands on /classes with the join code
 * pre-filled - see classes-page-actions.tsx's ?code= handling. */
export async function notifyInvited(params: {
  inviteeUserId: string;
  classroomId: string;
  classroomTitle: string;
  classroomCode: string;
  inviterName: string;
}): Promise<void> {
  try {
    await createNotificationsForRecipients([params.inviteeUserId], {
      type: NotificationType.GENERAL,
      title: "You're invited to join a class",
      message: `${params.inviterName} invited you to join ${params.classroomTitle}. Use class code ${params.classroomCode} to join.`,
      link: `/classes?code=${params.classroomCode}`,
    });
  } catch (error) {
    console.error("notifyInvited failed:", error);
  }
}

/** Fires to every manager (owner/teacher/co-teacher) of the classroom except
 * whoever is already excluded - callers exclude the joining user themselves
 * and, when the join matched a pending invitation, the specific inviter
 * (who already receives the more specific "invitation accepted" notice
 * instead, avoiding a near-duplicate for the same event). */
export async function notifyMemberJoined(params: {
  classroomId: string;
  classroomTitle: string;
  memberName: string;
  excludeUserIds: string[];
}): Promise<void> {
  try {
    const recipientIds = await getActiveMemberIds(params.classroomId, {
      managersOnly: true,
      excludeUserIds: params.excludeUserIds,
    });
    await createNotificationsForRecipients(recipientIds, {
      type: NotificationType.GENERAL,
      title: "New member joined",
      message: `${params.memberName} joined ${params.classroomTitle}.`,
      link: `/classes/${params.classroomId}/people`,
    });
  } catch (error) {
    console.error("notifyMemberJoined failed:", error);
  }
}

/**
 * The only two events admins are ever notified about (see
 * createNotificationsForRecipients's ADMIN_ONLY_NOTIFICATION_TYPES guard,
 * which is what actually enforces that - not this recipient list, which is
 * "every admin" regardless of type). Fires to every platform admin,
 * including whichever admin performed the action themselves - consistent
 * with how every other classroom-event notification doesn't special-case
 * "except when I did it myself" for a platform-wide audience.
 */
export async function notifyClassroomCreated(params: {
  classroomId: string;
  classroomTitle: string;
  creatorName: string;
}): Promise<void> {
  try {
    const recipientIds = await getAdminIds();
    await createNotificationsForRecipients(recipientIds, {
      type: NotificationType.CLASS_CREATED,
      title: "Class created",
      message: `${params.creatorName} created ${params.classroomTitle}.`,
      link: `/classes/${params.classroomId}`,
    });
  } catch (error) {
    console.error("notifyClassroomCreated failed:", error);
  }
}

export async function notifyClassroomArchived(params: {
  classroomId: string;
  classroomTitle: string;
  archivedByName: string;
}): Promise<void> {
  try {
    const recipientIds = await getAdminIds();
    await createNotificationsForRecipients(recipientIds, {
      type: NotificationType.CLASS_ARCHIVED,
      title: "Class archived",
      message: `${params.archivedByName} archived ${params.classroomTitle}.`,
      link: `/classes/${params.classroomId}`,
    });
  } catch (error) {
    console.error("notifyClassroomArchived failed:", error);
  }
}
