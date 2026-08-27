/**
 * Relational read layer over the mock dataset.
 *
 * Every screen goes through these helpers rather than reaching into arrays
 * directly. When a real API replaces `dataset.ts`, this is the only file that
 * needs to change shape — the pages stay as they are.
 */
import { PROTOTYPE_TODAY } from './dataset'
import type {
  Carrier,
  Circuit,
  Contract,
  Dataset,
  DocumentRecord,
  Id,
  Location,
  RenewalStatus,
  Service,
  Tenant,
  Ticket,
  TicketPriority,
  TicketStatus,
  User,
} from './types'

/** Contracts inside this many days of their end date read as "Expiring Soon". */
export const RENEWAL_WINDOW_DAYS = 90

const byId = <T extends { id: Id }>(items: T[], id: Id | null | undefined): T | undefined =>
  id ? items.find((item) => item.id === id) : undefined

export function daysUntil(dateIso: string): number {
  const target = new Date(`${dateIso}T00:00:00Z`).getTime()
  return Math.round((target - PROTOTYPE_TODAY.getTime()) / 86_400_000)
}

export function renewalStatus(contract: Contract, windowDays = RENEWAL_WINDOW_DAYS): RenewalStatus {
  const remaining = daysUntil(contract.endDate)
  if (remaining < 0) return 'Expired'
  if (remaining <= windowDays) return 'Expiring Soon'
  return 'Active'
}

/**
 * A tenant-scoped view of the dataset.
 *
 * PROTOTYPE ONLY. This filters mock arrays in the browser to demonstrate what
 * tenant separation looks like to a user. It is not a security boundary and
 * must not be mistaken for one — real isolation belongs on the server.
 */
export function scopeToTenant(data: Dataset, tenantId: Id | null): Dataset {
  if (!tenantId) return data

  const locations = data.locations.filter((l) => l.tenantId === tenantId)
  const services = data.services.filter((s) => s.tenantId === tenantId)
  const serviceIds = new Set(services.map((s) => s.id))

  return {
    ...data,
    tenants: data.tenants.filter((t) => t.id === tenantId),
    users: data.users.filter((u) => u.tenantId === tenantId),
    locations,
    services,
    // Circuits carry no tenantId — they are scoped through their service.
    circuits: data.circuits.filter((c) => serviceIds.has(c.serviceId)),
    contracts: data.contracts.filter((c) => c.tenantId === tenantId),
    documents: data.documents.filter((d) => d.tenantId === tenantId),
    tickets: data.tickets.filter((t) => t.tenantId === tenantId),
    imports: data.imports.filter((i) => i.tenantId === tenantId),
    // Carriers are platform-level and intentionally not filtered.
  }
}

/* -------------------------------------------------------------- entity reads */

export const getTenant = (d: Dataset, id: Id | null | undefined) => byId(d.tenants, id)
export const getLocation = (d: Dataset, id: Id | null | undefined) => byId(d.locations, id)
export const getCarrier = (d: Dataset, id: Id | null | undefined) => byId(d.carriers, id)
export const getService = (d: Dataset, id: Id | null | undefined) => byId(d.services, id)
export const getContract = (d: Dataset, id: Id | null | undefined) => byId(d.contracts, id)
export const getCircuit = (d: Dataset, id: Id | null | undefined) => byId(d.circuits, id)
export const getTicket = (d: Dataset, id: Id | null | undefined) => byId(d.tickets, id)
export const getDocument = (d: Dataset, id: Id | null | undefined) => byId(d.documents, id)
export const getUser = (d: Dataset, id: Id | null | undefined) => byId(d.users, id)

/* --------------------------------------------------------------- 1:1 and 1:N */

/** A service has at most one circuit (see the note on `Circuit` in types.ts). */
export const circuitForService = (d: Dataset, serviceId: Id): Circuit | undefined =>
  d.circuits.find((c) => c.serviceId === serviceId)

export const serviceForCircuit = (d: Dataset, circuit: Circuit): Service | undefined =>
  getService(d, circuit.serviceId)

/** A circuit's carrier is resolved through its service — never stored twice. */
export function carrierForCircuit(d: Dataset, circuit: Circuit): Carrier | undefined {
  const service = serviceForCircuit(d, circuit)
  return service ? getCarrier(d, service.carrierId) : undefined
}

