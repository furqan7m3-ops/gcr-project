import { PageContainer } from "@/components/page/page-container";
import { PageHeaderSkeleton, ListSkeleton } from "@/components/states/skeletons";

export default function AdminLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <ListSkeleton rows={8} />
    </PageContainer>
  );
}
