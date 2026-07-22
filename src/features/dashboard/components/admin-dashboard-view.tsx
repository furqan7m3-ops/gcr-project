import Link from "next/link";
import {
  Archive,
  ArrowRight,
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
        <StatCard label="Announcements" value={platformStats.announcementCount} icon={Megaphone} />
        <StatCard
          label="Submissions"
          value={platformStats.submissionCount}
          icon={FileCheck}
          href="/admin/reports/submission-rates"
        />
      </StatGrid>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Scheduled content</h2>
        <ScheduledContentSummary stats={data.scheduledContent} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Platform activity</h2>
          <Link
            href="/admin/audit-logs"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View audit logs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <RecentActivityList items={data.recentActivity} />
      </section>
    </div>
  );
}