export function locationForCircuit(d: Dataset, circuit: Circuit): Location | undefined {
  const service = serviceForCircuit(d, circuit)
  return service ? getLocation(d, service.locationId) : undefined
}

export const servicesAtLocation = (d: Dataset, locationId: Id) =>
  d.services.filter((s) => s.locationId === locationId)

export const circuitsAtLocation = (d: Dataset, locationId: Id) => {
  const ids = new Set(servicesAtLocation(d, locationId).map((s) => s.id))
  return d.circuits.filter((c) => ids.has(c.serviceId))
}

export const servicesOnContract = (d: Dataset, contractId: Id) =>
  d.services.filter((s) => s.contractId === contractId)

export const servicesForCarrier = (d: Dataset, carrierId: Id) =>
  d.services.filter((s) => s.carrierId === carrierId)

export const circuitsForCarrier = (d: Dataset, carrierId: Id) => {
  const ids = new Set(servicesForCarrier(d, carrierId).map((s) => s.id))
  return d.circuits.filter((c) => ids.has(c.serviceId))
}

export const tenantsForCarrier = (d: Dataset, carrierId: Id): Tenant[] => {
  const ids = new Set(servicesForCarrier(d, carrierId).map((s) => s.tenantId))
  return d.tenants.filter((t) => ids.has(t.id))
}

export const contractsAtLocation = (d: Dataset, locationId: Id): Contract[] => {
  const ids = new Set(servicesAtLocation(d, locationId).map((s) => s.contractId))
  return d.contracts.filter((c) => ids.has(c.id))
}

export const locationsOnContract = (d: Dataset, contractId: Id): Location[] => {
  const ids = new Set(servicesOnContract(d, contractId).map((s) => s.locationId))
  return d.locations.filter((l) => ids.has(l.id))
}

export const ticketsAtLocation = (d: Dataset, locationId: Id) =>
  d.tickets.filter((t) => t.locationId === locationId)

export const ticketsForService = (d: Dataset, serviceId: Id) =>
  d.tickets.filter((t) => t.serviceId === serviceId)

export const usersForTenant = (d: Dataset, tenantId: Id) => d.users.filter((u) => u.tenantId === tenantId)

/* ------------------------------------------------------------------ documents */

export function documentsFor(
  d: Dataset,
  entityType: DocumentRecord['relatedEntityType'],
  entityId: Id,
): DocumentRecord[] {
  return d.documents.filter((doc) => doc.relatedEntityType === entityType && doc.relatedEntityId === entityId)
}

/** Documents attached to a location directly, or to any service at that location. */
export function documentsAtLocation(d: Dataset, locationId: Id): DocumentRecord[] {
  return d.documents.filter((doc) => doc.locationId === locationId || doc.relatedEntityId === locationId)
}

/** Documents on a contract, plus documents on the services that contract covers. */
export function documentsOnContract(d: Dataset, contractId: Id): DocumentRecord[] {
  const serviceIds = new Set(servicesOnContract(d, contractId).map((s) => s.id))
  return d.documents.filter(
    (doc) =>
      (doc.relatedEntityType === 'Contract' && doc.relatedEntityId === contractId) ||
      (doc.relatedEntityType === 'Service' && serviceIds.has(doc.relatedEntityId)),
  )
}

/* --------------------------------------------------------------- derivations */

/**
 * Contract MRC, rolled up from the services on it.
 *
 * Deliberately derived rather than stored: the specification put an `mrc` field
 * on both Service and Contract, which lets two screens disagree about the same
 * money. Service.mrc is the single source of truth.
 */
export const contractMrc = (d: Dataset, contractId: Id): number =>
  servicesOnContract(d, contractId).reduce((sum, s) => sum + s.mrc, 0)

/** Monthly spend across a set of services. Active services only. */
export const totalMrc = (services: Service[]): number =>
  services.filter((s) => s.status === 'Active').reduce((sum, s) => sum + s.mrc, 0)

export const openTickets = (tickets: Ticket[]): Ticket[] =>
  tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed')

