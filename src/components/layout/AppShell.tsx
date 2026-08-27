import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useSession } from '@/state/SessionContext'
import type { UserRole } from '@/data/types'

/**
 * Authenticated layout.
 *
 * `requiredRole` keeps the two experiences separated: a customer who types an
 * /admin URL is redirected to their own dashboard. This is navigation
 * correctness for the prototype, NOT access control.
 */
export function AppShell({ requiredRole }: { requiredRole: UserRole }) {
  const { session } = useSession()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setNavOpen(false), [location.pathname])

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  if (session.role !== requiredRole) {
    return <Navigate to={session.role === 'LynkBridge Admin' ? '/admin/dashboard' : '/customer/dashboard'} replace />
  }

  return (
    <div className="min-h-screen bg-ink-100">
      <Sidebar
        role={session.role}
        tenantName={session.tenantName}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="lg:pl-60">
        <TopBar onOpenNav={() => setNavOpen(true)} />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
