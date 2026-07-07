import { BookOpen, CalendarDays, ClipboardList, Users } from "lucide-react";

import { StatGrid } from "@/components/page/dashboard-grid";
import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { StatCard } from "@/components/page/stat-card";
import { EmptyState } from "@/components/states/empty-state";

export default function DashboardPage() {
  return (
    <PageContainer>
      <SectionHeader
        title="Dashboard"
        description="A shared overview surface for teachers, students, and admins."
      />
      <StatGrid>
        <StatCard label="Active classes" value="—" icon={BookOpen} />
        <StatCard label="Upcoming events" value="—" icon={CalendarDays} />
        <StatCard label="Pending work" value="—" icon={ClipboardList} />
        <StatCard label="People" value="—" icon={Users} />
      </StatGrid>
      <EmptyState
        icon={BookOpen}
        title="No classes yet"
        description="Once classroom features ship, your classes will appear here."
      />
    </PageContainer>
  );
}
