"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UsersPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export function UsersPagination({ page, totalPages, total, pageSize }: UsersPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pageHref(targetPage: number): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(targetPage));
    return `${pathname}?${params.toString()}`;
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {rangeStart}-{rangeEnd} of {total} users
      </p>
      <div className="flex items-center gap-2">
        <Button
          asChild={page > 1}
          variant="outline"
          size="sm"
          disabled={page <= 1}
          className={cn(page <= 1 && "pointer-events-none opacity-50")}
        >
          {page > 1 ? (
            <Link href={pageHref(page - 1)}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Link>
          ) : (
            <span>
              <ChevronLeft className="h-4 w-4" /> Previous
            </span>
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          asChild={page < totalPages}
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          className={cn(page >= totalPages && "pointer-events-none opacity-50")}
        >
          {page < totalPages ? (
            <Link href={pageHref(page + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span>
              Next <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