export function upcomingRenewals(d: Dataset, withinDays = RENEWAL_WINDOW_DAYS): Contract[] {
  return d.contracts
    .filter((c) => {
      const remaining = daysUntil(c.endDate)
      return remaining >= 0 && remaining <= withinDays
    })
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
}

export const recentTickets = (tickets: Ticket[], limit = 5): Ticket[] =>
  [...tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit)

/* ------------------------------------------------------------- aggregations */

/*
 * Chart aggregations live here rather than in the dashboard pages, for the same
 * reason every other relation does: one place to change when a real API arrives,
 * and one definition of each number so a chart can never disagree with the table
 * beside it. All of them take the already-scoped dataset, so tenant isolation
 * comes for free.
 */

export interface Slice {
  label: string
  value: number
  /** Route suffix for drilling into the records behind the slice. */
  suffix?: string
}

/** Monthly cost per service type, largest first. Active services only. */
export function mrcByServiceType(d: Dataset): Slice[] {
  const totals = new Map<string, number>()

  for (const service of d.services) {
    if (service.status !== 'Active') continue
    totals.set(service.type, (totals.get(service.type) ?? 0) + service.mrc)
  }

  return [...totals]
    .map(([label, value]) => ({ label, value, suffix: '/services' }))
    .sort((a, b) => b.value - a.value)
}

/** Monthly cost per carrier, largest first. Shows vendor concentration. */
export function mrcByCarrier(d: Dataset): Slice[] {
  const totals = new Map<string, number>()

  for (const service of d.services) {
    if (service.status !== 'Active') continue
    totals.set(service.carrierId, (totals.get(service.carrierId) ?? 0) + service.mrc)
  }

  return [...totals]
    .map(([carrierId, value]) => ({
      label: getCarrier(d, carrierId)?.name ?? 'Unknown carrier',
      value,
      suffix: `/carriers/${carrierId}`,
    }))
    .sort((a, b) => b.value - a.value)
}

export interface RunwayMonth {
  /** Sortable YYYY-MM key. */
  monthKey: string
  /** Short axis label, e.g. "Sep". */
  label: string
  /** Longer label used in the tooltip, e.g. "September 2026". */
  longLabel: string
  mrc: number
  contractCount: number
  /** Inside the renewal notice window — drawn in the warning tone. */
  urgent: boolean
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/**
 * Monthly cost reaching its contract end date, month by month.
 *
 * Every month in the window is emitted even when nothing expires in it — gaps in
 * a time axis must read as zero, not as missing. Values come from contractMrc()
 * so the chart totals always match the contract screens.
 */
export function renewalRunway(d: Dataset, months = 12, windowDays = RENEWAL_WINDOW_DAYS): RunwayMonth[] {
  const start = new Date(
    Date.UTC(PROTOTYPE_TODAY.getUTCFullYear(), PROTOTYPE_TODAY.getUTCMonth(), 1),
  )

  const buckets: RunwayMonth[] = []

  for (let offset = 0; offset < months; offset++) {
    const month = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + offset, 1))
    const index = month.getUTCMonth()

    buckets.push({
      monthKey: `${month.getUTCFullYear()}-${String(index + 1).padStart(2, '0')}`,
      label: MONTHS_SHORT[index],
      longLabel: `${MONTHS_LONG[index]} ${month.getUTCFullYear()}`,
      mrc: 0,
      contractCount: 0,
      urgent: false,
    })
  }

  const byKey = new Map(buckets.map((bucket) => [bucket.monthKey, bucket]))

  for (const contract of d.contracts) {
    const remaining = daysUntil(contract.endDate)
    if (remaining < 0) continue // already expired — shown on the contracts screen instead

    const bucket = byKey.get(contract.endDate.slice(0, 7))
    if (!bucket) continue

    bucket.mrc += contractMrc(d, contract.id)
    bucket.contractCount += 1
    if (remaining <= windowDays) bucket.urgent = true
  }

  return buckets
}

/** Monthly cost per customer, largest first. Admin reporting only. */
export function mrcByCustomer(d: Dataset): Slice[] {
  return d.tenants
    .map((tenant) => ({
      label: tenant.name,
      value: totalMrc(d.services.filter((service) => service.tenantId === tenant.id)),
      suffix: `/customers/${tenant.id}`,
    }))
    .sort((a, b) => b.value - a.value)
}

