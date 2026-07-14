import { Users } from "lucide-react";

import { PageContainer } from "@/components/page/page-container";
import { Pagination } from "@/components/page/pagination";
import { SectionHeader } from "@/components/page/section-header";
import { EmptyState } from "@/components/states/empty-state";

import { getActiveSessionsAction } from "@/features/admin/security/actions/security-queries";
import { SessionsTable } from "@/features/admin/security/components/sessions-table";
import { getStringParam, type RawSearchParams } from "@/features/admin/reports/lib/report-params";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

export default async function ActiveSessionsPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const pageParam = getStringParam(resolved, "page");
  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;

  const sessionsPage = await getActiveSessionsAction({ page });

  return (
    <PageContainer>
      <SectionHeader
        title="Active sessions"
        description="Every currently valid signed-in session across the platform."
        breadcrumbs={[{ label: "Security", href: "/admin/security" }, { label: "Active sessions" }]}
        breadcrumbsHomeHref="/admin"
      />

      {sessionsPage.items.length === 0 ? (
        <EmptyState icon={Users} title="No active sessions" />
      ) : (
        <>
          <SessionsTable items={sessionsPage.items} />
          <Pagination
            page={sessionsPage.page}
            totalPages={sessionsPage.totalPages}
            total={sessionsPage.total}
            pageSize={sessionsPage.pageSize}
            itemLabel="sessions"
          />
        </>
      )}
    </PageContainer>
  );
}
