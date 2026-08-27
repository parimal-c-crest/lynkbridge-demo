import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Hidden below the given breakpoint so dense tables stay readable on mobile. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl'
  align?: 'left' | 'right'
  width?: string
}

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  /** Makes the whole row clickable — the primary navigation mechanism. */
  rowHref?: (row: T) => string
  empty?: ReactNode
  /** Renders skeleton rows instead of data. */
  loading?: boolean
  loadingRows?: number
}

const HIDE_CLASS: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  rowHref,
  empty,
  loading,
  loadingRows = 6,
}: DataTableProps<T>) {
  const navigate = useNavigate()

  if (!loading && rows.length === 0) {
    return <>{empty ?? <EmptyState title="No records found" description="Nothing matches the current view." />}</>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse">
        <thead className="bg-ink-50 border-y border-ink-200">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={`cell-head ${column.hideBelow ? HIDE_CLASS[column.hideBelow] : ''} ${
                  column.align === 'right' ? 'text-right' : ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-ink-200">
          {loading
            ? Array.from({ length: loadingRows }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {columns.map((column) => (
                    <td key={column.key} className={`cell ${column.hideBelow ? HIDE_CLASS[column.hideBelow] : ''}`}>
                      <span className="block h-3 w-full max-w-32 animate-pulse rounded bg-ink-200" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => {
                const href = rowHref?.(row)

                return (
                  <tr
                    key={rowKey(row)}
                    onClick={href ? () => navigate(href) : undefined}
                    onKeyDown={
                      href
                        ? (event) => {
                            if (event.key === 'Enter') navigate(href)
                          }
                        : undefined
                    }
                    tabIndex={href ? 0 : undefined}
                    // `group` lets a cell style itself on row hover — used by the
                    // row-action icons, which otherwise sit invisible until moused.
                    className={`group bg-white ${href ? 'cursor-pointer hover:bg-brand-50/60 focus:bg-brand-50' : ''}`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`cell ${column.hideBelow ? HIDE_CLASS[column.hideBelow] : ''} ${
                          column.align === 'right' ? 'text-right' : ''
                        }`}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                )
              })}
        </tbody>
      </table>
    </div>
  )
}
