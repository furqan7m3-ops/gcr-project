import { Archive, BookOpen } from "lucide-react";

import { StatGrid } from "@/components/page/dashboard-grid";
import { StatCard } from "@/components/page/stat-card";
import { ReviewSummaryCards } from "@/features/review/components/review-summary-cards";

import type { TeacherDashboardData } from "../types";
import { DashboardSection } from "./dashboard-section";
import { ScheduledContentSummary } from "./scheduled-content-summary";
import { UpcomingPublicationsList } from "./upcoming-publications-list";

export function TeacherDashboardView({ data }: { data: TeacherDashboardData }) {
  return (
    <div className="flex flex-col gap-8">
      <StatGrid>
        <StatCard
          label="Active classes"
          value={data.activeClassroomCount}
          icon={BookOpen}
          href="/classes"
        />
        <StatCard
          label="Archived classes"
          value={data.archivedClassroomCount}
          icon={Archive}
          href="/archived"
        />
      </StatGrid>

      {/* Outstanding work first - this is what a teacher usually opens the dashboard for. */}
      <DashboardSection
        title="Review queue"
        description="Student work waiting on you, across all your classes."
        links={[{ href: "/review", label: "Open review queue" }]}
      >
        <ReviewSummaryCards summary={data.reviewSummary} />
      </DashboardSection>

      <DashboardSection
        title="Upcoming publications"
        description="Scheduled content, soonest first."
      >
        <UpcomingPublicationsList items={data.upcomingPublications} />
      </DashboardSection>

      <DashboardSection title="Scheduled content">
        <ScheduledContentSummary stats={data.scheduledContent} />
      </DashboardSection>
    </div>
  );
}
