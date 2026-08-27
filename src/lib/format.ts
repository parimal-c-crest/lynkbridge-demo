import { PROTOTYPE_TODAY } from '@/data/dataset'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const currencyPreciseFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

export const formatCurrency = (value: number) => currencyFormatter.format(value)
export const formatCurrencyPrecise = (value: number) => currencyPreciseFormatter.format(value)

export const formatDate = (iso: string | null | undefined) =>
  iso ? dateFormatter.format(new Date(`${iso}T00:00:00Z`)) : '—'

export const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value)

export function formatFileSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

/** Human phrasing relative to the prototype's fixed "today". */
export function formatRelative(iso: string | null | undefined) {
  if (!iso) return 'Never'
  const days = Math.round(
    (new Date(`${iso}T00:00:00Z`).getTime() - PROTOTYPE_TODAY.getTime()) / 86_400_000,
  )

  if (days === 0) return 'Today'
  if (days === -1) return 'Yesterday'
  if (days === 1) return 'Tomorrow'

  const magnitude = Math.abs(days)
  const unit =
    magnitude < 30
      ? `${magnitude} days`
      : magnitude < 365
        ? `${Math.round(magnitude / 30)} months`
        : `${(magnitude / 365).toFixed(1)} years`

  return days < 0 ? `${unit} ago` : `in ${unit}`
}

/** "3 days" / "in 12 days" phrasing for contract countdowns. */
export function formatDaysRemaining(days: number) {
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'Ends today'
  return `${days} days remaining`
}

export const initialsOf = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
