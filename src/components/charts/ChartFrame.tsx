import type { ReactNode } from 'react'
import { DetailCard } from '@/components/ui/DetailCard'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * Shared scaffolding for every chart on a dashboard.
 *
 * Charts sit in the same surface as the tables around them, carry the same
 * header treatment, and fall back to the same empty state — so a dashboard reads
 * as one system rather than a card deck with graphics glued on.
 */
export function ChartFrame({
  title,
  description,
  actions,
  isEmpty,
  emptyTitle,
  emptyDescription,
  footnote,
  className,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  /** Small print under the plot — how the number is derived. */
  footnote?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <DetailCard title={title} description={description} actions={actions} className={className}>
      {isEmpty ? (
        <EmptyState dense title={emptyTitle ?? 'Nothing to chart yet'} description={emptyDescription} />
      ) : (
        <>
          {children}
          {footnote ? <p className="mt-3 border-t border-ink-100 pt-2 text-xs text-ink-400">{footnote}</p> : null}
        </>
      )}
    </DetailCard>
  )
}

/**
 * Hover readout.
 *
 * Positioned by percentage across the plot and clamped at both edges so it never
 * runs off the card. Pointer events are off — it must never steal a hover from
 * the mark underneath it.
 */
export function ChartTooltip({
  x,
  title,
  rows,
}: {
  /** Horizontal position across the plot, 0–1. */
  x: number
  title: string
  rows: Array<{ label: string; value: string }>
}) {
  const clamped = Math.min(0.88, Math.max(0.12, x))

  return (
    <div
      className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-ink-200 bg-white px-2.5 py-1.5 shadow-lg"
      style={{ left: `${clamped * 100}%` }}
      role="tooltip"
    >
      <p className="text-xs font-semibold text-ink-900">{title}</p>
      {rows.map((row) => (
        <p key={row.label} className="text-xs text-ink-500">
          {row.label}: <span className="font-medium text-ink-700">{row.value}</span>
        </p>
      ))}
    </div>
  )
}

/**
 * Sequential fill for a ranked bar.
 *
 * More is darker: rank 0 is the darkest step, the tail is the lightest. Five
 * steps of one hue — never a second hue, because these bars are magnitudes of
 * the same measure, not distinct series.
 */
const SEQUENTIAL_STEPS = [
  'var(--color-brand-700)',
  'var(--color-brand-600)',
  'var(--color-brand-500)',
  'var(--color-brand-400)',
  'var(--color-brand-300)',
]

export function sequentialFill(rank: number, total: number): string {
  if (total <= 1) return SEQUENTIAL_STEPS[1]
  const position = rank / (total - 1)
  const step = Math.round(position * (SEQUENTIAL_STEPS.length - 1))
  return SEQUENTIAL_STEPS[step]
}

/**
 * Sequential fill by intensity, for grid cells.
 *
 * Zero renders as the plain surface — an empty cell must read as empty, not as
 * "the lightest amount of something".
 */
export function intensityFill(value: number, max: number): string {
  if (value === 0) return 'var(--color-ink-50)'
  const step = Math.min(SEQUENTIAL_STEPS.length - 1, Math.round((1 - value / max) * (SEQUENTIAL_STEPS.length - 1)))
  return SEQUENTIAL_STEPS[step]
}

/** Cell text has to flip to white once the fill gets dark. */
export function intensityInk(value: number, max: number): string {
  if (value === 0) return 'var(--color-ink-300)'
  return value / max > 0.5 ? '#ffffff' : 'var(--color-ink-800)'
}

/**
 * Reserved status fills for charts.
 *
 * These are NOT categorical series colours and must never be reused as "series
 * 4" — each one means a specific state and always ships with a written label.
 *
 * The steps were chosen by running the palette validator, not by eye. The
 * obvious pairing of warn-700 with danger-700 failed the normal-vision floor
 * (ΔE 9.1 — amber and red too close to tell apart), so warn snaps one step
 * lighter to warn-600. In display order the set passes every check, worst
 * adjacent pair ΔE 18.8 normal / 16.2 deutan.
 */
export const STATUS_FILL: Record<'ok' | 'info' | 'warn' | 'danger' | 'neutral', string> = {
  ok: 'var(--color-ok-700)',
  info: 'var(--color-info-700)',
  warn: 'var(--color-warn-600)',
  danger: 'var(--color-danger-700)',
  neutral: 'var(--color-ink-400)',
}
