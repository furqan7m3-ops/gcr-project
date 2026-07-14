import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { UserRole } from "@/generated/prisma/enums";

import { getInactiveUsersReportAction } from "@/features/admin/reports/actions/detailed-report-queries";
import { ReportFilterBar } from "@/features/admin/reports/components/report-filter-bar";
import { ReportTable } from "@/features/admin/reports/components/report-table";
import type { InactiveUserRow } from "@/features/admin/reports/detailed-types";
import { formatDate, formatDaysAgo } from "@/features/admin/reports/lib/report-format";
import {
  buildSortHrefFactory,
  getStringParam,
  parseSortParam,
  type RawSearchParams,
} from "@/features/admin/reports/lib/report-params";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

const PATH = "/admin/reports/inactive-users";
const DEFAULT_MIN_DAYS = 30;

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
  PENDING_PASSWORD_CHANGE: "Pending password change",
  ARCHIVED: "Archived",
};

function formatCell(row: InactiveUserRow, key: keyof InactiveUserRow) {
  switch (key) {
    case "lastActiveAt":
      return formatDate(row.lastActiveAt);
    case "accountCreatedAt":
      return formatDate(row.accountCreatedAt);
    case "daysSinceActive":
      return formatDaysAgo(row.daysSinceActive);
    case "role":
      return roleLabels[row.role] ?? row.role;
    case "status":
      return statusLabels[row.status] ?? row.status;
    default:
      return String(row[key] ?? "—");
  }
}

export default async function InactiveUsersReportPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const { sortField, sortDir } = parseSortParam(getStringParam(resolved, "sort"), {
    field: "daysSinceActive",
    dir: "desc",
  });
  const role = getStringParam(resolved, "role");
  const search = getStringParam(resolved, "q");
  const minDaysParam = getStringParam(resolved, "minDays");
  const minDaysInactive = minDaysParam ? Number(minDaysParam) : DEFAULT_MIN_DAYS;

  const { rows, columns } = await getInactiveUsersReportAction({
    search,
    sortField,
    sortDir,
    role: role as UserRole | undefined,
    minDaysInactive: Number.isFinite(minDaysInactive) ? minDaysInactive : DEFAULT_MIN_DAYS,
  });

  const buildSortHref = buildSortHrefFactory(PATH, resolved, sortField, sortDir);

  return (
    <PageContainer>
      <SectionHeader
        title="Inactive users"
        description="Accounts that are disabled, or have had no tracked activity in a while."
        breadcrumbs={[{ label: "Reports", href: "/admin/reports" }, { label: "Inactive users" }]}
        breadcrumbsHomeHref="/admin"
      />

      <ReportFilterBar
        searchPlaceholder="Search by name or email"
        selectFilters={[
          {
            param: "role",
            label: "All roles",
            options: Object.values(UserRole).map((value) => ({
              value,
              label: roleLabels[value] ?? value,
            })),
          },
        ]}
        numberFilter={{
          param: "minDays",
          label: "Min. days inactive",
          defaultValue: DEFAULT_MIN_DAYS,
        }}
      />

      <ReportTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.userId}
        sortField={sortField}
        sortDir={sortDir}
        buildSortHref={buildSortHref}
        formatCell={formatCell}
        emptyTitle="No inactive users"
        emptyDescription="Everyone is active within the selected threshold."
      />
    </PageContainer>
  );
}
