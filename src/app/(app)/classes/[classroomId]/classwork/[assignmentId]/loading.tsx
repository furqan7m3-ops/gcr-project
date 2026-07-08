import { Skeleton } from "@/components/ui/skeleton";

export default function AssignmentDetailLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-48 lg:col-span-2" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
