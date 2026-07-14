import type { SortDirection } from "../detailed-types";

/** Generic row sorter shared by every detailed report - nulls always sort last, regardless of direction. */
export function sortRows<Row>(rows: Row[], field: string, dir: SortDirection): Row[] {
  const multiplier = dir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const av = (a as Record<string, unknown>)[field];
    const bv = (b as Record<string, unknown>)[field];

    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    if (av instanceof Date && bv instanceof Date) {
      return (av.getTime() - bv.getTime()) * multiplier;
    }
    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * multiplier;
    }

    return String(av).localeCompare(String(bv)) * multiplier;
  });
}
