import type { SortDirection } from "../detailed-types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseSortParam(
  sortParam: string | undefined,
  defaults: { field: string; dir: SortDirection },
): { sortField: string; sortDir: SortDirection } {
  if (!sortParam) {
    return { sortField: defaults.field, sortDir: defaults.dir };
  }

  const [field, dir] = sortParam.split(":");

  return {
    sortField: field || defaults.field,
    sortDir: dir === "asc" || dir === "desc" ? dir : defaults.dir,
  };
}

export function getStringParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Builds a factory that produces "click to sort by this column" hrefs from a server component. */
export function buildSortHrefFactory(
  pathname: string,
  searchParams: RawSearchParams,
  currentField: string,
  currentDir: SortDirection,
) {
  return (field: string) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string") {
        params.set(key, value);
      }
    }

    const nextDir: SortDirection = currentField === field && currentDir === "asc" ? "desc" : "asc";
    params.set("sort", `${field}:${nextDir}`);

    return `${pathname}?${params.toString()}`;
  };
}
