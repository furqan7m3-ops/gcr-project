import { getClassroomByIdAction } from "@/features/classroom/actions/classroom-queries";
import { canManageClassroom } from "@/features/classroom/lib/can-manage";
import { TopicList } from "@/features/classwork/components/topic-list";
import { listAssignmentsForClassroom } from "@/features/classwork/queries/assignment-queries";
import { listMaterialsForClassroom } from "@/features/classwork/queries/material-queries";
import { listTopicsForClassroom } from "@/features/classwork/queries/topic-queries";

export default async function ClassworkPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;

  const [topics, materials, assignments, classroom] = await Promise.all([
    listTopicsForClassroom(classroomId),
    listMaterialsForClassroom(classroomId),
    listAssignmentsForClassroom(classroomId),
    getClassroomByIdAction(classroomId),
  ]);

  const archived = classroom?.status === "ARCHIVED";
  const canManage = classroom ? canManageClassroom(classroom.role) : false;
  // Archived classrooms are read-only - creating topics/materials/assignments
  // and editing existing ones is disabled here; the server independently
  // enforces this too (assertClassroomActive) for every mutation.
  const canModify = canManage && !archived;

  const visibleMaterials = archived
    ? materials.map((material) => ({ ...material, canManage: false }))
    : materials;
  const visibleAssignments = archived
    ? assignments.map((assignment) => ({ ...assignment, canManage: false }))
    : assignments;

  return (
    <TopicList
      classroomId={classroomId}
      topics={topics}
      materials={visibleMaterials}
      assignments={visibleAssignments}
      canManage={canModify}
    />
  );
}
