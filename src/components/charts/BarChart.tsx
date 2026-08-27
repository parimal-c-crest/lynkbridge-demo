import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sequentialFill } from './ChartFrame'

export interface BarRow {
  label: string
  value: number
  /** Full route to the records behind the bar. */
  href?: string
}

/**
 * Horizontal bar chart for comparing magnitudes across named categories.
 *
 * Horizontal because the category names are words, not dates — vertical columns
 * would force rotated labels. One hue, more-is-darker, sorted descending: these
 * are magnitudes of a single measure, so a categorical palette would imply a
 * distinction that is not there.
 *
 * Every bar carries a visible value, so nothing is encoded by colour alone.
 */
export function BarChart({
  rows,
  formatValue,
  maxRows = 8,
  ariaLabel,
}: {
  rows: BarRow[]
  formatValue: (value: number) => string
  maxRows?: number
  ariaLabel: string
}) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<number | null>(null)

  const visible = rows.slice(0, maxRows)
  const max = Math.max(...visible.map((row) => row.value), 1)
  const hiddenCount = rows.length - visible.length

  return (
    <div role="img" aria-label={ariaLabel}>
      <ul className="space-y-2.5">
        {visible.map((row, index) => {
          const share = row.value / max
          const isInteractive = Boolean(row.href)

          return (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-xs font-medium text-ink-700">{row.label}</span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-900">
                  {formatValue(row.value)}
                </span>
              </div>

              <div
                className={`mt-1 h-2.5 w-full rounded-full bg-ink-100 ${isInteractive ? 'cursor-pointer' : ''}`}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onClick={row.href ? () => navigate(row.href!) : undefined}
                onKeyDown={
                  row.href
                    ? (event) => {
                        if (event.key === 'Enter') navigate(row.href!)
                      }
                    : undefined
                }
                tabIndex={isInteractive ? 0 : undefined}
                role={isInteractive ? 'link' : undefined}
                aria-label={isInteractive ? `${row.label}, ${formatValue(row.value)}` : undefined}
                title={`${row.label} — ${formatValue(row.value)}`}
              >
                {/* Rounded data-end, anchored to the baseline at the left. */}
                <div
                  className="h-full rounded-full transition-[width,opacity] duration-200"
                  style={{
                    width: `${Math.max(share * 100, 1.5)}%`,
                    background: sequentialFill(index, visible.length),
                    opacity: hovered === null || hovered === index ? 1 : 0.55,
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      {hiddenCount > 0 ? (
        // Never silently truncate — say what was left out.
        <p className="mt-3 text-xs text-ink-400">
          {hiddenCount} smaller {hiddenCount === 1 ? 'category' : 'categories'} not shown
        </p>
      ) : null}
    </div>
  )
}
