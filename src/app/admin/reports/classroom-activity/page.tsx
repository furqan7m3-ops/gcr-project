import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { ClassroomStatus } from "@/generated/prisma/enums";

import { getClassroomActivityReportAction } from "@/features/admin/reports/actions/detailed-report-queries";
import { ReportFilterBar } from "@/features/admin/reports/components/report-filter-bar";
import { ReportTable } from "@/features/admin/reports/components/report-table";
import type { ClassroomActivityRow } from "@/features/admin/reports/detailed-types";
import { formatDate } from "@/features/admin/reports/lib/report-format";
import {
  buildSortHrefFactory,
  getStringParam,
  parseSortParam,
  type RawSearchParams,
} from "@/features/admin/reports/lib/report-params";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

const PATH = "/admin/reports/classroom-activity";

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
  DELETED: "Deleted",
};

function formatCell(row: ClassroomActivityRow, key: keyof ClassroomActivityRow) {
  switch (key) {
    case "lastActivityAt":
      return formatDate(row.lastActivityAt);
    case "status":
      return statusLabels[row.status] ?? row.status;
    default:
      return String(row[key] ?? "—");
  }
}

export default async function ClassroomActivityReportPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const { sortField, sortDir } = parseSortParam(getStringParam(resolved, "sort"), {
    field: "lastActivityAt",
    dir: "desc",
  });
  const status = getStringParam(resolved, "status");
  const search = getStringParam(resolved, "q");

  const { rows, columns } = await getClassroomActivityReportAction({
    search,
    sortField,
    sortDir,
    status: status as ClassroomStatus | undefined,
  });

  const buildSortHref = buildSortHrefFactory(PATH, resolved, sortField, sortDir);

  return (
    <PageContainer>
      <SectionHeader
        title="Classroom activity"
        description="Membership, content, and recent activity per classroom."
        breadcrumbs={[
          { label: "Reports", href: "/admin/reports" },
          { label: "Classroom activity" },
        ]}
        breadcrumbsHomeHref="/admin"
      />

      <ReportFilterBar
        searchPlaceholder="Search by classroom"
        selectFilters={[
          {
            param: "status",
            label: "All statuses",
            options: Object.values(ClassroomStatus).map((value) => ({
              value,
              label: statusLabels[value] ?? value,
            })),
          },
        ]}
      />

      <ReportTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.classroomId}
        sortField={sortField}
        sortDir={sortDir}
        buildSortHref={buildSortHref}
        formatCell={formatCell}
        emptyTitle="No classrooms found"
        emptyDescription="Try a different search or status filter."
      />
    </PageContainer>
  );
}
