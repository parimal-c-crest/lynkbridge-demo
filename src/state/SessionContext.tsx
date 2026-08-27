import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { seedDataset } from '@/data/dataset'
import type { Id, UserRole } from '@/data/types'

/**
 * Simulated sign-in.
 *
 * There is no authentication here — no password check, no token, no server. The
 * session is a plain object in React state that decides which mock records the
 * UI renders and which navigation to show. Nothing in this file provides or
 * implies production security.
 */

export interface Session {
  userId: Id
  name: string
  email: string
  role: UserRole
  /** null for LynkBridge staff, who are not scoped to a tenant. */
  tenantId: Id | null
  tenantName: string | null
}

export interface DemoAccount {
  email: string
  label: string
  description: string
  role: UserRole
}

/** The accounts advertised on the login screen. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'customer@demo.com',
    label: 'Customer — Acme Corporation',
    description: 'Sees only Acme Corporation records',
    role: 'Customer User',
  },
  {
    email: 'customer2@demo.com',
    label: 'Customer — Global Industries',
    description: 'Sees only Global Industries records — use this to compare tenant separation',
    role: 'Customer User',
  },
  {
    email: 'admin@demo.com',
    label: 'LynkBridge Admin',
    description: 'Sees every tenant, plus carriers, imports and user management',
    role: 'LynkBridge Admin',
  },
]

interface SessionContextValue {
  session: Session | null
  signIn: (email: string) => { ok: true; session: Session } | { ok: false; error: string }
  signOut: () => void
  /** Prototype convenience: jump between demo identities without signing out. */
  switchAccount: (email: string) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

function buildSession(email: string): Session | null {
  const user = seedDataset.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user) return null

  const tenant = seedDataset.tenants.find((t) => t.id === user.tenantId)

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    tenantName: tenant?.name ?? null,
  }
}

export function SessionProvider({
  children,
  initialEmail,
}: {
  children: ReactNode
  /** Starts the app already signed in. Used by the render smoke test. */
  initialEmail?: string
}) {
  const [session, setSession] = useState<Session | null>(() =>
    initialEmail ? buildSession(initialEmail) : null,
  )

  const signIn = useCallback((email: string) => {
    const next = buildSession(email)
    if (!next) {
      return {
        ok: false as const,
        error: 'No demo account matches that email address. Use one of the demo accounts listed below.',
      }
    }
    setSession(next)
    return { ok: true as const, session: next }
  }, [])

  const signOut = useCallback(() => setSession(null), [])

  const switchAccount = useCallback((email: string) => {
    const next = buildSession(email)
    if (next) setSession(next)
  }, [])

  const value = useMemo(
    () => ({ session, signIn, signOut, switchAccount }),
    [session, signIn, signOut, switchAccount],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used inside SessionProvider')
  return context
}

/** Session guaranteed present — for use inside authenticated layouts. */
export function useCurrentSession(): Session {
  const { session } = useSession()
  if (!session) throw new Error('useCurrentSession used outside an authenticated route')
  return session
}
