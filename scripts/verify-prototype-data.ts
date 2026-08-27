/**
 * Data integrity harness for the prototype dataset.
 *
 * The mock data is generated, so these assertions are what keep the generator
 * honest: every foreign key resolves, tenant scoping leaks nothing, the
 * modelling rules the screens rely on hold, and every screen has rows to show.
 *
 * Run with: npm run verify:data
 */
import { seedDataset } from '@/data/dataset'
import {
  circuitForService,
  contractMrc,
  circuitHealth,
  daysUntil,
  mrcByCarrier,
  mrcByLocation,
  mrcByServiceType,
  renewalExposure,
  renewalRunway,
  spendUnderManagement,
  ticketMatrix,
  ticketsByMonth,
  ticketsByPriority,
  scopeToTenant,
  servicesOnContract,
  totalMrc,
  upcomingRenewals,
} from '@/data/selectors'

let failures = 0
const check = (name: string, ok: boolean, extra = '') => {
  if (!ok) {
    failures++
    console.log(`FAIL  ${name} ${extra}`)
  } else {
    console.log(`ok    ${name} ${extra}`)
  }
}

const d = seedDataset
const ids = <T extends { id: string }>(rows: T[]) => new Set(rows.map((r) => r.id))

const tenantIds = ids(d.tenants)
const locationIds = ids(d.locations)
const carrierIds = ids(d.carriers)
const serviceIds = ids(d.services)
const contractIds = ids(d.contracts)
const circuitIds = ids(d.circuits)

console.log(
  `\nrecord counts: tenants=${d.tenants.length} users=${d.users.length} locations=${d.locations.length} ` +
    `services=${d.services.length} circuits=${d.circuits.length} contracts=${d.contracts.length} ` +
    `documents=${d.documents.length} tickets=${d.tickets.length} imports=${d.imports.length}\n`,
)

// --- referential integrity -------------------------------------------------
check('every location has a real tenant', d.locations.every((l) => tenantIds.has(l.tenantId)))
check(
  'every service resolves tenant/location/carrier/contract',
  d.services.every(
    (s) =>
      tenantIds.has(s.tenantId) &&
      locationIds.has(s.locationId) &&
      carrierIds.has(s.carrierId) &&
      contractIds.has(s.contractId),
  ),
)
check('every circuit has a real service', d.circuits.every((c) => serviceIds.has(c.serviceId)))
check('every contract resolves tenant + carrier', d.contracts.every((c) => tenantIds.has(c.tenantId) && carrierIds.has(c.carrierId)))
check(
  'every document points at a record that exists',
  d.documents.every((doc) => {
    const pool = {
      Customer: tenantIds,
      Location: locationIds,
      Service: serviceIds,
      Circuit: circuitIds,
      Contract: contractIds,
    }[doc.relatedEntityType]
    return pool.has(doc.relatedEntityId)
  }),
)
check(
  'every ticket resolves its location and service',
  d.tickets.every(
    (t) => (!t.locationId || locationIds.has(t.locationId)) && (!t.serviceId || serviceIds.has(t.serviceId)),
  ),
)

// --- modelling rules that pages depend on ----------------------------------
check(
  'service <-> circuit is 1:1',
  new Set(d.circuits.map((c) => c.serviceId)).size === d.circuits.length,
)
check(
  'no circuit on a non-delivered service type',
  d.circuits.every((c) => {
    const s = d.services.find((x) => x.id === c.serviceId)!
    return s.type !== 'Security' && s.type !== 'Other'
  }),
)
check(
  'service, location and contract always share one tenant',
  d.services.every((s) => {
    const loc = d.locations.find((l) => l.id === s.locationId)!
    const con = d.contracts.find((c) => c.id === s.contractId)!
    return loc.tenantId === s.tenantId && con.tenantId === s.tenantId
  }),
)
check(
  'ticket location belongs to the ticket tenant',
  d.tickets.every((t) => {
    if (!t.locationId) return true
    return d.locations.find((l) => l.id === t.locationId)!.tenantId === t.tenantId
  }),
)
check(
  'contract MRC equals the sum of its services',
  d.contracts.every(
    (c) => contractMrc(d, c.id) === servicesOnContract(d, c.id).reduce((sum, s) => sum + s.mrc, 0),
  ),
)

