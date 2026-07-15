import { Search } from "lucide-react";

import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { EmptyState } from "@/components/states/empty-state";

import { SearchResultRow } from "@/features/search/components/search-result-row";
import { SearchTypeFilters } from "@/features/search/components/search-type-filters";
import { ENTITY_TYPE_LABEL_PLURAL } from "@/features/search/lib/search-display";
import { isSearchableQuery, normalizeQuery } from "@/features/search/lib/search-text";
import { getSearchResults } from "@/features/search/queries/search-queries";
import {
  SEARCH_ENTITY_TYPES,
  type SearchEntityType,
  type SearchResults,
} from "@/features/search/types";

interface PageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

const RESULTS_PAGE_LIMIT_PER_TYPE = 20;

function isSearchEntityType(value: string | undefined): value is SearchEntityType {
  return SEARCH_ENTITY_TYPES.includes(value as SearchEntityType);
}

export default async function SearchResultsPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const query = normalizeQuery(resolved.q ?? "");
  const activeType = isSearchEntityType(resolved.type) ? resolved.type : undefined;
  const hasQuery = isSearchableQuery(query);

  const results: SearchResults = hasQuery
    ? await getSearchResults({
        query,
        entityTypes: activeType ? [activeType] : undefined,
        limitPerType: RESULTS_PAGE_LIMIT_PER_TYPE,
      })
    : {
        query,
        totalCount: 0,
        items: [],
        countsByType: {
          classroom: 0,
          announcement: 0,
          assignment: 0,
          material: 0,
          topic: 0,
          user: 0,
        },
      };

  return (
    <PageContainer>
      <SectionHeader
        title="Search"
        description={
          hasQuery
            ? `Results for "${query}"`
            : "Search classes, announcements, assignments, materials, and more."
        }
      />

      {!hasQuery ? (
        <EmptyState
          icon={Search}
          title="Type something to search"
          description="Use the search bar above, or press Ctrl/Cmd + K, to find classes, announcements, assignments, materials, and topics."
        />
      ) : (
        <>
          <SearchTypeFilters
            query={query}
            activeType={activeType}
            countsByType={results.countsByType}
            totalCount={results.totalCount}
          />

          {results.totalCount === 0 ? (
            <EmptyState
              icon={Search}
              title={`No results for "${query}"`}
              description="Try a different term, remove a filter, or check spelling and try again."
            />
          ) : activeType ? (
            <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-2">
              {results.items.map((item) => (
                <SearchResultRow key={`${item.entityType}-${item.id}`} item={item} query={query} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {SEARCH_ENTITY_TYPES.map((type) => {
                const items = results.items.filter((item) => item.entityType === type);
                if (items.length === 0) return null;
                return (
                  <div key={type} className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {ENTITY_TYPE_LABEL_PLURAL[type]}
                    </h2>
                    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-2">
                      {items.map((item) => (
                        <SearchResultRow
                          key={`${item.entityType}-${item.id}`}
                          item={item}
                          query={query}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
