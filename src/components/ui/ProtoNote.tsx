import { useState } from 'react'
import { ChevronDown, FlaskConical } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Inline disclosure marking behaviour that is a prototype assumption rather than
 * a confirmed requirement.
 *
 * These are deliberately visible in the running prototype: the client is meant
 * to see exactly where the team invented something, so it can be confirmed or
 * corrected during discovery.
 */
export function ProtoNote({
  children,
  label = 'Prototype assumption',
  defaultOpen = false,
}: {
  children: ReactNode
  label?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-[--radius-card] border border-dashed border-ink-300 bg-ink-50">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <FlaskConical className="size-3.5 shrink-0 text-ink-400" />
        <span className="text-xs font-medium text-ink-600">{label}</span>
        <ChevronDown className={`ml-auto size-3.5 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="border-t border-dashed border-ink-300 px-3 py-2 text-xs text-ink-600">{children}</div> : null}
    </div>
  )
}

/** Small inline tag for a single unconfirmed value. */
export function ProtoTag({ children = 'Prototype data' }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium bg-ink-100 text-ink-500 ring-1 ring-inset ring-ink-200">
      <FlaskConical className="size-3" />
      {children}
    </span>
  )
}
