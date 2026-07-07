import { getCurrentUser } from "@/auth/session";
import { getClassroomByIdAction } from "@/features/classroom/actions/classroom-queries";
import { canManageClassroom } from "@/features/classroom/lib/can-manage";
import { AnnouncementComposer } from "@/features/stream/components/announcement-composer";
import { AnnouncementList } from "@/features/stream/components/announcement-list";
import { listAnnouncementsForClassroom } from "@/features/stream/queries/stream-queries";

export default async function StreamPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;

  const [announcements, classroom, user] = await Promise.all([
    listAnnouncementsForClassroom(classroomId),
    getClassroomByIdAction(classroomId),
    getCurrentUser(),
  ]);

  const canPost = classroom ? canManageClassroom(classroom.role) : false;
  const currentUser = {
    id: user?.id ?? "",
    name: user?.name ?? "You",
    image: user?.image ?? null,
  };

  return (
    <div className="flex flex-col gap-4">
      {canPost ? <AnnouncementComposer classroomId={classroomId} /> : null}
      <AnnouncementList
        announcements={announcements}
        classroomId={classroomId}
        currentUser={currentUser}
      />
    </div>
  );
}
