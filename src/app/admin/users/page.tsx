import { Users as UsersIcon } from "lucide-react";

import { getCurrentUser } from "@/auth/session";
import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { EmptyState } from "@/components/states/empty-state";
import { UserRole, UserStatus } from "@/generated/prisma/enums";

import { getUsersPageAction } from "@/features/admin/users/actions/user-queries";
import { CreateUserButton } from "@/features/admin/users/components/create-user-button";
import { UsersPagination } from "@/features/admin/users/components/users-pagination";
import { UsersTable } from "@/features/admin/users/components/users-table";
import { UsersToolbar } from "@/features/admin/users/components/users-toolbar";
import type { ListUsersParams, SortDirection, UserSortField } from "@/features/admin/users/types";

interface AdminUsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const sortFields: UserSortField[] = ["name", "email", "role", "status", "createdAt"];

function parseParams(searchParams: Record<string, string | string[] | undefined>): ListUsersParams {
  const q = searchParams.q;
  const search = typeof q === "string" && q.trim() ? q.trim() : undefined;

  const roleParam = searchParams.role;
  const role =
    typeof roleParam === "string" && roleParam in UserRole ? (roleParam as UserRole) : undefined;

  const statusParam = searchParams.status;
  const status =
    typeof statusParam === "string" && statusParam in UserStatus
      ? (statusParam as UserStatus)
      : undefined;

  const sortParam = typeof searchParams.sort === "string" ? searchParams.sort : "";
  const [sortFieldRaw, sortDirRaw] = sortParam.split(":");
  const sortField = sortFields.includes(sortFieldRaw as UserSortField)
    ? (sortFieldRaw as UserSortField)
    : undefined;
  const sortDir: SortDirection = sortDirRaw === "asc" ? "asc" : "desc";

  const pageParam = typeof searchParams.page === "string" ? Number(searchParams.page) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  return { search, role, status, sortField, sortDir, page };
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const resolvedSearchParams = await searchParams;
  const params = parseParams(resolvedSearchParams);

  const [usersPage, currentUser] = await Promise.all([
    getUsersPageAction(params),
    getCurrentUser(),
  ]);

  return (
    <PageContainer>
      <SectionHeader
        title="Users"
        description="Create and manage administrator, teacher, and student accounts."
        breadcrumbs={[{ label: "Users" }]}
        breadcrumbsHomeHref="/admin"
        actions={<CreateUserButton />}
      />

      <UsersToolbar />

      {usersPage.users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description="Try a different search or filter, or create a new user."
        />
      ) : (
        <>
          <UsersTable
            users={usersPage.users}
            currentUserId={currentUser?.id ?? ""}
            sortField={params.sortField}
            sortDir={params.sortDir ?? "desc"}
          />
          <UsersPagination
            page={usersPage.page}
            totalPages={usersPage.totalPages}
            total={usersPage.total}
            pageSize={usersPage.pageSize}
          />
        </>
      )}
    </PageContainer>
  );
}
