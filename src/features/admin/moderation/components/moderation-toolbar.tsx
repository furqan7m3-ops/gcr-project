"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { allModerationStatuses, contentTypeOptions, statusLabels } from "../lib/moderation-display";
import type { ModerationClassroomOption, ModeratedContentType } from "../types";

interface ModerationToolbarProps {
  contentType: ModeratedContentType;
  classroomOptions: ModerationClassroomOption[];
}

export function ModerationToolbar({ contentType, classroomOptions }: ModerationToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debouncedSearch = useDebouncedValue(search, 300);

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (debouncedSearch === (searchParams.get("q") ?? "")) {
      return;
    }
    updateParams({ q: debouncedSearch || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select
        aria-label="Content type"
        value={contentType}
        onChange={(event) => updateParams({ type: event.target.value })}
        className="sm:w-48"
      >
        {contentTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search content"
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <Select
        aria-label="Filter by status"
        value={searchParams.get("status") ?? ""}
        onChange={(event) => updateParams({ status: event.target.value || null })}
        className="sm:w-44"
      >
        <option value="">All statuses</option>
        {allModerationStatuses.map((status) => (
          <option key={status} value={status}>
            {statusLabels[status]}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Filter by class"
        value={searchParams.get("classroomId") ?? ""}
        onChange={(event) => updateParams({ classroomId: event.target.value || null })}
        className="sm:w-48"
      >
        <option value="">All classes</option>
        {classroomOptions.map((classroom) => (
          <option key={classroom.id} value={classroom.id}>
            {classroom.title}
          </option>
        ))}
      </Select>
    </div>
  );
}
