import { useState } from 'react'
import { ChartTooltip } from './ChartFrame'
import type { MonthBucket } from '@/data/selectors'

const HEIGHT = 150
const WIDTH = 600

/**
 * Single-series area chart for a running total over time.
 *
 * One series, so no legend and no categorical colour — the card title names it.
 * The y-axis is deliberately not zero-based for a cumulative balance: the story
 * is the shape of the growth, and the opening balance is labelled on the axis so
 * the baseline can't be misread as zero.
 *
 * A crosshair plus tooltip is the default interaction for a line, so it ships
 * with one rather than as an enhancement.
 */
export function AreaChart({
  points,
  formatValue,
  ariaLabel,
}: {
  points: MonthBucket[]
  formatValue: (value: number) => string
  ariaLabel: string
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (points.length < 2) return null

  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  // Pad the band so the line never sits flat against an edge.
  const floor = min - (max - min) * 0.15 || 0
  const span = max - floor || 1

  const x = (index: number) => (index / (points.length - 1)) * WIDTH
  const y = (value: number) => HEIGHT - ((value - floor) / span) * HEIGHT

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.value)}`).join(' ')
  const fill = `${line} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`

  const active = hovered === null ? null : points[hovered]

  // Label roughly six ticks, whatever the window length.
  const tickEvery = Math.max(1, Math.round(points.length / 6))

  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="h-[150px] w-full"
          onMouseLeave={() => setHovered(null)}
          onMouseMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect()
            const ratio = (event.clientX - box.left) / box.width
            setHovered(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))))
          }}
        >
          <defs>
            <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Recessive gridlines. */}
          {[0, 0.5, 1].map((fraction) => (
            <line
              key={fraction}
              x1="0"
              x2={WIDTH}
              y1={fraction * HEIGHT}
              y2={fraction * HEIGHT}
              stroke="var(--color-ink-100)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={fill} fill="url(#area-fill)" />
          <path
            d={line}
            fill="none"
            stroke="var(--color-brand-600)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {active ? (
            <>
              <line
                x1={x(hovered!)}
                x2={x(hovered!)}
                y1="0"
                y2={HEIGHT}
                stroke="var(--color-ink-300)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={x(hovered!)}
                cy={y(active.value)}
                r="5"
                fill="var(--color-brand-600)"
                stroke="#ffffff"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </>
          ) : null}
        </svg>

        {active ? (
          <ChartTooltip
            x={hovered! / (points.length - 1)}
            title={active.longLabel}
            rows={[{ label: 'Under management', value: formatValue(active.value) }]}
          />
        ) : null}
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-ink-400">
        {points.map((point, index) =>
          index % tickEvery === 0 || index === points.length - 1 ? (
            <span key={point.monthKey}>{point.label}</span>
          ) : null,
        )}
      </div>

      <div className="mt-2 flex justify-between border-t border-ink-100 pt-2 text-xs">
        <span className="text-ink-400">
          Opening {formatValue(points[0].value)}
        </span>
        <span className="font-semibold text-ink-900">Now {formatValue(points[points.length - 1].value)}</span>
      </div>
    </div>
  )
}
