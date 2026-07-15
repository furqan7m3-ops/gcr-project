import { notFound } from "next/navigation";

import { getClassroomByIdAction } from "@/features/classroom/actions/classroom-queries";
import { InvitationSection } from "@/features/classroom/components/invitation-section";
import { RosterManager } from "@/features/classroom/components/roster-manager";
import { canManageClassroom } from "@/features/classroom/lib/can-manage";
import { getPendingInvitations } from "@/features/classroom/queries/invitation-queries";
import { getClassroomRoster } from "@/features/classroom/queries/roster-queries";
import { requireUser } from "@/lib/auth/permissions";

export default async function PeoplePage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;

  const [classroom, user] = await Promise.all([getClassroomByIdAction(classroomId), requireUser()]);

  if (!classroom) {
    notFound();
  }

  const archived = classroom.status === "ARCHIVED";
  const canManage = canManageClassroom(classroom.role);
  // Inviting members is disabled while archived - the server independently
  // enforces this too (assertClassroomActive, via inviteMember).
  const canInvite = canManage && !archived;

  const [roster, invitations] = await Promise.all([
    getClassroomRoster(classroomId),
    canManage ? getPendingInvitations(classroomId) : Promise.resolve(null),
  ]);

  if (!roster) {
    notFound();
  }

  const totalCount = roster.teachers.length + roster.students.length;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {totalCount} {totalCount === 1 ? "person" : "people"} - {roster.teachers.length}{" "}
        {roster.teachers.length === 1 ? "teacher" : "teachers"}, {roster.students.length}{" "}
        {roster.students.length === 1 ? "student" : "students"}
      </p>

      {canManage ? (
        <InvitationSection
          classroomId={classroomId}
          initialInvitations={invitations ?? []}
          canInvite={canInvite}
        />
      ) : null}

      <RosterManager
        classroomId={classroomId}
        classroomTitle={classroom.title}
        ownerId={classroom.ownerId}
        initialRoster={roster}
        viewerId={user.id}
        canManage={canManage}
      />
    </div>
  );
}
