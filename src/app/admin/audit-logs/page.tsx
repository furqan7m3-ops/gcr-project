import { ScrollText } from "lucide-react";

import { PageContainer } from "@/components/page/page-container";
import { Pagination } from "@/components/page/pagination";
import { SectionHeader } from "@/components/page/section-header";
import { EmptyState } from "@/components/states/empty-state";

import { getAuditLogsPageAction } from "@/features/admin/audit-logs/actions/audit-log-queries";
import { AuditLogsTable } from "@/features/admin/audit-logs/components/audit-logs-table";
import { ReportFilterBar } from "@/features/admin/reports/components/report-filter-bar";
import { getStringParam, type RawSearchParams } from "@/features/admin/reports/lib/report-params";
import { ADMIN_AUDIT_EVENTS } from "@/lib/audit-log";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

export default async function AdminAuditLogsPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const search = getStringParam(resolved, "q");
  const eventLabel = getStringParam(resolved, "event");
  const pageParam = getStringParam(resolved, "page");
  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;

  const { entries, total, pageSize, totalPages } = await getAuditLogsPageAction({
    search,
    eventLabel,
    page,
  });

  return (
    <PageContainer>
      <SectionHeader
        title="Audit logs"
        description="A record of administrative actions taken across the platform."
        breadcrumbs={[{ label: "Audit logs" }]}
        breadcrumbsHomeHref="/admin"
      />

      <ReportFilterBar
        searchPlaceholder="Search by actor or target"
        selectFilters={[
          {
            param: "event",
            label: "All events",
            options: ADMIN_AUDIT_EVENTS.map((event) => ({
              value: event.label,
              label: event.label,
            })),
          },
        ]}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit events found"
          description="Try a different search or filter."
        />
      ) : (
        <>
          <AuditLogsTable entries={entries} />
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            itemLabel="events"
          />
        </>
      )}
    </PageContainer>
  );
}
