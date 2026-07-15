"use server";

import { requireUser } from "@/lib/auth/permissions";

import * as academicContentSearchService from "../services/academic-content-search-service";
import * as classroomSearchService from "../services/classroom-search-service";
import * as searchService from "../services/search-service";
import type {
  AcademicContentSearchFilters,
  ClassroomSearchFilters,
  SearchEntityType,
  SearchResults,
} from "../types";

/**
 * The client-invokable global search entry point - this is what a future
 * debounced search box calls on every query change. Thin by design: auth,
 * then delegate straight to the shared service, same as every other
 * feature's action layer.
 */
export async function globalSearchAction(
  query: string,
  entityTypes?: SearchEntityType[],
): Promise<SearchResults> {
  const user = await requireUser();
  return searchService.search(user, { query, entityTypes });
}

/**
 * The client-invokable classroom search entry point (Phase 15.2) - name/code
 * text query, teacher name/email query, and/or a status filter, any
 * combination. Thin by design, same as globalSearchAction above.
 */
export async function searchClassroomsAction(
  filters: ClassroomSearchFilters,
): Promise<SearchResults> {
  const user = await requireUser();
  return classroomSearchService.searchClassroomsDetailed(user, filters);
}

/**
 * The client-invokable academic content search entry point (Phase 15.3) -
 * Assignments/Announcements/Materials/Topics, filterable by classroom,
 * status, and date range, any combination. Thin by design, same as the
 * other search actions above.
 */
export async function searchAcademicContentAction(
  filters: AcademicContentSearchFilters,
): Promise<SearchResults> {
  const user = await requireUser();
  return academicContentSearchService.searchAcademicContent(user, filters);
}
