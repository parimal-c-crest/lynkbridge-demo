import type { ReactNode } from 'react'
import { DataTable, type Column } from './DataTable'
import { FilterBar } from './FilterBar'
import { Pagination } from './Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import type { useCollection } from '@/lib/useCollection'

/**
 * The standard list page body: filter bar, table, pagination — in one place.
 *
 * Every list screen in the product uses this, so density, empty states and
 * pagination behave identically everywhere.
 */
interface CollectionTableProps<T> {
  collection: ReturnType<typeof useCollection<T>>
  columns: Column<T>[]
  rowKey: (row: T) => string
  rowHref?: (row: T) => string
  filters?: Array<{ key: string; label: string }>
  sorts?: Array<{ key: string; label: string }>
  searchPlaceholder?: string
  noun?: string
  actions?: ReactNode
  /** Shown when the underlying collection is empty before any filtering. */
  emptyTitle: string
  emptyDescription?: string
  emptyAction?: ReactNode
}

export function CollectionTable<T>({
  collection,
  columns,
  rowKey,
  rowHref,
  filters = [],
  sorts = [],
  searchPlaceholder,
  noun = 'records',
  actions,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: CollectionTableProps<T>) {
  const hasAnyRows = collection.totalCount > 0

  return (
    <div className="surface overflow-hidden">
      <FilterBar
        query={collection.query}
        onQueryChange={collection.setQuery}
        searchPlaceholder={searchPlaceholder}
        filters={filters.map((filter) => ({ ...filter, options: collection.filterOptions[filter.key] ?? [] }))}
        values={collection.filterValues}
        onFilterChange={collection.setFilter}
        sorts={sorts}
        sortKey={collection.sortKey}
        onSortChange={collection.setSortKey}
        isFiltered={collection.isFiltered}
        onReset={collection.resetFilters}
        actions={actions}
      />

      <DataTable
        rows={collection.pageRows}
        columns={columns}
        rowKey={rowKey}
        rowHref={rowHref}
        empty={
          collection.isFiltered ? (
            // Distinguishing "nothing matched your filter" from "nothing exists"
            // is a stated requirement — the recovery action differs.
            <EmptyState
              title="No matching results"
              description="No records match the current search and filters."
              action={
                <Button variant="secondary" size="sm" onClick={collection.resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
          )
        }
      />

      {hasAnyRows ? (
        <Pagination
          page={collection.page}
          pageCount={collection.pageCount}
          pageSize={collection.pageSize}
          filteredCount={collection.filteredCount}
          totalCount={collection.totalCount}
          onPageChange={collection.setPage}
          noun={noun}
        />
      ) : null}
    </div>
  )
}
