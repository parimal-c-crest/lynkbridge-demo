import { useNavigate } from 'react-router-dom'
import { intensityFill, intensityInk } from './ChartFrame'
import type { MatrixCell } from '@/data/selectors'

/**
 * Grid of counts across two dimensions.
 *
 * A grid rather than a stacked bar because the reader's job is to find the hot
 * cell, not to compare totals. One hue, more-is-darker — the cells are counts of
 * the same thing, so a second hue would invent a distinction.
 *
 * The number is printed in every cell, so the colour is reinforcement rather
 * than the only encoding.
 */
export function Heatmap({
  rows,
  columns,
  cells,
  hrefFor,
  ariaLabel,
}: {
  rows: string[]
  columns: string[]
  cells: MatrixCell[]
  hrefFor?: (cell: MatrixCell) => string | undefined
  ariaLabel: string
}) {
  const navigate = useNavigate()
  const max = Math.max(...cells.map((cell) => cell.value), 1)
  const valueAt = (row: string, column: string) =>
    cells.find((cell) => cell.row === row && cell.column === column)?.value ?? 0

  return (
    <div className="overflow-x-auto" role="img" aria-label={ariaLabel}>
      <table className="w-full min-w-max border-separate border-spacing-0.5">
        <thead>
          <tr>
            <th className="w-40" />
            {columns.map((column) => (
              <th key={column} scope="col" className="px-1 pb-1 text-center text-[11px] font-medium text-ink-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <th scope="row" className="py-0.5 pr-2 text-right text-xs font-medium text-ink-600">
                {row}
              </th>
              {columns.map((column) => {
                const value = valueAt(row, column)
                const href = value > 0 ? hrefFor?.({ row, column, value }) : undefined

                return (
                  <td key={column} className="p-0">
                    <div
                      className={`grid h-8 place-items-center rounded text-xs font-semibold tabular-nums ${
                        href ? 'cursor-pointer hover:ring-2 hover:ring-brand-300' : ''
                      }`}
                      style={{ background: intensityFill(value, max), color: intensityInk(value, max) }}
                      onClick={href ? () => navigate(href) : undefined}
                      title={`${row} · ${column} priority — ${value} ${value === 1 ? 'ticket' : 'tickets'}`}
                    >
                      {value === 0 ? '·' : value}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
