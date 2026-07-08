import { getClassroomByIdAction } from "@/features/classroom/actions/classroom-queries";
import { canManageClassroom } from "@/features/classroom/lib/can-manage";
import { TopicList } from "@/features/classwork/components/topic-list";
import { listMaterialsForClassroom } from "@/features/classwork/queries/material-queries";
import { listTopicsForClassroom } from "@/features/classwork/queries/topic-queries";

export default async function ClassworkPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;

  const [topics, materials, classroom] = await Promise.all([
    listTopicsForClassroom(classroomId),
    listMaterialsForClassroom(classroomId),
    getClassroomByIdAction(classroomId),
  ]);

  const canManage = classroom ? canManageClassroom(classroom.role) : false;

  return (
    <TopicList
      classroomId={classroomId}
      topics={topics}
      materials={materials}
      canManage={canManage}
    />
  );
}
