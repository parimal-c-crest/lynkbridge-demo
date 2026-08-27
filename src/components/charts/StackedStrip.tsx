import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STATUS_FILL } from './ChartFrame'
import type { StatusSlice } from '@/data/selectors'

/**
 * Part-to-whole strip for a set of states.
 *
 * Segments keep a fixed order (best state to worst) rather than sorting by size,
 * so the strip reads the same on every visit and a growing problem segment shows
 * as movement instead of a reshuffle.
 *
 * Every segment is also written out in the legend beneath with its value, so the
 * state is never carried by colour alone — which is what makes the reserved
 * status palette legal here.
 */
export function StackedStrip({
  slices,
  formatValue = (value: number) => String(value),
  hrefFor,
  ariaLabel,
}: {
  slices: StatusSlice[]
  formatValue?: (value: number) => string
  /** Where clicking a segment should land, usually a pre-filtered list. */
  hrefFor?: (slice: StatusSlice) => string
  ariaLabel: string
}) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)

  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const present = slices.filter((slice) => slice.value > 0)

  return (
    <div role="img" aria-label={ariaLabel}>
      {/* 2px gaps between segments so adjacent fills never touch. */}
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {present.map((slice) => {
          const href = hrefFor?.(slice)

          return (
            <div
              key={slice.label}
              className={`h-full first:rounded-l-full last:rounded-r-full ${href ? 'cursor-pointer' : ''}`}
              style={{
                width: `${(slice.value / total) * 100}%`,
                background: STATUS_FILL[slice.tone],
                opacity: hovered === null || hovered === slice.label ? 1 : 0.5,
                transition: 'opacity 150ms',
              }}
              onMouseEnter={() => setHovered(slice.label)}
              onMouseLeave={() => setHovered(null)}
              onClick={href ? () => navigate(href) : undefined}
              title={`${slice.label} — ${formatValue(slice.value)}`}
            />
          )
        })}
      </div>

      <ul className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {slices.map((slice) => {
          const href = slice.value > 0 ? hrefFor?.(slice) : undefined
          const share = total ? Math.round((slice.value / total) * 100) : 0

          const row = (
            <>
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: STATUS_FILL[slice.tone] }}
              />
              <span className="truncate text-xs text-ink-600">{slice.label}</span>
              <span className="ml-auto shrink-0 text-xs font-semibold tabular-nums text-ink-900">
                {formatValue(slice.value)}
              </span>
              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-ink-400">{share}%</span>
            </>
          )

          return (
            <li
              key={slice.label}
              onMouseEnter={() => setHovered(slice.label)}
              onMouseLeave={() => setHovered(null)}
            >
              {href ? (
                <button
                  onClick={() => navigate(href)}
                  className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-ink-50"
                >
                  {row}
                </button>
              ) : (
                <span className="flex w-full items-center gap-2 px-1 py-0.5 opacity-60">{row}</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
