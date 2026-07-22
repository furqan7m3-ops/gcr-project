import Link from "next/link";
import { Archive, ArrowRight, BookOpen } from "lucide-react";

import { StatGrid } from "@/components/page/dashboard-grid";
import { StatCard } from "@/components/page/stat-card";
import { ReviewSummaryCards } from "@/features/review/components/review-summary-cards";

import type { TeacherDashboardData } from "../types";
import { ScheduledContentSummary } from "./scheduled-content-summary";
import { UpcomingPublicationsList } from "./upcoming-publications-list";

export function TeacherDashboardView({ data }: { data: TeacherDashboardData }) {
  return (
    <div className="flex flex-col gap-6">
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

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Review queue</h2>
          <Link
            href="/review"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Open review queue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ReviewSummaryCards summary={data.reviewSummary} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Scheduled content</h2>
        <ScheduledContentSummary stats={data.scheduledContent} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Upcoming publications</h2>
        <UpcomingPublicationsList items={data.upcomingPublications} />
      </section>
    </div>
  );
}
