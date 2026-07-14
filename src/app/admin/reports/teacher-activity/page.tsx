import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";

import {
  getClassroomOptionsAction,
  getTeacherActivityReportAction,
} from "@/features/admin/reports/actions/detailed-report-queries";
import { ReportFilterBar } from "@/features/admin/reports/components/report-filter-bar";
import { ReportTable } from "@/features/admin/reports/components/report-table";
import type { TeacherActivityRow } from "@/features/admin/reports/detailed-types";
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

const PATH = "/admin/reports/teacher-activity";

function formatCell(row: TeacherActivityRow, key: keyof TeacherActivityRow) {
  if (key === "lastActiveAt") {
    return formatDate(row.lastActiveAt);
  }
  return String(row[key] ?? "—");
}

export default async function TeacherActivityReportPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const { sortField, sortDir } = parseSortParam(getStringParam(resolved, "sort"), {
    field: "teacherName",
    dir: "asc",
  });
  const classroomId = getStringParam(resolved, "classroomId");
  const search = getStringParam(resolved, "q");

  const [{ rows, columns }, classroomOptions] = await Promise.all([
    getTeacherActivityReportAction({ search, sortField, sortDir, classroomId }),
    getClassroomOptionsAction(),
  ]);

  const buildSortHref = buildSortHrefFactory(PATH, resolved, sortField, sortDir);

  return (
    <PageContainer>
      <SectionHeader
        title="Teacher activity"
        description="Classrooms managed, content created, and grading activity per teacher."
        breadcrumbs={[{ label: "Reports", href: "/admin/reports" }, { label: "Teacher activity" }]}
        breadcrumbsHomeHref="/admin"
      />

      <ReportFilterBar
        searchPlaceholder="Search by name or email"
        selectFilters={[
          {
            param: "classroomId",
            label: "All classrooms",
            options: classroomOptions.map((classroom) => ({
              value: classroom.id,
              label: classroom.title,
            })),
          },
        ]}
      />

      <ReportTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.teacherId}
        sortField={sortField}
        sortDir={sortDir}
        buildSortHref={buildSortHref}
        formatCell={formatCell}
        emptyTitle="No teachers found"
        emptyDescription="Try a different search or classroom filter."
      />
    </PageContainer>
  );
}
