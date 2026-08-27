import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useScopedData } from '@/state/DataContext'
import { useCurrentSession } from '@/state/SessionContext'
import { basePathForRole } from './navigation'
import { getCarrier, getLocation } from '@/data/selectors'

interface Hit {
  id: string
  group: string
  title: string
  subtitle: string
  href: string
}

const MAX_PER_GROUP = 4

/**
 * Global quick search across the records the signed-in user can see.
 *
 * Runs over the in-memory dataset — the same mock arrays the list pages use, so
 * a customer can never surface another tenant's record here.
 */
export function GlobalSearch() {
  const data = useScopedData()
  const session = useCurrentSession()
  const navigate = useNavigate()
  const base = basePathForRole(session.role)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickAway = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [])

  const hits = useMemo<Hit[]>(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length < 2) return []

    const results: Hit[] = []
    const match = (...values: Array<string | undefined | null>) =>
      values.some((value) => value?.toLowerCase().includes(needle))

    if (session.role === 'LynkBridge Admin') {
      for (const tenant of data.tenants.filter((t) => match(t.name, t.code, t.industry)).slice(0, MAX_PER_GROUP)) {
        results.push({
          id: tenant.id,
          group: 'Customers',
          title: tenant.name,
          subtitle: `${tenant.industry} · ${tenant.hqCity}, ${tenant.hqState}`,
          href: `/admin/customers/${tenant.id}`,
        })
      }
    }

    for (const location of data.locations
      .filter((l) => match(l.name, l.city, l.addressLine, l.state))
      .slice(0, MAX_PER_GROUP)) {
      results.push({
        id: location.id,
        group: 'Locations',
        title: location.name,
        subtitle: `${location.city}, ${location.state}`,
        href: `${base}/locations/${location.id}`,
      })
    }

    for (const service of data.services
      .filter((s) => match(s.name, s.type, s.accountNumber, s.bandwidth))
      .slice(0, MAX_PER_GROUP)) {
      const location = getLocation(data, service.locationId)
      results.push({
        id: service.id,
        group: 'Services',
        title: service.name,
        subtitle: `${service.type} · ${location?.name ?? 'Unknown location'}`,
        href: `${base}/services/${service.id}`,
      })
    }

    for (const circuit of data.circuits
      .filter((c) => match(c.circuitId, c.accountNumber))
      .slice(0, MAX_PER_GROUP)) {
      results.push({
        id: circuit.id,
        group: 'Circuits',
        title: circuit.circuitId,
        subtitle: `Account ${circuit.accountNumber} · ${circuit.bandwidth}`,
        href: `${base}/circuits/${circuit.id}`,
      })
    }

    for (const contract of data.contracts.filter((c) => match(c.contractNumber)).slice(0, MAX_PER_GROUP)) {
      results.push({
        id: contract.id,
        group: 'Contracts',
        title: contract.contractNumber,
        subtitle: `${getCarrier(data, contract.carrierId)?.name ?? 'Carrier'} · ends ${contract.endDate}`,
        href: `${base}/contracts/${contract.id}`,
      })
    }

    for (const ticket of data.tickets.filter((t) => match(t.number, t.subject)).slice(0, MAX_PER_GROUP)) {
      results.push({
        id: ticket.id,
        group: 'Tickets',
        title: `${ticket.number} — ${ticket.subject}`,
        subtitle: `${ticket.status} · ${ticket.priority} priority`,
        href: `${base}/tickets/${ticket.id}`,
      })
    }

    return results
  }, [query, data, base, session.role])

  const grouped = useMemo(() => {
    const map = new Map<string, Hit[]>()
    for (const hit of hits) {
      map.set(hit.group, [...(map.get(hit.group) ?? []), hit])
    }
    return [...map.entries()]
  }, [hits])

  const go = (href: string) => {
    navigate(href)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
          if (event.key === 'Enter' && hits.length) go(hits[0].href)
        }}
        placeholder="Search locations, services, circuits, contracts, tickets…"
        aria-label="Global search"
        className="h-9 w-full rounded-md border border-ink-300 bg-ink-50 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100 focus:outline-none"
      />

      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-11 z-50 max-h-96 overflow-y-auto rounded-[--radius-card] border border-ink-200 bg-white shadow-lg">
          {grouped.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-500">
              No records match “{query.trim()}”.
            </p>
          ) : (
            grouped.map(([group, groupHits]) => (
              <div key={group} className="border-b border-ink-100 last:border-b-0">
                <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                  {group}
                </p>
                {groupHits.map((hit) => (
                  <button
                    key={`${hit.group}-${hit.id}`}
                    onClick={() => go(hit.href)}
                    className="block w-full px-3 py-2 text-left hover:bg-brand-50"
                  >
                    <p className="truncate text-sm font-medium text-ink-900">{hit.title}</p>
                    <p className="truncate text-xs text-ink-500">{hit.subtitle}</p>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
