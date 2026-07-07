import { PageContainer } from "@/components/page/page-container";
import { PageSkeleton } from "@/components/states/skeletons";

export default function AppLoading() {
  return (
    <PageContainer>
      <PageSkeleton />
    </PageContainer>
  );
}
