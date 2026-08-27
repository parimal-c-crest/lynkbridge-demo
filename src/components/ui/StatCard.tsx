import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
  to?: string
  /** Draws attention when the number needs action (open tickets, expiries). */
  tone?: 'default' | 'warn' | 'danger'
}

const TONE_RING: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'border-ink-200',
  warn: 'border-warn-200',
  danger: 'border-danger-200',
}

const TONE_ICON: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-brand-50 text-brand-600',
  warn: 'bg-warn-50 text-warn-600',
  danger: 'bg-danger-50 text-danger-600',
}

export function StatCard({ label, value, hint, icon, to, tone = 'default' }: StatCardProps) {
  const body = (
    <div
      className={`h-full bg-white border rounded-[--radius-card] p-4 transition-shadow ${TONE_RING[tone]} ${
        to ? 'hover:shadow-md hover:border-brand-300' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
        {icon ? <span className={`shrink-0 rounded-md p-1.5 ${TONE_ICON[tone]}`}>{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink-900 tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </div>
  )

  return to ? (
    <Link to={to} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  )
}
