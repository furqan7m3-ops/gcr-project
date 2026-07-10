import { notFound } from "next/navigation";

import { RosterSection } from "@/features/classroom/components/roster-section";
import { getClassroomRoster } from "@/features/classroom/queries/roster-queries";

export default async function PeoplePage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;

  const roster = await getClassroomRoster(classroomId);

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

      <RosterSection title="Teachers" members={roster.teachers} emptyMessage="No teachers found." />
      <RosterSection
        title="Students"
        members={roster.students}
        emptyMessage="No students have joined this class yet."
      />
    </div>
  );
}
