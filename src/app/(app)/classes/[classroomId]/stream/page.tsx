import { getClassroomByIdAction } from "@/features/classroom/actions/classroom-queries";
import { canManageClassroom } from "@/features/classroom/lib/can-manage";
import { AnnouncementComposer } from "@/features/stream/components/announcement-composer";
import { AnnouncementList } from "@/features/stream/components/announcement-list";
import { listAnnouncementsForClassroom } from "@/features/stream/queries/stream-queries";

export default async function StreamPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;

  const [announcements, classroom] = await Promise.all([
    listAnnouncementsForClassroom(classroomId),
    getClassroomByIdAction(classroomId),
  ]);

  const canPost = classroom ? canManageClassroom(classroom.role) : false;

  return (
    <div className="flex flex-col gap-4">
      {canPost ? <AnnouncementComposer classroomId={classroomId} /> : null}
      <AnnouncementList announcements={announcements} />
    </div>
  );
}
