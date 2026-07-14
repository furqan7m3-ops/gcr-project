import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";

import { getSubmissionRatesReportAction } from "@/features/admin/reports/actions/detailed-report-queries";
import { ReportFilterBar } from "@/features/admin/reports/components/report-filter-bar";
import { ReportTable } from "@/features/admin/reports/components/report-table";
import type { SubmissionRateRow } from "@/features/admin/reports/detailed-types";
import { formatPercent } from "@/features/admin/reports/lib/report-format";
import {
  buildSortHrefFactory,
  getStringParam,
  parseSortParam,
  type RawSearchParams,
} from "@/features/admin/reports/lib/report-params";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

const PATH = "/admin/reports/submission-rates";

function formatCell(row: SubmissionRateRow, key: keyof SubmissionRateRow) {
  if (key === "submissionRate") {
    return formatPercent(row.submissionRate);
  }
  return String(row[key] ?? "—");
}

export default async function SubmissionRatesReportPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const { sortField, sortDir } = parseSortParam(getStringParam(resolved, "sort"), {
    field: "submissionRate",
    dir: "asc",
  });
  const search = getStringParam(resolved, "q");

  const { rows, columns } = await getSubmissionRatesReportAction({ search, sortField, sortDir });

  const buildSortHref = buildSortHrefFactory(PATH, resolved, sortField, sortDir);

  return (
    <PageContainer>
      <SectionHeader
        title="Submission rates"
        description="How much of each classroom's expected work has actually been turned in."
        breadcrumbs={[{ label: "Reports", href: "/admin/reports" }, { label: "Submission rates" }]}
        breadcrumbsHomeHref="/admin"
      />

      <ReportFilterBar searchPlaceholder="Search by classroom" />

      <ReportTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.classroomId}
        sortField={sortField}
        sortDir={sortDir}
        buildSortHref={buildSortHref}
        formatCell={formatCell}
        emptyTitle="No classrooms found"
        emptyDescription="Try a different search."
      />
    </PageContainer>
  );
}
