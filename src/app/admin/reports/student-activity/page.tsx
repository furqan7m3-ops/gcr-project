import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";

import {
  getClassroomOptionsAction,
  getStudentActivityReportAction,
} from "@/features/admin/reports/actions/detailed-report-queries";
import { ReportFilterBar } from "@/features/admin/reports/components/report-filter-bar";
import { ReportTable } from "@/features/admin/reports/components/report-table";
import type { StudentActivityRow } from "@/features/admin/reports/detailed-types";
import { formatDate, formatGrade } from "@/features/admin/reports/lib/report-format";
import {
  buildSortHrefFactory,
  getStringParam,
  parseSortParam,
  type RawSearchParams,
} from "@/features/admin/reports/lib/report-params";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

const PATH = "/admin/reports/student-activity";

function formatCell(row: StudentActivityRow, key: keyof StudentActivityRow) {
  if (key === "lastActiveAt") {
    return formatDate(row.lastActiveAt);
  }
  if (key === "averageGrade") {
    return formatGrade(row.averageGrade);
  }
  return String(row[key] ?? "—");
}

export default async function StudentActivityReportPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const { sortField, sortDir } = parseSortParam(getStringParam(resolved, "sort"), {
    field: "studentName",
    dir: "asc",
  });
  const classroomId = getStringParam(resolved, "classroomId");
  const search = getStringParam(resolved, "q");

  const [{ rows, columns }, classroomOptions] = await Promise.all([
    getStudentActivityReportAction({ search, sortField, sortDir, classroomId }),
    getClassroomOptionsAction(),
  ]);

  const buildSortHref = buildSortHrefFactory(PATH, resolved, sortField, sortDir);

  return (
    <PageContainer>
      <SectionHeader
        title="Student activity"
        description="Submissions, grades, and participation per student."
        breadcrumbs={[{ label: "Reports", href: "/admin/reports" }, { label: "Student activity" }]}
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
        getRowId={(row) => row.studentId}
        sortField={sortField}
        sortDir={sortDir}
        buildSortHref={buildSortHref}
        formatCell={formatCell}
        emptyTitle="No students found"
        emptyDescription="Try a different search or classroom filter."
      />
    </PageContainer>
  );
}
