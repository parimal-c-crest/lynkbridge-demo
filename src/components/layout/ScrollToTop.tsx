import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets scroll position on navigation.
 *
 * Without this, following a row from the bottom of a long list opens the detail
 * page already scrolled — which reads as a broken link during a demo.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return null
}
