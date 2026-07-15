import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { AdminDashboardView } from "@/features/dashboard/components/admin-dashboard-view";
import { getAdminDashboardData } from "@/features/dashboard/queries/dashboard-queries";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <PageContainer>
      <SectionHeader
        title="Admin dashboard"
        description="Platform-wide oversight for users, classrooms, scheduled content, and activity."
      />
      <AdminDashboardView data={data} />
    </PageContainer>
  );
}