// --- tenant isolation ------------------------------------------------------
for (const tenant of d.tenants) {
  const scoped = scopeToTenant(d, tenant.id)
  const clean =
    scoped.locations.every((l) => l.tenantId === tenant.id) &&
    scoped.services.every((s) => s.tenantId === tenant.id) &&
    scoped.contracts.every((c) => c.tenantId === tenant.id) &&
    scoped.documents.every((doc) => doc.tenantId === tenant.id) &&
    scoped.tickets.every((t) => t.tenantId === tenant.id) &&
    scoped.users.every((u) => u.tenantId === tenant.id) &&
    scoped.circuits.every((c) => scoped.services.some((s) => s.id === c.serviceId))
  check(`tenant scope leaks nothing: ${tenant.name}`, clean, `(${scoped.locations.length} locations)`)
}

const acme = scopeToTenant(d, 't-acme')
const global = scopeToTenant(d, 't-global')
check(
  'two demo tenants share no records',
  !acme.locations.some((l) => global.locations.some((g) => g.id === l.id)) &&
    acme.services.length > 0 &&
    global.services.length > 0,
)

// --- every screen has something to show ------------------------------------
for (const tenant of d.tenants) {
  const s = scopeToTenant(d, tenant.id)
  check(
    `${tenant.name} has data on every customer screen`,
    s.locations.length > 0 &&
      s.services.length > 0 &&
      s.circuits.length > 0 &&
      s.contracts.length > 0 &&
      s.documents.length > 0 &&
      s.tickets.length > 0 &&
      s.users.length > 0,
  )
}

check('at least one list needs pagination (>10 rows)', d.services.length > 10 && d.locations.length > 10)
check('renewal journey has data: upcoming renewals exist', upcomingRenewals(d).length > 0, `(${upcomingRenewals(d).length})`)
check(
  'expired contracts exist so the alert path is reachable',
  d.contracts.some((c) => new Date(c.endDate) < new Date('2026-08-27')),
)
check('open tickets exist', d.tickets.some((t) => t.status !== 'Resolved' && t.status !== 'Closed'))
check('monthly cost is non-zero', totalMrc(d.services) > 0, `($${totalMrc(d.services).toLocaleString()}/mo)`)
check(
  'demo logins resolve',
  ['customer@demo.com', 'customer2@demo.com', 'admin@demo.com'].every((email) =>
    d.users.some((u) => u.email === email),
  ),
)
check(
  'the two customer logins sit in different tenants',
  d.users.find((u) => u.email === 'customer@demo.com')?.tenantId !==
    d.users.find((u) => u.email === 'customer2@demo.com')?.tenantId,
)
check(
  'every service that should have a circuit has exactly one',
  d.services
    .filter((s) => !['Security', 'Other'].includes(s.type))
    .every((s) => circuitForService(d, s.id) !== undefined),
)

// --- chart aggregations ----------------------------------------------------
// A chart that disagrees with the table beside it is worse than no chart, so
// each aggregation is checked against the same total the KPI cards use.

const byType = mrcByServiceType(d)
const byCarrier = mrcByCarrier(d)
const runway = renewalRunway(d)
const activeTotal = totalMrc(d.services)

check(
  'cost by service type totals to the platform monthly cost',
  byType.reduce((sum, slice) => sum + slice.value, 0) === activeTotal,
)
check(
  'cost by carrier totals to the platform monthly cost',
  byCarrier.reduce((sum, slice) => sum + slice.value, 0) === activeTotal,
)
check('cost by service type is sorted descending', byType.every((slice, i) => i === 0 || byType[i - 1].value >= slice.value))
check('cost by carrier is sorted descending', byCarrier.every((slice, i) => i === 0 || byCarrier[i - 1].value >= slice.value))
check('every carrier slice resolves to a real carrier name', byCarrier.every((slice) => slice.label !== 'Unknown carrier'))

