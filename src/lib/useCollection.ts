import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSettingsOrDefaults } from '@/state/SettingsContext'

/**
 * One search / filter / sort / paginate engine, shared by every list page.
 *
 * All of it runs against local mock arrays. Keeping it in a single hook means a
 * later swap to server-side querying touches one file rather than a dozen pages.
 */

export interface FilterDef<T> {
  key: string
  label: string
  /** Fixed option list; when omitted the options are derived from the rows. */
  options?: string[]
  value: (row: T) => string
}

export interface SortDef<T> {
  key: string
  label: string
  compare: (a: T, b: T) => number
}

interface Options<T> {
  rows: T[]
  /** Text blob a row is searched against. */
  searchText?: (row: T) => string
  filters?: FilterDef<T>[]
  sorts?: SortDef<T>[]
  defaultSortKey?: string
  /** Overrides the configured page size. Most screens should not set this. */
  pageSize?: number
}

export const ALL = '__all__'

export function useCollection<T>({
  rows,
  searchText,
  filters = [],
  sorts = [],
  defaultSortKey,
  pageSize: pageSizeOverride,
}: Options<T>) {
  // Rows per page is a portal setting, so changing it once moves every list.
  // Read unconditionally — `??` would short-circuit the hook call.
  const configuredPageSize = useSettingsOrDefaults().pageSize
  const pageSize = pageSizeOverride ?? configuredPageSize

  /*
   * The URL is the source of truth for search and filters.
   *
   * That is what makes a chart clickable in a useful way: a segment can link to
   * `/admin/circuits?status=Degraded` and land the reader on the exact rows
   * behind the mark, rather than on an unfiltered list they then have to filter
   * by hand. It also makes any filtered view shareable and survivable across a
   * reload.
   */
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') ?? ''

  const filterValues = useMemo(() => {
    const values: Record<string, string> = {}
    for (const filter of filters) {
      const value = searchParams.get(filter.key)
      if (value) values[filter.key] = value
    }
    return values
  }, [searchParams, filters])

  const [sortKey, setSortKeyRaw] = useState(defaultSortKey ?? sorts[0]?.key ?? '')
  const [page, setPage] = useState(1)

  const writeParams = (mutate: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams)
    mutate(next)
    // replace, so filtering does not fill the back button with every keystroke
    setSearchParams(next, { replace: true })
    // Any change to the result set sends the reader back to page 1 — otherwise
    // filtering while on page 4 silently shows an empty table.
    setPage(1)
  }

  const setQuery = (value: string) => {
    writeParams((params) => {
      if (value) params.set('q', value)
      else params.delete('q')
    })
  }

  const setFilter = (key: string, value: string) => {
    writeParams((params) => {
      if (value && value !== ALL) params.set(key, value)
      else params.delete(key)
    })
  }

  const setSortKey = (key: string) => {
    setSortKeyRaw(key)
    setPage(1)
  }

  const resetFilters = () => {
    writeParams((params) => {
      params.delete('q')
      for (const filter of filters) params.delete(filter.key)
    })
  }

  /** Options offered by each filter, derived from the data when not supplied. */
  const filterOptions = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const filter of filters) {
      map[filter.key] =
        filter.options ?? Array.from(new Set(rows.map(filter.value).filter(Boolean))).sort((a, b) => a.localeCompare(b))
    }
    return map
  }, [filters, rows])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return rows.filter((row) => {
      if (needle && searchText && !searchText(row).toLowerCase().includes(needle)) return false

      for (const filter of filters) {
        const selected = filterValues[filter.key]
        if (selected && selected !== ALL && filter.value(row) !== selected) return false
      }

      return true
    })
  }, [rows, query, searchText, filters, filterValues])

  const sorted = useMemo(() => {
    const sorter = sorts.find((s) => s.key === sortKey)
    return sorter ? [...filtered].sort(sorter.compare) : filtered
  }, [filtered, sorts, sortKey])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize],
  )

  const isFiltered =
    query.trim().length > 0 || Object.values(filterValues).some((value) => value && value !== ALL)

  return {
    query,
    setQuery,
    filterValues,
    setFilter,
    filterOptions,
    resetFilters,
    isFiltered,
    sortKey,
    setSortKey,
    page: safePage,
    setPage,
    pageCount,
    pageSize,
    pageRows,
    totalCount: rows.length,
    filteredCount: sorted.length,
  }
}
