import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  /** Compact variant for empty tabs inside a detail page. */
  dense?: boolean
}

export function EmptyState({ title, description, icon, action, dense }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${dense ? 'py-8 px-4' : 'py-14 px-6'}`}>
      <span className="rounded-full bg-ink-100 p-3 text-ink-400">{icon ?? <Inbox className="size-5" />}</span>
      <p className="mt-3 text-sm font-medium text-ink-900">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
