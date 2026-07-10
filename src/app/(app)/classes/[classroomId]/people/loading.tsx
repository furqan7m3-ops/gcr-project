import { Skeleton } from "@/components/ui/skeleton";

export default function PeopleLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-48" />

      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex flex-col gap-px overflow-hidden rounded-xl border border-border">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
