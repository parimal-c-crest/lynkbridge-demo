import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Portal settings.
 *
 * Two kinds of thing live here, and the Settings screens label which is which:
 *
 * - Settings that genuinely drive the product — the renewal notice window and
 *   the table page size. Changing them changes what the charts and lists show,
 *   which is the point: it demonstrates that these are configuration, not
 *   hardcoded assumptions, and gives the client something to react to.
 * - Settings that are deliberately inert — notification toggles and anything
 *   that would need a backend. They are rendered as switches so the shape of
 *   the screen is reviewable, and marked as non-functional.
 *
 * Nothing persists. A refresh restores the defaults, like every other write in
 * this prototype.
 */

export interface Settings {
  /** Days before a contract's end date at which it reads as "Expiring Soon". */
  renewalWindowDays: number
  /** Rows per page across every list screen. */
  pageSize: number
  /** How many months the dashboard runway chart covers by default. */
  runwayMonths: number
  /** Non-functional — no notification system exists. */
  notifyRenewals: boolean
  notifyTicketUpdates: boolean
  notifyOutages: boolean
  notifyWeeklyDigest: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  renewalWindowDays: 90,
  pageSize: 10,
  runwayMonths: 12,
  notifyRenewals: true,
  notifyTicketUpdates: true,
  notifyOutages: false,
  notifyWeeklyDigest: false,
}

interface SettingsContextValue {
  settings: Settings
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  reset: () => void
  isModified: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }, [])

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), [])

  const isModified = useMemo(
    () => (Object.keys(DEFAULT_SETTINGS) as Array<keyof Settings>).some((key) => settings[key] !== DEFAULT_SETTINGS[key]),
    [settings],
  )

  const value = useMemo(() => ({ settings, update, reset, isModified }), [settings, update, reset, isModified])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used inside SettingsProvider')
  return context
}

/**
 * Settings without requiring the provider.
 *
 * `useCollection` runs in contexts that are not always wrapped (the render
 * harness mounts components in isolation), so it reads settings defensively and
 * falls back to the defaults.
 */
export function useSettingsOrDefaults(): Settings {
  return useContext(SettingsContext)?.settings ?? DEFAULT_SETTINGS
}
