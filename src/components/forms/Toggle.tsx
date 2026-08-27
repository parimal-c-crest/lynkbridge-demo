import { useId } from 'react'
import type { ReactNode } from 'react'

/**
 * Switch row for a settings screen.
 *
 * `inert` marks a control whose state is stored but does nothing — the
 * notification preferences, which have no delivery mechanism behind them. It is
 * labelled rather than disabled, so the shape of the screen stays reviewable
 * without implying the feature works.
 */
export function Toggle({
  label,
  description,
  checked,
  onChange,
  inert,
}: {
  label: string
  description?: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  inert?: boolean
}) {
  const id = useId()

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-800">
          {label}
          {inert ? (
            <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-500 ring-1 ring-inset ring-ink-200">
              Not implemented
            </span>
          ) : null}
        </label>
        {description ? <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{description}</p> : null}
      </div>

      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-brand-600' : 'bg-ink-300'
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left] ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}
