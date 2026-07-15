import { PageContainer } from "@/components/page/page-container";
import { PageHeaderSkeleton } from "@/components/states/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-[480px] w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </PageContainer>
  );
}
