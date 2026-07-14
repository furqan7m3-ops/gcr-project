import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { AssignmentStatus } from "@/generated/prisma/enums";

import {
  getAssignmentCompletionReportAction,
  getClassroomOptionsAction,
} from "@/features/admin/reports/actions/detailed-report-queries";
import { ReportFilterBar } from "@/features/admin/reports/components/report-filter-bar";
import { ReportTable } from "@/features/admin/reports/components/report-table";
import type { AssignmentCompletionRow } from "@/features/admin/reports/detailed-types";
import { formatDate, formatGrade, formatPercent } from "@/features/admin/reports/lib/report-format";
import {
  buildSortHrefFactory,
  getStringParam,
  parseSortParam,
  type RawSearchParams,
} from "@/features/admin/reports/lib/report-params";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

const PATH = "/admin/reports/assignment-completion";

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
};

function formatCell(row: AssignmentCompletionRow, key: keyof AssignmentCompletionRow) {
  switch (key) {
    case "dueDate":
      return formatDate(row.dueDate);
    case "completionRate":
      return formatPercent(row.completionRate);
    case "averageGrade":
      return formatGrade(row.averageGrade);
    case "status":
      return statusLabels[row.status] ?? row.status;
    default:
      return String(row[key] ?? "—");
  }
}

export default async function AssignmentCompletionReportPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const { sortField, sortDir } = parseSortParam(getStringParam(resolved, "sort"), {
    field: "dueDate",
    dir: "desc",
  });
  const classroomId = getStringParam(resolved, "classroomId");
  const status = getStringParam(resolved, "status");
  const search = getStringParam(resolved, "q");

  const [{ rows, columns }, classroomOptions] = await Promise.all([
    getAssignmentCompletionReportAction({ search, sortField, sortDir, classroomId, status }),
    getClassroomOptionsAction(),
  ]);

  const buildSortHref = buildSortHrefFactory(PATH, resolved, sortField, sortDir);

  return (
    <PageContainer>
      <SectionHeader
        title="Assignment completion"
        description="Submission counts and completion rates per assignment."
        breadcrumbs={[
          { label: "Reports", href: "/admin/reports" },
          { label: "Assignment completion" },
        ]}
        breadcrumbsHomeHref="/admin"
      />

      <ReportFilterBar
        searchPlaceholder="Search by title"
        selectFilters={[
          {
            param: "classroomId",
            label: "All classrooms",
            options: classroomOptions.map((classroom) => ({
              value: classroom.id,
              label: classroom.title,
            })),
          },
          {
            param: "status",
            label: "All statuses",
            options: Object.values(AssignmentStatus).map((value) => ({
              value,
              label: statusLabels[value] ?? value,
            })),
          },
        ]}
      />

      <ReportTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.assignmentId}
        sortField={sortField}
        sortDir={sortDir}
        buildSortHref={buildSortHref}
        formatCell={formatCell}
        emptyTitle="No assignments found"
        emptyDescription="Try a different search, classroom, or status filter."
      />
    </PageContainer>
  );
}
