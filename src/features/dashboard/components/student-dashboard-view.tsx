import { Archive, BookOpen } from "lucide-react";

import { StatGrid } from "@/components/page/dashboard-grid";
import { StatCard } from "@/components/page/stat-card";

import type { StudentDashboardData } from "../types";
import { ArchivedClassroomsSection } from "./archived-classrooms-section";
import { UpcomingDeadlinesList } from "./upcoming-deadlines-list";

export function StudentDashboardView({ data }: { data: StudentDashboardData }) {
  return (
    <div className="flex flex-col gap-6">
      <StatGrid>
        <StatCard label="Active classes" value={data.activeClassroomCount} icon={BookOpen} />
        <StatCard label="Archived classes" value={data.archivedClassrooms.length} icon={Archive} />
      </StatGrid>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Upcoming deadlines</h2>
        <UpcomingDeadlinesList items={data.upcomingDeadlines} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Archived classes</h2>
        <ArchivedClassroomsSection classrooms={data.archivedClassrooms} />
      </section>
    </div>
  );
}
