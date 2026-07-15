import { PageContainer } from "@/components/page/page-container";
import { PageHeaderSkeleton } from "@/components/states/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-10 w-full" />

      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </PageContainer>
  );
}