/** Monthly cost per location, largest first — the cost-centre ranking. */
export function mrcByLocation(d: Dataset): Slice[] {
  const totals = new Map<string, number>()

  for (const service of d.services) {
    if (service.status !== 'Active') continue
    totals.set(service.locationId, (totals.get(service.locationId) ?? 0) + service.mrc)
  }

  return [...totals]
    .map(([locationId, value]) => ({
      label: getLocation(d, locationId)?.name ?? 'Unknown location',
      value,
      suffix: `/locations/${locationId}`,
    }))
    .sort((a, b) => b.value - a.value)
}

export interface StatusSlice {
  label: string
  value: number
  /** Which reserved status tone the segment takes. */
  tone: 'ok' | 'info' | 'warn' | 'danger' | 'neutral'
  /** Value to pass as a list filter when the segment is clicked. */
  filterValue: string
}

/**
 * Circuit estate by state — the operational health strip.
 *
 * Order is fixed (healthy to worst) rather than sorted by size, so the strip
 * reads the same way every time and a growing "Disconnected" segment is visible
 * as movement rather than as a reordering.
 */
export function circuitHealth(d: Dataset): StatusSlice[] {
  const order: Array<{ status: Circuit['status']; tone: StatusSlice['tone'] }> = [
    { status: 'Active', tone: 'ok' },
    { status: 'Provisioning', tone: 'info' },
    { status: 'Degraded', tone: 'warn' },
    { status: 'Disconnected', tone: 'danger' },
  ]

  return order.map(({ status, tone }) => ({
    label: status,
    tone,
    filterValue: status,
    value: d.circuits.filter((circuit) => circuit.status === status).length,
  }))
}

/** Open ticket load by priority, most urgent first. */
export function ticketsByPriority(d: Dataset): StatusSlice[] {
  const order: Array<{ priority: TicketPriority; tone: StatusSlice['tone'] }> = [
    { priority: 'Critical', tone: 'danger' },
    { priority: 'High', tone: 'warn' },
    { priority: 'Medium', tone: 'info' },
    { priority: 'Low', tone: 'neutral' },
  ]

  return order.map(({ priority, tone }) => ({
    label: priority,
    tone,
    filterValue: priority,
    value: d.tickets.filter((ticket) => ticket.priority === priority).length,
  }))
}

/**
 * Renewal exposure in ageing buckets.
 *
 * The procurement view of the same contracts the runway charts: how much monthly
 * cost sits in each notice window, plus what has already lapsed.
 */
export function renewalExposure(d: Dataset): StatusSlice[] {
  const buckets: Array<{ label: string; tone: StatusSlice['tone']; filterValue: string; test: (days: number) => boolean }> = [
    { label: 'Expired', tone: 'danger', filterValue: 'Expired', test: (days) => days < 0 },
    { label: 'Ends in 30 days', tone: 'danger', filterValue: 'Expiring Soon', test: (days) => days >= 0 && days <= 30 },
    { label: '31–60 days', tone: 'warn', filterValue: 'Expiring Soon', test: (days) => days > 30 && days <= 60 },
    { label: '61–90 days', tone: 'info', filterValue: 'Expiring Soon', test: (days) => days > 60 && days <= 90 },
    { label: 'Beyond 90 days', tone: 'ok', filterValue: 'Active', test: (days) => days > 90 },
  ]

  return buckets.map((bucket) => ({
    label: bucket.label,
    tone: bucket.tone,
    filterValue: bucket.filterValue,
    value: d.contracts
      .filter((contract) => bucket.test(daysUntil(contract.endDate)))
      .reduce((sum, contract) => sum + contractMrc(d, contract.id), 0),
  }))
}

export interface MonthBucket {
  monthKey: string
  label: string
  longLabel: string
  value: number
}

function emptyMonths(months: number, endingAt = PROTOTYPE_TODAY): MonthBucket[] {
  const buckets: MonthBucket[] = []

  for (let offset = months - 1; offset >= 0; offset--) {
    const month = new Date(Date.UTC(endingAt.getUTCFullYear(), endingAt.getUTCMonth() - offset, 1))
    const index = month.getUTCMonth()

    buckets.push({
      monthKey: `${month.getUTCFullYear()}-${String(index + 1).padStart(2, '0')}`,
      label: MONTHS_SHORT[index],
      longLabel: `${MONTHS_LONG[index]} ${month.getUTCFullYear()}`,
      value: 0,
    })
  }

  return buckets
}

