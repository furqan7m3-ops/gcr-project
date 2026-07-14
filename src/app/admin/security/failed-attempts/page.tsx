import { ShieldAlert } from "lucide-react";

import { PageContainer } from "@/components/page/page-container";
import { Pagination } from "@/components/page/pagination";
import { SectionHeader } from "@/components/page/section-header";
import { EmptyState } from "@/components/states/empty-state";

import { getFailedLoginAttemptsAction } from "@/features/admin/security/actions/security-queries";
import { FailedAttemptsTable } from "@/features/admin/security/components/failed-attempts-table";
import { getStringParam, type RawSearchParams } from "@/features/admin/reports/lib/report-params";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

export default async function FailedLoginAttemptsPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const pageParam = getStringParam(resolved, "page");
  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;

  const attemptsPage = await getFailedLoginAttemptsAction({ page });

  return (
    <PageContainer>
      <SectionHeader
        title="Failed login attempts"
        description="Every unsuccessful sign-in attempt, most recent first."
        breadcrumbs={[
          { label: "Security", href: "/admin/security" },
          { label: "Failed login attempts" },
        ]}
        breadcrumbsHomeHref="/admin"
      />

      {attemptsPage.items.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No failed attempts recorded" />
      ) : (
        <>
          <FailedAttemptsTable items={attemptsPage.items} />
          <Pagination
            page={attemptsPage.page}
            totalPages={attemptsPage.totalPages}
            total={attemptsPage.total}
            pageSize={attemptsPage.pageSize}
            itemLabel="attempts"
          />
        </>
      )}
    </PageContainer>
  );
}
