import { NavLink } from 'react-router-dom'
import { Compass, X } from 'lucide-react'
import { navForRole } from './navigation'
import type { UserRole } from '@/data/types'

interface SidebarProps {
  role: UserRole
  tenantName: string | null
  /** Mobile drawer state — the sidebar is permanent from lg upward. */
  open: boolean
  onClose: () => void
}

export function Sidebar({ role, tenantName, open, onClose }: SidebarProps) {
  const items = navForRole(role)
  const isAdmin = role === 'LynkBridge Admin'

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-ink-800 shrink-0">
        <span className="grid size-8 place-items-center rounded-md bg-brand-500 text-white font-bold text-sm">
          LB
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">LynkBridge</p>
          <p className="truncate text-[11px] text-ink-400 leading-tight">
            {isAdmin ? 'Platform Administration' : (tenantName ?? 'Customer Portal')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto rounded p-1 text-ink-400 hover:bg-ink-800 hover:text-white lg:hidden"
          aria-label="Close navigation"
        >
          <X className="size-4" />
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <li key={item.to}>
              {item.section ? (
                <p className="px-2 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                  {item.section}
                </p>
              ) : null}
              <NavLink
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white font-medium'
                      : 'text-ink-300 hover:bg-ink-800 hover:text-white'
                  }`
                }
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </NavLink>
            </li>
          )
        })}
      </ul>

      <div className="border-t border-ink-800 p-3 shrink-0">
        <NavLink
          to="/roadmap"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm ${
              isActive ? 'bg-ink-800 text-white' : 'text-ink-400 hover:bg-ink-800 hover:text-white'
            }`
          }
        >
          <Compass className="size-4 shrink-0" />
          Roadmap &amp; open questions
        </NavLink>
        <p className="mt-2 px-2.5 text-[11px] leading-relaxed text-ink-500">
          Prototype build — simulated data, no live systems connected.
        </p>
      </div>
    </nav>
  )

  return (
    <>
      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-40 lg:hidden ${open ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-ink-950/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
          aria-hidden
        />
        <aside
          className={`absolute inset-y-0 left-0 w-64 bg-ink-900 transition-transform duration-200 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {nav}
        </aside>
      </div>

      {/* Permanent desktop rail */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-30 w-60 bg-ink-900">{nav}</aside>
    </>
  )
}
