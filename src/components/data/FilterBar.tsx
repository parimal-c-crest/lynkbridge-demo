import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { ALL } from '@/lib/useCollection'

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-md border border-ink-300 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
      />
    </div>
  )
}

interface FilterBarProps {
  query: string
  onQueryChange: (value: string) => void
  searchPlaceholder?: string
  filters: Array<{ key: string; label: string; options: string[] }>
  values: Record<string, string>
  onFilterChange: (key: string, value: string) => void
  sorts?: Array<{ key: string; label: string }>
  sortKey?: string
  onSortChange?: (key: string) => void
  isFiltered: boolean
  onReset: () => void
  /** Right-aligned page actions (Create, Upload, Export…). */
  actions?: ReactNode
}

export function FilterBar({
  query,
  onQueryChange,
  searchPlaceholder,
  filters,
  values,
  onFilterChange,
  sorts = [],
  sortKey,
  onSortChange,
  isFiltered,
  onReset,
  actions,
}: FilterBarProps) {
  const selectClass =
    'h-9 rounded-md border border-ink-300 bg-white px-2.5 text-sm text-ink-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none'

  return (
    <div className="flex flex-col gap-3 border-b border-ink-200 bg-white px-4 py-3 lg:flex-row lg:items-center">
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder={searchPlaceholder}
        className="w-full lg:max-w-xs"
      />

      <div className="flex flex-wrap items-center gap-2">
        {filters.length ? (
          <SlidersHorizontal className="hidden size-4 shrink-0 text-ink-400 sm:block" aria-hidden />
        ) : null}

        {filters.map((filter) => (
          <label key={filter.key} className="flex items-center gap-1.5">
            <span className="sr-only">{filter.label}</span>
            <select
              value={values[filter.key] ?? ALL}
              onChange={(event) => onFilterChange(filter.key, event.target.value)}
              className={selectClass}
            >
              <option value={ALL}>All {filter.label.toLowerCase()}</option>
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}

        {sorts.length && onSortChange ? (
          <label className="flex items-center gap-1.5">
            <span className="sr-only">Sort by</span>
            <select value={sortKey} onChange={(event) => onSortChange(event.target.value)} className={selectClass}>
              {sorts.map((sort) => (
                <option key={sort.key} value={sort.key}>
                  Sort: {sort.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {isFiltered ? (
          <button
            onClick={onReset}
            className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="size-3.5" />
            Clear
          </button>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-2 lg:ml-auto">{actions}</div> : null}
    </div>
  )
}
