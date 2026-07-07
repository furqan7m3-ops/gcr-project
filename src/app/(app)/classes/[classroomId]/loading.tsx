import { PageContainer } from "@/components/page/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClassroomLoading() {
  return (
    <div className="flex flex-col">
      <Skeleton className="h-40 w-full rounded-none sm:h-48" />
      <PageContainer className="gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </PageContainer>
    </div>
  );
}
