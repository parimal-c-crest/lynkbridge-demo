import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChartTooltip } from './ChartFrame'

export interface ColumnRow {
  label: string
  /** Longer label for the tooltip. */
  longLabel?: string
  value: number
  /** Drawn in the warning tone — this is emphasis, not a second series. */
  emphasis?: boolean
  /** Extra tooltip line, e.g. how many contracts sit in the month. */
  detail?: string
  href?: string
}

const PLOT_HEIGHT = 132

/**
 * Column chart for a value bucketed over time.
 *
 * One series, so no legend — the card title names it. Empty buckets render as a
 * flat baseline stub rather than nothing, because a gap in a time axis must read
 * as zero, not as missing data.
 *
 * Emphasis columns use the reserved warning token to mark months that need
 * action. That is one hue plus an accent, not a two-series palette.
 */
export function ColumnChart({
  rows,
  formatValue,
  valueLabel = 'Monthly cost',
  ariaLabel,
}: {
  rows: ColumnRow[]
  formatValue: (value: number) => string
  /** What the value is called in the tooltip. */
  valueLabel?: string
  ariaLabel: string
}) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<number | null>(null)

  const max = Math.max(...rows.map((row) => row.value), 1)
  const active = hovered === null ? null : rows[hovered]

  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="relative" style={{ height: PLOT_HEIGHT }}>
        {/* Recessive gridlines — present for reading off values, never competing
            with the marks. */}
        {[0, 0.5, 1].map((fraction) => (
          <div
            key={fraction}
            className="absolute inset-x-0 border-t border-ink-100"
            style={{ top: `${fraction * 100}%` }}
            aria-hidden
          />
        ))}

        <div className="absolute inset-0 flex items-end gap-1.5">
          {rows.map((row, index) => {
            const share = row.value / max
            const isInteractive = Boolean(row.href)

            return (
              <div
                key={row.label + index}
                className={`relative flex h-full flex-1 items-end ${isInteractive ? 'cursor-pointer' : ''}`}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
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
                aria-label={`${row.longLabel ?? row.label}, ${formatValue(row.value)}`}
              >
                <div
                  className="w-full rounded-t transition-[height,opacity] duration-200"
                  style={{
                    // A 3px stub keeps an empty month visible as a real zero.
                    height: row.value === 0 ? 3 : `${Math.max(share * 100, 4)}%`,
                    background:
                      row.value === 0
                        ? 'var(--color-ink-200)'
                        : row.emphasis
                          ? 'var(--color-warn-600)'
                          : 'var(--color-brand-600)',
                    opacity: hovered === null || hovered === index ? 1 : 0.55,
                  }}
                />
              </div>
            )
          })}
        </div>

        {active ? (
          <ChartTooltip
            x={(hovered! + 0.5) / rows.length}
            title={active.longLabel ?? active.label}
            rows={[
              { label: valueLabel, value: formatValue(active.value) },
              ...(active.detail ? [{ label: 'Contracts', value: active.detail }] : []),
            ]}
          />
        ) : null}
      </div>

      <div className="mt-1.5 flex gap-1.5">
        {rows.map((row, index) => (
          <span
            key={row.label + index}
            className={`flex-1 text-center text-[11px] ${
              row.emphasis ? 'font-semibold text-warn-700' : 'text-ink-400'
            }`}
          >
            {row.label}
          </span>
        ))}
      </div>
    </div>
  )
}
