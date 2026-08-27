import { formatDate } from '@/lib/format'

export interface TimelineEntry {
  at: string
  actor: string
  action: string
  detail?: string
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative space-y-5 border-l border-ink-200 pl-5">
      {entries.map((entry, index) => (
        <li key={`${entry.at}-${index}`} className="relative">
          <span
            aria-hidden
            className={`absolute -left-[26px] top-1 size-2.5 rounded-full ring-4 ring-white ${
              index === entries.length - 1 ? 'bg-brand-600' : 'bg-ink-300'
            }`}
          />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="text-sm font-medium text-ink-900">{entry.action}</p>
            <p className="text-xs text-ink-500">
              {entry.actor} · {formatDate(entry.at)}
            </p>
          </div>
          {entry.detail ? <p className="mt-1 text-sm text-ink-600">{entry.detail}</p> : null}
        </li>
      ))}
    </ol>
  )
}