/** Tickets raised per month, over a trailing window. Empty months stay as zero. */
export function ticketsByMonth(d: Dataset, months = 6): MonthBucket[] {
  const buckets = emptyMonths(months)
  const byKey = new Map(buckets.map((bucket) => [bucket.monthKey, bucket]))

  for (const ticket of d.tickets) {
    const bucket = byKey.get(ticket.createdAt.slice(0, 7))
    if (bucket) bucket.value += 1
  }

  return buckets
}

/**
 * Spend under management — cumulative monthly cost by service install date.
 *
 * Cumulative rather than per-month: individual months carry only a handful of
 * installs, which reads as noise. The running total is the number the business
 * actually tracks.
 */
export function spendUnderManagement(d: Dataset, months = 24): MonthBucket[] {
  const buckets = emptyMonths(months)
  const firstKey = buckets[0].monthKey

  // Everything installed before the window forms the opening balance, otherwise
  // the line starts at zero and implies the estate was built from nothing.
  let running = d.services
    .filter((service) => service.status === 'Active' && service.installedAt.slice(0, 7) < firstKey)
    .reduce((sum, service) => sum + service.mrc, 0)

  for (const bucket of buckets) {
    running += d.services
      .filter((service) => service.status === 'Active' && service.installedAt.slice(0, 7) === bucket.monthKey)
      .reduce((sum, service) => sum + service.mrc, 0)

    bucket.value = running
  }

  return buckets
}

export interface MatrixCell {
  row: string
  column: string
  value: number
}

/**
 * Support load as a status-by-priority grid.
 *
 * A grid rather than a stacked bar because the reader's job is to find the hot
 * cell — "how many criticals are still open" — not to compare totals.
 */
export function ticketMatrix(d: Dataset): {
  rows: string[]
  columns: string[]
  cells: MatrixCell[]
} {
  const rows: TicketStatus[] = ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed']
  const columns: TicketPriority[] = ['Critical', 'High', 'Medium', 'Low']

  const cells = rows.flatMap((row) =>
    columns.map((column) => ({
      row,
      column,
      value: d.tickets.filter((ticket) => ticket.status === row && ticket.priority === column).length,
    })),
  )

  return { rows, columns, cells }
}

/**
 * Describes the record a document hangs off.
 *
 * Returns a route SUFFIX rather than a finished URL: the caller prefixes it with
 * its own role root (/customer or /admin). Customer records exist only under
 * /admin, so those are flagged and the customer portal renders them as plain
 * text instead of a dead link.
 */
export function describeRelatedEntity(
  d: Dataset,
  doc: DocumentRecord,
): { label: string; suffix: string | null; adminOnly: boolean } {
  switch (doc.relatedEntityType) {
    case 'Customer': {
      const tenant = getTenant(d, doc.relatedEntityId)
      return {
        label: tenant?.name ?? 'Customer',
        suffix: tenant ? `/customers/${tenant.id}` : null,
        adminOnly: true,
      }
    }
    case 'Location': {
      const location = getLocation(d, doc.relatedEntityId)
      return { label: location?.name ?? 'Location', suffix: location ? `/locations/${location.id}` : null, adminOnly: false }
    }
    case 'Service': {
      const service = getService(d, doc.relatedEntityId)
      return { label: service?.name ?? 'Service', suffix: service ? `/services/${service.id}` : null, adminOnly: false }
    }
    case 'Circuit': {
      const circuit = getCircuit(d, doc.relatedEntityId)
      return { label: circuit?.circuitId ?? 'Circuit', suffix: circuit ? `/circuits/${circuit.id}` : null, adminOnly: false }
    }
    case 'Contract': {
      const contract = getContract(d, doc.relatedEntityId)
      return {
        label: contract?.contractNumber ?? 'Contract',
        suffix: contract ? `/contracts/${contract.id}` : null,
        adminOnly: false,
      }
    }
    default:
      return { label: '—', suffix: null, adminOnly: false }
  }
}

export type { User }
