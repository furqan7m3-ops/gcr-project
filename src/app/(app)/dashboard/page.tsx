import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { getUserClassroomsAction } from "@/features/classroom/actions/classroom-queries";
import { StudentDashboardView } from "@/features/dashboard/components/student-dashboard-view";
import { TeacherDashboardView } from "@/features/dashboard/components/teacher-dashboard-view";
import {
  getStudentDashboardData,
  getTeacherDashboardData,
} from "@/features/dashboard/queries/dashboard-queries";
import { getCurrentUser } from "@/auth/session";
import { UserRole } from "@/generated/prisma/enums";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Admins normally live on their dedicated /admin dashboard, but they can
  // "Exit to app" into this shared shell to browse Classes/Notifications/etc.
  // like anyone else - redirecting them back to /admin from here would make
  // that exit impossible. They see the Teacher-style view, since the
  // underlying queries already bypass to platform-wide data for ADMIN.
  if (user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN) {
    const data = await getTeacherDashboardData();
    return (
      <PageContainer>
        <SectionHeader
          title="Dashboard"
          description="Your classes, review queue, and upcoming content at a glance."
        />
        <TeacherDashboardView data={data} />
      </PageContainer>
    );
  }

  const [data, classrooms] = await Promise.all([
    getStudentDashboardData(),
    getUserClassroomsAction(),
  ]);
  return (
    <PageContainer>
      <SectionHeader
        title="Dashboard"
        description="Your classes, upcoming deadlines, and archived classes at a glance."
      />
      <StudentDashboardView data={data} classrooms={classrooms} />
    </PageContainer>
  );
}
