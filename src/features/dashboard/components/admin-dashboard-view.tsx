import {
  Archive,
  ClipboardList,
  FileCheck,
  GraduationCap,
  Megaphone,
  School,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { StatGrid } from "@/components/page/dashboard-grid";
import { StatCard } from "@/components/page/stat-card";
import { RecentActivityList } from "@/features/admin/reports/components/recent-activity-list";

import type { AdminDashboardData } from "../types";
import { ScheduledContentSummary } from "./scheduled-content-summary";

export function AdminDashboardView({ data }: { data: AdminDashboardData }) {
  const { platformStats } = data;

  return (
    <div className="flex flex-col gap-6">
      <StatGrid>
        <StatCard label="Total users" value={platformStats.totalUsers} icon={Users} />
        <StatCard label="Teachers" value={platformStats.teacherCount} icon={GraduationCap} />
        <StatCard label="Students" value={platformStats.studentCount} icon={UserRound} />
        <StatCard label="Admins" value={platformStats.adminCount} icon={ShieldCheck} />
        <StatCard label="Classrooms" value={platformStats.classroomCount} icon={School} />
        <StatCard label="Archived classrooms" value={data.archivedClassroomCount} icon={Archive} />
        <StatCard label="Assignments" value={platformStats.assignmentCount} icon={ClipboardList} />
        <StatCard label="Announcements" value={platformStats.announcementCount} icon={Megaphone} />
        <StatCard label="Submissions" value={platformStats.submissionCount} icon={FileCheck} />
      </StatGrid>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Scheduled content</h2>
        <ScheduledContentSummary stats={data.scheduledContent} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Platform activity</h2>
        <RecentActivityList items={data.recentActivity} />
      </section>
    </div>
  );
}
