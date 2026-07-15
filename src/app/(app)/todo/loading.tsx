import { PageContainer } from "@/components/page/page-container";
import { ListSkeleton, PageHeaderSkeleton } from "@/components/states/skeletons";

export default function TodoLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <ListSkeleton rows={4} />
    </PageContainer>
  );
}
