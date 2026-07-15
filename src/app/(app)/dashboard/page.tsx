import { redirect } from "next/navigation";

import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
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

  // Admins have their own dedicated dashboard at /admin (with platform-wide
  // stats this page has no reason to duplicate) - send them there instead of
  // rendering a third, redundant "admin view" at this URL too.
  if (user?.role === UserRole.ADMIN) {
    redirect("/admin");
  }

  if (user?.role === UserRole.TEACHER) {
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

  const data = await getStudentDashboardData();
  return (
    <PageContainer>
      <SectionHeader
        title="Dashboard"
        description="Your classes, upcoming deadlines, and archived classes at a glance."
      />
      <StudentDashboardView data={data} />
    </PageContainer>
  );
}
