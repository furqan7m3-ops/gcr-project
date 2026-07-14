import { BarChart3, School, ShieldCheck, Users } from "lucide-react";

import { StatGrid } from "@/components/page/dashboard-grid";
import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { StatCard } from "@/components/page/stat-card";
import { EmptyState } from "@/components/states/empty-state";

export default function AdminDashboardPage() {
  return (
    <PageContainer>
      <SectionHeader
        title="Admin dashboard"
        description="Platform-wide oversight for users, classrooms, and activity."
      />
      <StatGrid>
        <StatCard label="Total users" value="—" icon={Users} />
        <StatCard label="Total classrooms" value="—" icon={School} />
        <StatCard label="Reports generated" value="—" icon={BarChart3} />
        <StatCard label="Admins" value="—" icon={ShieldCheck} />
      </StatGrid>
      <EmptyState
        icon={ShieldCheck}
        title="Admin tools are on the way"
        description="User management, classroom oversight, and reporting will appear here in upcoming phases."
      />
    </PageContainer>
  );
}
