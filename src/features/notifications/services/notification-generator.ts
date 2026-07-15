import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/generated/prisma/enums";
import { ClassroomMembershipRole, ClassroomMembershipStatus } from "@/generated/prisma/enums";

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

/** Validates every recipient actually exists before writing - a stale or
 * bogus id in the input list is silently dropped rather than inserted. */
async function createNotificationsForRecipients(
  recipientIds: string[],
  payload: NotificationPayload,
): Promise<void> {
  const uniqueIds = Array.from(new Set(recipientIds));
  if (uniqueIds.length === 0) {
    return;
  }

  const validUsers = await prisma.user.findMany({
    where: { id: { in: uniqueIds } },
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

async function getActiveMemberIds(
  classroomId: string,
  options?: { excludeUserIds?: string[]; managersOnly?: boolean },
): Promise<string[]> {
  const memberships = await prisma.classroomMembership.findMany({
    where: {
      classroomId,
      status: ClassroomMembershipStatus.ACTIVE,
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
