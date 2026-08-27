import { useScopedData } from '@/state/DataContext'
import { useCurrentSession } from '@/state/SessionContext'
import { useSettingsOrDefaults } from '@/state/SettingsContext'
import { renewalStatus } from '@/data/selectors'
import { basePathForRole } from '@/components/layout/navigation'
import type { Contract } from '@/data/types'

/**
 * Everything a screen needs to render itself for whichever role is signed in.
 *
 * Customer and admin share most screens; only the route prefix, the presence of
 * a Customer column, and cross-tenant visibility differ. Routing that difference
 * through one hook keeps a single implementation of each screen.
 */
export function usePortal() {
  const session = useCurrentSession()
  const data = useScopedData()
  const settings = useSettingsOrDefaults()
  const isAdmin = session.role === 'LynkBridge Admin'

  return {
    session,
    data,
    settings,
    isAdmin,
    base: basePathForRole(session.role),
    /** Prefix a path with the current role's route root. */
    path: (suffix: string) => `${basePathForRole(session.role)}${suffix}`,
    /**
     * Renewal status against the CONFIGURED notice window rather than the
     * built-in default, so changing it in Settings moves every badge, filter
     * and chart together instead of only some of them.
     */
    statusOf: (contract: Contract) => renewalStatus(contract, settings.renewalWindowDays),
  }
}
