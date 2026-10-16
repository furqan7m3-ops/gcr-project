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
import { DashboardSection } from "./dashboard-section";
import { ScheduledContentSummary } from "./scheduled-content-summary";

export function AdminDashboardView({ data }: { data: AdminDashboardData }) {
  const { platformStats } = data;

  return (
    <div className="flex flex-col gap-8">
      <DashboardSection title="People" links={[{ href: "/admin/users", label: "Manage users" }]}>
        <StatGrid>
          <StatCard
            label="Total users"
            value={platformStats.totalUsers}
            icon={Users}
            href="/admin/users"
          />
          <StatCard
            label="Teachers"
            value={platformStats.teacherCount}
            icon={GraduationCap}
            href="/admin/users?role=TEACHER"
          />
          <StatCard
            label="Students"
            value={platformStats.studentCount}
            icon={UserRound}
            href="/admin/users?role=STUDENT"
          />
          <StatCard
            label="Admins"
            value={platformStats.adminCount}
            icon={ShieldCheck}
            href="/admin/users?role=ADMIN"
          />
        </StatGrid>
      </DashboardSection>

      <DashboardSection
        title="Classrooms & content"
        links={[{ href: "/admin/reports", label: "Detailed reports" }]}
      >
        <StatGrid>
          <StatCard
            label="Classrooms"
            value={platformStats.classroomCount}
            icon={School}
            href="/admin/classrooms"
          />
          <StatCard
            label="Archived classrooms"
            value={data.archivedClassroomCount}
            icon={Archive}
            href="/admin/classrooms?status=ARCHIVED"
          />
          <StatCard
            label="Assignments"
            value={platformStats.assignmentCount}
            icon={ClipboardList}
            href="/admin/reports/assignment-completion"
          />
          <StatCard
            label="Announcements"
            value={platformStats.announcementCount}
            icon={Megaphone}
          />
          <StatCard
            label="Submissions"
            value={platformStats.submissionCount}
            icon={FileCheck}
            href="/admin/reports/submission-rates"
          />
        </StatGrid>
      </DashboardSection>

      <DashboardSection title="Scheduled content">
        <ScheduledContentSummary stats={data.scheduledContent} />
      </DashboardSection>

      <DashboardSection
        title="Platform activity"
        links={[{ href: "/admin/audit-logs", label: "View audit logs" }]}
      >
        <RecentActivityList items={data.recentActivity} />
      </DashboardSection>
    </div>
  );
}
