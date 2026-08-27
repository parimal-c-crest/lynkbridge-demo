import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <Link to={item.to} className="hover:text-ink-800 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-ink-700' : ''}>{item.label}</span>
              )}
              {!isLast ? <ChevronRight className="size-3 text-ink-300" aria-hidden /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

interface PageContainerProps {
  title: ReactNode
  description?: ReactNode
  breadcrumbs?: Crumb[]
  actions?: ReactNode
  /** Rendered directly beneath the header — status badges, key facts. */
  meta?: ReactNode
  children: ReactNode
}

export function PageContainer({
  title,
  description,
  breadcrumbs = [],
  actions,
  meta,
  children,
}: PageContainerProps) {
  return (
    <div className="mx-auto w-full max-w-[100rem] px-4 py-5 sm:px-6 sm:py-6">
      <Breadcrumb items={breadcrumbs} />

      <header className={`flex flex-wrap items-start justify-between gap-3 ${breadcrumbs.length ? 'mt-2' : ''}`}>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">{title}</h1>
          {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
          {meta ? <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>

      <div className="mt-5 space-y-5">{children}</div>
    </div>
  )
}
