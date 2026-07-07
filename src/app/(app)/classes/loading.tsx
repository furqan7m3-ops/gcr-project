import { PageContainer } from "@/components/page/page-container";
import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/states/skeletons";

export default function ClassesLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </PageContainer>
  );
}
