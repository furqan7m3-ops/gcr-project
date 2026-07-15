import { PageContainer } from "@/components/page/page-container";
import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/states/skeletons";

export default function SearchResultsLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </PageContainer>
  );
}
