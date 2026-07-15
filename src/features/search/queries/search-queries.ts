import { requireUser } from "@/lib/auth/permissions";

import * as academicContentSearchService from "../services/academic-content-search-service";
import * as classroomSearchService from "../services/classroom-search-service";
import * as searchService from "../services/search-service";
import type {
  AcademicContentSearchFilters,
  ClassroomSearchFilters,
  SearchFilters,
  SearchResults,
} from "../types";

/**
 * Server-only entry point for future RSC usage (e.g. a dedicated /search
 * results page) - authorization is enforced here (a real signed-in user),
 * the actual scoping-by-visibility happens inside the service.
 */
export async function getSearchResults(filters: SearchFilters): Promise<SearchResults> {
  const user = await requireUser();
  return searchService.search(user, filters);
}

/** Server-only entry point for the richer classroom-only search (Phase 15.2). */
export async function getClassroomSearchResults(
  filters: ClassroomSearchFilters,
): Promise<SearchResults> {
  const user = await requireUser();
  return classroomSearchService.searchClassroomsDetailed(user, filters);
}

/** Server-only entry point for the richer academic content search (Phase 15.3). */
export async function getAcademicContentSearchResults(
  filters: AcademicContentSearchFilters,
): Promise<SearchResults> {
  const user = await requireUser();
  return academicContentSearchService.searchAcademicContent(user, filters);
}
