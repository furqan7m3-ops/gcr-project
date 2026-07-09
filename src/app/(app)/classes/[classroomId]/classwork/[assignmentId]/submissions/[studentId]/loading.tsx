import { Skeleton } from "@/components/ui/skeleton";

export default function SubmissionReviewLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
