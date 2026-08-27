import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatNumber } from '@/lib/format'

interface PaginationProps {
  page: number
  pageCount: number
  pageSize: number
  filteredCount: number
  totalCount: number
  onPageChange: (page: number) => void
  /** Noun used in the summary line, e.g. "services". */
  noun?: string
}

export function Pagination({
  page,
  pageCount,
  pageSize,
  filteredCount,
  totalCount,
  onPageChange,
  noun = 'records',
}: PaginationProps) {
  const first = filteredCount === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, filteredCount)

  const buttonClass =
    'inline-flex h-8 items-center gap-1 rounded-md border border-ink-300 bg-white px-2.5 text-sm text-ink-700 ' +
    'hover:bg-ink-50 disabled:opacity-40 disabled:pointer-events-none'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 bg-white px-4 py-3">
      <p className="text-xs text-ink-500">
        Showing <span className="font-medium text-ink-700">{formatNumber(first)}</span>–
        <span className="font-medium text-ink-700">{formatNumber(last)}</span> of{' '}
        <span className="font-medium text-ink-700">{formatNumber(filteredCount)}</span> {noun}
        {filteredCount !== totalCount ? ` (filtered from ${formatNumber(totalCount)})` : ''}
      </p>

      {pageCount > 1 ? (
        <div className="flex items-center gap-1.5">
          <button className={buttonClass} onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="size-3.5" />
            Previous
          </button>
          <span className="px-2 text-xs text-ink-500">
            Page {page} of {pageCount}
          </span>
          <button className={buttonClass} onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
            Next
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