check('renewal runway emits every month in the window', runway.length === 12, `(${runway.length} months)`)
check(
  'runway months are contiguous and ascending',
  runway.every((month, i) => i === 0 || month.monthKey > runway[i - 1].monthKey),
)
check(
  'runway totals match the contracts ending inside the window',
  runway.reduce((sum, month) => sum + month.mrc, 0) ===
    d.contracts
      .filter((c) => {
        const remaining = daysUntil(c.endDate)
        return remaining >= 0 && runway.some((month) => month.monthKey === c.endDate.slice(0, 7))
      })
      .reduce((sum, c) => sum + contractMrc(d, c.id), 0),
)
check('runway has at least one month with value', runway.some((month) => month.mrc > 0))
check(
  'runway has at least one urgent month, so the emphasis state is reachable',
  runway.some((month) => month.urgent),
  `(${runway.filter((m) => m.urgent).length} urgent)`,
)
check('no expired contract leaks into the runway', runway.every((month) => month.monthKey >= '2026-08'))

// Both chart states must be reachable per tenant, or a demo hits an empty card.
for (const tenant of d.tenants) {
  const scoped = scopeToTenant(d, tenant.id)
  check(
    `${tenant.name} has chartable data on its dashboard`,
    mrcByServiceType(scoped).length > 0 && renewalRunway(scoped).some((month) => month.mrc > 0),
  )
}

// --- the second wave of charts ---------------------------------------------

const health = circuitHealth(d)
const priorities = ticketsByPriority(d)
const exposure = renewalExposure(d)
const trend = ticketsByMonth(d, 6)
const spend = spendUnderManagement(d, 24)
const matrix = ticketMatrix(d)
const byLocation = mrcByLocation(d)

check('circuit health covers every circuit exactly once', health.reduce((sum, s) => sum + s.value, 0) === d.circuits.length)
check(
  'circuit health keeps a fixed best-to-worst order',
  health.map((s) => s.label).join() === 'Active,Provisioning,Degraded,Disconnected',
)
check('every circuit state is reachable in the seed data', health.every((s) => s.value > 0))

check('ticket priority strip covers every ticket', priorities.reduce((sum, s) => sum + s.value, 0) === d.tickets.length)
check('ticket matrix covers every ticket', matrix.cells.reduce((sum, c) => sum + c.value, 0) === d.tickets.length)
check('ticket matrix is 5 statuses by 4 priorities', matrix.rows.length === 5 && matrix.columns.length === 4)
check(
  'ticket matrix has enough populated cells to be worth drawing',
  matrix.cells.filter((c) => c.value > 0).length >= 10,
  `(${matrix.cells.filter((c) => c.value > 0).length} of 20)`,
)

check(
  'renewal exposure accounts for every contract',
  exposure.reduce((sum, s) => sum + s.value, 0) === d.contracts.reduce((sum, c) => sum + contractMrc(d, c.id), 0),
)
check('renewal exposure has an expired band with value', exposure[0].value > 0)

check('ticket trend emits six months', trend.length === 6)
check('ticket trend never exceeds the ticket count', trend.reduce((sum, m) => sum + m.value, 0) <= d.tickets.length)

check('spend under management emits the full window', spend.length === 24)
check('spend under management never decreases', spend.every((m, i) => i === 0 || m.value >= spend[i - 1].value))
check('spend under management ends at the active monthly total', spend[spend.length - 1].value === totalMrc(d.services))
check('spend under management opens above zero', spend[0].value > 0, `($${spend[0].value.toLocaleString()})`)

check('cost by location totals to the platform monthly cost', byLocation.reduce((sum, s) => sum + s.value, 0) === activeTotal)
check('cost by location varies enough to rank', new Set(byLocation.map((s) => s.value)).size > 3)

// Chart segments link into list filters, so the values they emit must be values
// those filters actually accept — otherwise a click lands on an empty table.
const CIRCUIT_STATUSES = new Set<string>(d.circuits.map((c) => c.status))
check(
  'every circuit health segment filters to real rows',
  health.every((s) => s.value === 0 || CIRCUIT_STATUSES.has(s.filterValue)),
)
const PRIORITY_VALUES = new Set<string>(d.tickets.map((t) => t.priority))
check(
  'every priority segment filters to real rows',
  priorities.every((s) => s.value === 0 || PRIORITY_VALUES.has(s.filterValue)),
)
check(
  'every exposure band maps to a renewal status the contracts list offers',
  exposure.every((s) => ['Active', 'Expiring Soon', 'Expired'].includes(s.filterValue)),
)

console.log(failures === 0 ? '\nALL CHECKS PASSED\n' : `\n${failures} CHECK(S) FAILED\n`)
process.exit(failures === 0 ? 0 : 1)
