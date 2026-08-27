import type { ReactNode } from 'react'

export interface TabItem {
  key: string
  label: string
  /** Row count shown alongside the label — makes empty sections obvious upfront. */
  count?: number
  content: ReactNode
}

interface TabsProps {
  tabs: TabItem[]
  active: string
  onChange: (key: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  const current = tabs.find((tab) => tab.key === active) ?? tabs[0]

  return (
    <div>
      <div className="border-b border-ink-200 overflow-x-auto">
        <nav className="flex min-w-max gap-1" role="tablist">
          {tabs.map((tab) => {
            const isActive = tab.key === current.key
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.key)}
                className={`relative px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {tab.count !== undefined ? (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                        isActive ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  ) : null}
                </span>
                {isActive ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-600" /> : null}
              </button>
            )
          })}
        </nav>
      </div>
      <div role="tabpanel" className="pt-4">
        {current.content}
      </div>
    </div>
  )
}
