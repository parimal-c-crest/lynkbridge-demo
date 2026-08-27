/**
 * The single place status colour is decided.
 *
 * Pages pass a raw status string; this maps it to a tone. Any status that is not
 * recognised renders neutral rather than throwing — the prototype's status
 * vocabulary is unconfirmed and expected to change.
 */
type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral'

const TONE_CLASS: Record<Tone, string> = {
  ok: 'bg-ok-50 text-ok-700 ring-ok-200',
  warn: 'bg-warn-50 text-warn-700 ring-warn-200',
  danger: 'bg-danger-50 text-danger-700 ring-danger-200',
  info: 'bg-info-50 text-info-700 ring-info-200',
  neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
}

const TONE_BY_STATUS: Record<string, Tone> = {
  // Records
  Active: 'ok',
  Pending: 'warn',
  Inactive: 'neutral',
  Onboarding: 'info',
  Suspended: 'danger',
  // Circuits
  Provisioning: 'warn',
  Degraded: 'warn',
  Disconnected: 'danger',
  // Renewals
  'Expiring Soon': 'warn',
  Expired: 'danger',
  // Tickets
  Open: 'info',
  'In Progress': 'info',
  'Waiting on Customer': 'warn',
  Resolved: 'ok',
  Closed: 'neutral',
  // Priorities
  Low: 'neutral',
  Medium: 'info',
  High: 'warn',
  Critical: 'danger',
  // Users
  Invited: 'info',
  Disabled: 'neutral',
  // Imports
  Completed: 'ok',
  'Completed with warnings': 'warn',
  Failed: 'danger',
}

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const tone = TONE_BY_STATUS[status] ?? 'neutral'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASS[tone]} ${className}`}
    >
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${
          tone === 'ok'
            ? 'bg-ok-600'
            : tone === 'warn'
              ? 'bg-warn-600'
              : tone === 'danger'
                ? 'bg-danger-600'
                : tone === 'info'
                  ? 'bg-info-600'
                  : 'bg-ink-400'
        }`}
      />
      {status}
    </span>
  )
}
