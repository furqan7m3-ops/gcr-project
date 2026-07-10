import { notFound } from "next/navigation";

import { getClassroomByIdAction } from "@/features/classroom/actions/classroom-queries";
import { InvitationSection } from "@/features/classroom/components/invitation-section";
import { RosterSection } from "@/features/classroom/components/roster-section";
import { canManageClassroom } from "@/features/classroom/lib/can-manage";
import { getPendingInvitations } from "@/features/classroom/queries/invitation-queries";
import { getClassroomRoster } from "@/features/classroom/queries/roster-queries";

export default async function PeoplePage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;

  const classroom = await getClassroomByIdAction(classroomId);

  if (!classroom) {
    notFound();
  }

  const canManage = canManageClassroom(classroom.role);

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
        <InvitationSection classroomId={classroomId} initialInvitations={invitations ?? []} />
      ) : null}

      <RosterSection title="Teachers" members={roster.teachers} emptyMessage="No teachers found." />
      <RosterSection
        title="Students"
        members={roster.students}
        emptyMessage="No students have joined this class yet."
      />
    </div>
  );
}
