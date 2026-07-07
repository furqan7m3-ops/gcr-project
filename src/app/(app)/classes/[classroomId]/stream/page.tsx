import { AnnouncementList } from "@/features/stream/components/announcement-list";
import { listAnnouncementsForClassroom } from "@/features/stream/queries/stream-queries";

export default async function StreamPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;
  const announcements = await listAnnouncementsForClassroom(classroomId);

  return <AnnouncementList announcements={announcements} />;
}
