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

  const archived = classroom?.status === "ARCHIVED";
  const canPost = classroom ? canManageClassroom(classroom.role) && !archived : false;
  const currentUser = {
    id: user?.id ?? "",
    name: user?.name ?? "You",
    image: user?.image ?? null,
  };

  // Archived classrooms are read-only - per-item management menus and the
  // comment box are disabled by stripping canManage/allowing comments here,
  // not just by omitting the composer above. The server independently
  // enforces this too (assertClassroomActive), this only keeps the UI honest.
  const visibleAnnouncements = archived
    ? announcements.map((announcement) => ({ ...announcement, canManage: false }))
    : announcements;

  return (
    <div className="flex flex-col gap-4">
      {canPost ? <AnnouncementComposer classroomId={classroomId} /> : null}
      <AnnouncementList
        announcements={visibleAnnouncements}
        classroomId={classroomId}
        currentUser={currentUser}
        archived={archived}
      />
    </div>
  );
}
