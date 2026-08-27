import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, RefreshCw, Repeat, UserCircle } from 'lucide-react'
import { GlobalSearch } from './GlobalSearch'
import { DEMO_ACCOUNTS, useCurrentSession, useSession } from '@/state/SessionContext'
import { useData } from '@/state/DataContext'
import { useToast } from '@/state/ToastContext'
import { initialsOf } from '@/lib/format'
import { basePathForRole } from './navigation'

export function TopBar({ onOpenNav }: { onOpenNav: () => void }) {
  const session = useCurrentSession()
  const { signOut, switchAccount } = useSession()
  const { hasLocalChanges, resetPrototypeData } = useData()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickAway = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
      if (!bellRef.current?.contains(event.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [])

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  const handleSwitch = (email: string) => {
    switchAccount(email)
    const account = DEMO_ACCOUNTS.find((a) => a.email === email)
    setMenuOpen(false)
    navigate(account?.role === 'LynkBridge Admin' ? '/admin/dashboard' : '/customer/dashboard')
    notify({ tone: 'info', title: 'Switched demo account', description: account?.label })
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-ink-200 bg-white px-3 sm:px-4">
      <button
        onClick={onOpenNav}
        className="rounded-md p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex-1 min-w-0">
        <GlobalSearch />
      </div>

      {hasLocalChanges ? (
        <button
          onClick={() => {
            resetPrototypeData()
            notify({ tone: 'info', title: 'Prototype data reset', description: 'Local changes discarded.' })
          }}
          className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-md border border-ink-300 px-2.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
          title="Discard everything created in this session and restore the seed data"
        >
          <RefreshCw className="size-3.5" />
          Reset demo data
        </button>
      ) : null}

      {/* Notifications: intentionally a placeholder — notifications are roadmap, not Phase 1. */}
      <div ref={bellRef} className="relative">
        <button
          onClick={() => setBellOpen((value) => !value)}
          className="relative rounded-md p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand-500" />
        </button>

        {bellOpen ? (
          <div className="absolute right-0 top-11 w-72 rounded-[--radius-card] border border-ink-200 bg-white p-4 shadow-lg">
            <p className="text-sm font-medium text-ink-900">Notifications</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              Notifications are on the future roadmap and are not implemented in this prototype. This placeholder
              shows where they would appear.
            </p>
            <Link
              to="/roadmap"
              onClick={() => setBellOpen(false)}
              className="mt-3 inline-block text-xs font-medium text-brand-600 hover:underline"
            >
              View the roadmap
            </Link>
          </div>
        ) : null}
      </div>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((value) => !value)}
          className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-ink-100"
          aria-label="Account menu"
          aria-expanded={menuOpen}
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {initialsOf(session.name)}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-medium leading-tight text-ink-900">{session.name}</span>
            <span className="block text-[11px] leading-tight text-ink-500">
              {session.tenantName ?? 'LynkBridge'}
            </span>
          </span>
          <ChevronDown className="size-3.5 text-ink-400" />
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-11 w-72 overflow-hidden rounded-[--radius-card] border border-ink-200 bg-white shadow-lg">
            <div className="border-b border-ink-200 px-4 py-3">
              <p className="text-sm font-medium text-ink-900">{session.name}</p>
              <p className="truncate text-xs text-ink-500">{session.email}</p>
              <p className="mt-1 text-[11px] font-medium text-brand-700">{session.role}</p>
            </div>

            {session.role === 'Customer User' ? (
              <Link
                to={`${basePathForRole(session.role)}/profile`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50"
              >
                <UserCircle className="size-4 text-ink-400" />
                My profile
              </Link>
            ) : null}

            <div className="border-t border-ink-200 px-4 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                <Repeat className="size-3" />
                Switch demo account
              </p>
              <div className="mt-1.5 space-y-1">
                {DEMO_ACCOUNTS.filter((account) => account.email !== session.email).map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleSwitch(account.email)}
                    className="block w-full rounded px-2 py-1.5 text-left text-xs text-ink-600 hover:bg-ink-50"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 border-t border-ink-200 px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-ink-50"
            >
              <LogOut className="size-4 text-ink-400" />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
