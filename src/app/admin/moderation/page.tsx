import { ShieldAlert } from "lucide-react";

import { PageContainer } from "@/components/page/page-container";
import { Pagination } from "@/components/page/pagination";
import { SectionHeader } from "@/components/page/section-header";
import { EmptyState } from "@/components/states/empty-state";
import { ModerationStatus } from "@/generated/prisma/enums";

import { getModeratedContentPageAction } from "@/features/admin/moderation/actions/moderation-queries";
import { ModerationTable } from "@/features/admin/moderation/components/moderation-table";
import { ModerationToolbar } from "@/features/admin/moderation/components/moderation-toolbar";
import type { ModeratedContentType } from "@/features/admin/moderation/types";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const CONTENT_TYPES: ModeratedContentType[] = ["announcement", "comment", "material", "assignment"];

function getStringParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export default async function AdminModerationPage({ searchParams }: PageProps) {
  const resolved = await searchParams;

  const typeParam = getStringParam(resolved, "type");
  const contentType: ModeratedContentType = CONTENT_TYPES.includes(
    typeParam as ModeratedContentType,
  )
    ? (typeParam as ModeratedContentType)
    : "announcement";

  const search = getStringParam(resolved, "q");
  const statusParam = getStringParam(resolved, "status");
  const status =
    statusParam && statusParam in ModerationStatus ? (statusParam as ModerationStatus) : undefined;
  const pageParam = getStringParam(resolved, "page");
  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;

  const moderationPage = await getModeratedContentPageAction({ contentType, search, status, page });

  return (
    <PageContainer>
      <SectionHeader
        title="Content moderation"
        description="Review and moderate announcements, comments, materials, and assignments across every classroom."
        breadcrumbs={[{ label: "Moderation" }]}
        breadcrumbsHomeHref="/admin"
      />

      <ModerationToolbar contentType={contentType} />

      {moderationPage.items.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No content found"
          description="Try a different search, content type, or status filter."
        />
      ) : (
        <>
          <ModerationTable items={moderationPage.items} />
          <Pagination
            page={moderationPage.page}
            totalPages={moderationPage.totalPages}
            total={moderationPage.total}
            pageSize={moderationPage.pageSize}
            itemLabel="items"
          />
        </>
      )}
    </PageContainer>
  );
}
