import { LockKeyhole } from "lucide-react";

import { PageContainer } from "@/components/page/page-container";
import { Pagination } from "@/components/page/pagination";
import { SectionHeader } from "@/components/page/section-header";
import { EmptyState } from "@/components/states/empty-state";

import { getLockedAccountsAction } from "@/features/admin/security/actions/security-queries";
import { LockedAccountsTable } from "@/features/admin/security/components/locked-accounts-table";
import { getStringParam, type RawSearchParams } from "@/features/admin/reports/lib/report-params";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

export default async function LockedAccountsPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const pageParam = getStringParam(resolved, "page");
  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;

  const lockedPage = await getLockedAccountsAction({ page });

  return (
    <PageContainer>
      <SectionHeader
        title="Locked accounts"
        description="Accounts automatically locked after too many failed sign-in attempts."
        breadcrumbs={[{ label: "Security", href: "/admin/security" }, { label: "Locked accounts" }]}
        breadcrumbsHomeHref="/admin"
      />

      {lockedPage.items.length === 0 ? (
        <EmptyState icon={LockKeyhole} title="No locked accounts" />
      ) : (
        <>
          <LockedAccountsTable items={lockedPage.items} />
          <Pagination
            page={lockedPage.page}
            totalPages={lockedPage.totalPages}
            total={lockedPage.total}
            pageSize={lockedPage.pageSize}
            itemLabel="accounts"
          />
        </>
      )}
    </PageContainer>
  );
}
