import {
  Bell,
  ClipboardList,
  FileCheck,
  GraduationCap,
  Megaphone,
  School,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { PageContainer } from "@/components/page/page-container";
import { StatGrid } from "@/components/page/dashboard-grid";
import { SectionHeader } from "@/components/page/section-header";
import { StatCard } from "@/components/page/stat-card";

import { getReportsDataAction } from "@/features/admin/reports/actions/report-queries";
import { DetailedReportsLinks } from "@/features/admin/reports/components/detailed-reports-links";
import { PlatformGrowthChart } from "@/features/admin/reports/components/platform-growth-chart";
import { RecentActivityList } from "@/features/admin/reports/components/recent-activity-list";
import { SystemOverviewPanel } from "@/features/admin/reports/components/system-overview-panel";

export default async function AdminReportsPage() {
  const { stats, overview, recentActivity, growth } = await getReportsDataAction();

  return (
    <PageContainer>
      <SectionHeader
        title="Reports"
        description="Platform-wide analytics across users, classrooms, and activity."
        breadcrumbs={[{ label: "Reports" }]}
        breadcrumbsHomeHref="/admin"
      />

      <StatGrid>
        <StatCard label="Total users" value={stats.totalUsers} icon={Users} />
        <StatCard label="Teachers" value={stats.teacherCount} icon={GraduationCap} />
        <StatCard label="Students" value={stats.studentCount} icon={UserRound} />
        <StatCard label="Admins" value={stats.adminCount} icon={ShieldCheck} />
        <StatCard label="Classrooms" value={stats.classroomCount} icon={School} />
        <StatCard label="Assignments" value={stats.assignmentCount} icon={ClipboardList} />
        <StatCard label="Submissions" value={stats.submissionCount} icon={FileCheck} />
        <StatCard label="Announcements" value={stats.announcementCount} icon={Megaphone} />
        <StatCard label="Notifications" value={stats.notificationCount} icon={Bell} />
      </StatGrid>

      <PlatformGrowthChart growth={growth} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">System overview</h2>
        <SystemOverviewPanel overview={overview} />
      </div>

      <RecentActivityList items={recentActivity} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Generate a report</h2>
        <DetailedReportsLinks />
      </div>
    </PageContainer>
  );
}
