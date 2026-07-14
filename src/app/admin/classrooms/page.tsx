import { School } from "lucide-react";

import { PageContainer } from "@/components/page/page-container";
import { Pagination } from "@/components/page/pagination";
import { SectionHeader } from "@/components/page/section-header";
import { EmptyState } from "@/components/states/empty-state";
import { ClassroomStatus } from "@/generated/prisma/enums";

import { getClassroomsPageAction } from "@/features/admin/classrooms/actions/classroom-admin-queries";
import { ClassroomsTable } from "@/features/admin/classrooms/components/classrooms-table";
import { ClassroomsToolbar } from "@/features/admin/classrooms/components/classrooms-toolbar";
import type {
  ClassroomSortField,
  ListClassroomsParams,
  SortDirection,
} from "@/features/admin/classrooms/types";

interface AdminClassroomsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const sortFields: ClassroomSortField[] = ["title", "status", "createdAt", "memberCount"];

function parseParams(
  searchParams: Record<string, string | string[] | undefined>,
): ListClassroomsParams {
  const q = searchParams.q;
  const search = typeof q === "string" && q.trim() ? q.trim() : undefined;

  const statusParam = searchParams.status;
  const status =
    typeof statusParam === "string" && statusParam in ClassroomStatus
      ? (statusParam as ClassroomStatus)
      : undefined;

  const sortParam = typeof searchParams.sort === "string" ? searchParams.sort : "";
  const [sortFieldRaw, sortDirRaw] = sortParam.split(":");
  const sortField = sortFields.includes(sortFieldRaw as ClassroomSortField)
    ? (sortFieldRaw as ClassroomSortField)
    : undefined;
  const sortDir: SortDirection = sortDirRaw === "asc" ? "asc" : "desc";

  const pageParam = typeof searchParams.page === "string" ? Number(searchParams.page) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  return { search, status, sortField, sortDir, page };
}

export default async function AdminClassroomsPage({ searchParams }: AdminClassroomsPageProps) {
  const resolvedSearchParams = await searchParams;
  const params = parseParams(resolvedSearchParams);

  const classroomsPage = await getClassroomsPageAction(params);

  return (
    <PageContainer>
      <SectionHeader
        title="Classrooms"
        description="View, archive, restore, and reassign classrooms across the platform."
        breadcrumbs={[{ label: "Classrooms" }]}
        breadcrumbsHomeHref="/admin"
      />

      <ClassroomsToolbar />

      {classroomsPage.classrooms.length === 0 ? (
        <EmptyState
          icon={School}
          title="No classrooms found"
          description="Try a different search or filter."
        />
      ) : (
        <>
          <ClassroomsTable
            classrooms={classroomsPage.classrooms}
            sortField={params.sortField}
            sortDir={params.sortDir ?? "desc"}
          />
          <Pagination
            page={classroomsPage.page}
            totalPages={classroomsPage.totalPages}
            total={classroomsPage.total}
            pageSize={classroomsPage.pageSize}
            itemLabel="classrooms"
          />
        </>
      )}
    </PageContainer>
  );
}
