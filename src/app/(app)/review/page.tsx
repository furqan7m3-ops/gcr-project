import { notFound } from "next/navigation";

import { PageContainer } from "@/components/page/page-container";
import { Pagination } from "@/components/page/pagination";
import { SectionHeader } from "@/components/page/section-header";

import { ReviewFilterBar } from "@/features/review/components/review-filter-bar";
import { ReviewQueueTable } from "@/features/review/components/review-queue-table";
import { ReviewSummaryCards } from "@/features/review/components/review-summary-cards";
import type { RawSearchParams } from "@/features/review/lib/review-params";
import { parseReviewFilters } from "@/features/review/lib/review-params";
import { getReviewQueue } from "@/features/review/queries/review-queries";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

export default async function ReviewPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const filters = parseReviewFilters(resolved);

  const result = await getReviewQueue(filters);

  if (!result) {
    notFound();
  }

  return (
    <PageContainer>
      <SectionHeader
        title="To review"
        description="Student submissions across your classes that need grading, are late, or were recently returned."
      />

      <ReviewSummaryCards summary={result.summary} />

      <ReviewFilterBar filterOptions={result.filterOptions} />

      <ReviewQueueTable rows={result.rows} currentSort={filters.sort} searchParams={resolved} />

      {result.total > 0 ? (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          itemLabel="submissions"
        />
      ) : null}
    </PageContainer>
  );
}
