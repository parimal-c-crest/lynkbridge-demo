import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface DetailCardProps {
  title: string
  description?: string
  actions?: ReactNode
  /** Removes the inner padding for cards whose body is a table. */
  flush?: boolean
  className?: string
  children: ReactNode
}

export function DetailCard({ title, description, actions, flush, className = '', children }: DetailCardProps) {
  return (
    <section className={`surface overflow-hidden ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-ink-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      <div className={flush ? '' : 'p-4'}>{children}</div>
    </section>
  )
}

export interface Field {
  label: string
  value: ReactNode
  /** Renders the value as a link to a related record. */
  to?: string
  /** Spans the full width — for notes and addresses. */
  wide?: boolean
}

export function FieldGrid({ fields, columns = 3 }: { fields: Field[]; columns?: 2 | 3 | 4 }) {
  const columnClass =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3'

  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 ${columnClass}`}>
      {fields.map((field) => (
        <div key={field.label} className={field.wide ? 'sm:col-span-2 lg:col-span-3' : undefined}>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">{field.label}</dt>
          <dd className="mt-1 text-sm text-ink-900">
            {field.to ? (
              <Link to={field.to} className="text-brand-600 hover:text-brand-700 hover:underline font-medium">
                {field.value}
              </Link>
            ) : (
              field.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
