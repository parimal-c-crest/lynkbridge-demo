/**
 * Render smoke test.
 *
 * Renders every route in the product for the role that owns it and fails on any
 * exception or empty output. This catches the class of bug a typecheck cannot —
 * a missing relation, a bad lookup, a component that throws on a real record.
 *
 * Run with: npm run verify:render
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/App'
import { DataProvider } from '@/state/DataContext'
import { SessionProvider } from '@/state/SessionContext'
import { SettingsProvider } from '@/state/SettingsContext'
import { ToastProvider } from '@/state/ToastContext'
import { seedDataset } from '@/data/dataset'
import { mrcByServiceType, renewalRunway } from '@/data/selectors'
import { ChartFrame } from '@/components/charts/ChartFrame'
import { BarChart } from '@/components/charts/BarChart'
import { ColumnChart } from '@/components/charts/ColumnChart'

const d = seedDataset

// Real identifiers, so detail pages render actual related records.
const acmeLocation = d.locations.find((l) => l.tenantId === 't-acme')!
const acmeService = d.services.find((s) => s.tenantId === 't-acme')!
const acmeCircuit = d.circuits.find((c) => d.services.find((s) => s.id === c.serviceId)?.tenantId === 't-acme')!
const acmeContract = d.contracts.find((c) => c.tenantId === 't-acme')!
const acmeDocument = d.documents.find((doc) => doc.tenantId === 't-acme')!
const acmeTicket = d.tickets.find((t) => t.tenantId === 't-acme')!

const anyLocation = d.locations[0]
const anyService = d.services[0]
const anyCircuit = d.circuits[0]
const anyContract = d.contracts[0]
const anyDocument = d.documents[0]
const anyTicket = d.tickets[0]
const anyCarrier = d.carriers[0]
const anyUser = d.users[0]

// Records picked so the drill-down assertions have something real to look for.
const DEGRADED_CIRCUIT = d.circuits.find((c) => c.status === 'Degraded')!
const ACTIVE_CIRCUIT = d.circuits.find((c) => c.status === 'Active')!
const CRITICAL_TICKET = d.tickets.find((t) => t.priority === 'Critical')!
const LOW_TICKET = d.tickets.find((t) => t.priority === 'Low')!
const EXPIRED_CONTRACT = d.contracts.find((c) => c.endDate < '2026-08-27')!

interface Case {
  path: string
  email: string | null
  /** Text that must appear, proving the page rendered its own content. */
  expect?: string
  /**
   * The route guard is expected to reject this URL for this role.
   *
   * A guard renders <Navigate>, which produces no markup in a static render, so
   * the assertion is that NOTHING was rendered — in particular, none of the
   * other role's content leaked. Where the redirect lands is covered separately
   * by the direct render of the target route.
   */
  expectBlockedByGuard?: boolean
  /** Text that must NOT appear — used to prove a filter actually excluded rows. */
  expectMissing?: string
}

const CASES: Case[] = [
  { path: '/login', email: null, expect: 'Sign in' },
  { path: '/roadmap', email: null, expect: 'Open questions for discovery' },
  { path: '/no-such-page', email: null, expect: 'Page not found' },

  // Customer portal — Acme
  { path: '/customer/dashboard', email: 'customer@demo.com', expect: 'Upcoming contract renewals' },
  { path: '/customer/dashboard', email: 'customer@demo.com', expect: 'Renewal runway' },
  { path: '/customer/dashboard', email: 'customer@demo.com', expect: 'Monthly cost by service type' },
  { path: '/customer/locations', email: 'customer@demo.com', expect: 'Locations' },
  { path: `/customer/locations/${acmeLocation.id}`, email: 'customer@demo.com', expect: acmeLocation.city },
  { path: '/customer/services', email: 'customer@demo.com', expect: 'Contract End' },
  { path: `/customer/services/${acmeService.id}`, email: 'customer@demo.com', expect: 'Account number' },
  { path: '/customer/circuits', email: 'customer@demo.com', expect: 'Circuit ID' },
  { path: `/customer/circuits/${acmeCircuit.id}`, email: 'customer@demo.com', expect: 'Demarcation' },
  { path: '/customer/contracts', email: 'customer@demo.com', expect: 'Renewal Status' },
  { path: `/customer/contracts/${acmeContract.id}`, email: 'customer@demo.com', expect: acmeContract.contractNumber },
  { path: '/customer/documents', email: 'customer@demo.com', expect: 'Related Entity' },
  { path: `/customer/documents/${acmeDocument.id}`, email: 'customer@demo.com', expect: 'Preview placeholder' },
  { path: '/customer/tickets', email: 'customer@demo.com', expect: 'Open tickets' },
  { path: '/customer/locations/new', email: 'customer@demo.com', expect: 'Add a location' },
  { path: '/customer/services/new', email: 'customer@demo.com', expect: 'Add a service' },
  { path: '/customer/circuits/new', email: 'customer@demo.com', expect: 'Add a circuit' },
  { path: '/customer/contracts/new', email: 'customer@demo.com', expect: 'Add a contract' },
  { path: '/customer/tickets/new', email: 'customer@demo.com', expect: 'Create a support ticket' },
  { path: `/customer/tickets/${acmeTicket.id}`, email: 'customer@demo.com', expect: 'History' },
  { path: '/customer/profile', email: 'customer@demo.com', expect: 'People at your organisation' },

  // Second tenant, to prove the same screens render under a different scope
  { path: '/customer/dashboard', email: 'customer2@demo.com', expect: 'Global Industries' },
  { path: '/customer/locations', email: 'customer2@demo.com', expect: 'Locations' },

  // Admin portal
  { path: '/admin/dashboard', email: 'admin@demo.com', expect: 'Platform overview' },
  { path: '/admin/dashboard', email: 'admin@demo.com', expect: 'Renewal runway' },
  { path: '/admin/dashboard', email: 'admin@demo.com', expect: 'Monthly cost by carrier' },
  { path: '/admin/customers', email: 'admin@demo.com', expect: 'Acme Corporation' },
  { path: '/admin/customers/t-northwind', email: 'admin@demo.com', expect: 'Northwind Retail Group' },
  { path: '/admin/customers/new', email: 'admin@demo.com', expect: 'Add a customer' },
  { path: '/admin/locations', email: 'admin@demo.com', expect: 'Customer' },
  { path: `/admin/locations/${anyLocation.id}`, email: 'admin@demo.com', expect: anyLocation.city },
  { path: '/admin/services', email: 'admin@demo.com', expect: 'Contract End' },
  { path: `/admin/services/${anyService.id}`, email: 'admin@demo.com', expect: 'Bandwidth' },
  { path: '/admin/circuits', email: 'admin@demo.com', expect: 'Circuit ID' },
  { path: `/admin/circuits/${anyCircuit.id}`, email: 'admin@demo.com', expect: 'Carrier account' },
  { path: '/admin/carriers', email: 'admin@demo.com', expect: 'Carriers' },
  { path: `/admin/carriers/${anyCarrier.id}`, email: 'admin@demo.com', expect: 'Account manager' },
  { path: '/admin/contracts', email: 'admin@demo.com', expect: 'Renewal Status' },
  { path: `/admin/contracts/${anyContract.id}`, email: 'admin@demo.com', expect: 'Monthly cost' },
  { path: '/admin/documents', email: 'admin@demo.com', expect: 'Related Entity' },
  { path: `/admin/documents/${anyDocument.id}`, email: 'admin@demo.com', expect: 'Preview placeholder' },
  { path: '/admin/tickets', email: 'admin@demo.com', expect: 'Support tickets' },
  { path: '/admin/locations/new', email: 'admin@demo.com', expect: 'Add a location' },
  { path: '/admin/services/new', email: 'admin@demo.com', expect: 'Add a service' },
  { path: '/admin/circuits/new', email: 'admin@demo.com', expect: 'Add a circuit' },
  { path: '/admin/contracts/new', email: 'admin@demo.com', expect: 'Add a contract' },
  { path: '/admin/tickets/new', email: 'admin@demo.com', expect: 'Create a support ticket' },
  { path: `/admin/tickets/${anyTicket.id}`, email: 'admin@demo.com', expect: 'Ticket information' },
  { path: '/admin/imports', email: 'admin@demo.com', expect: 'Columns expected for' },
  { path: '/admin/users', email: 'admin@demo.com', expect: 'Last Login' },
  { path: '/admin/users/new', email: 'admin@demo.com', expect: 'Add a user' },
  { path: `/admin/users/${anyUser.id}`, email: 'admin@demo.com', expect: 'Last sign-in' },

  // Reports and Settings
  { path: '/customer/reports', email: 'customer@demo.com', expect: 'Run report' },
  { path: '/customer/reports/cost-by-service-type', email: 'customer@demo.com', expect: 'Export CSV' },
  { path: '/customer/reports/renewal-schedule', email: 'customer@demo.com', expect: 'Days remaining' },
  { path: '/customer/settings', email: 'customer@demo.com', expect: 'Contract renewal notice window' },
  { path: '/admin/reports', email: 'admin@demo.com', expect: 'Cost by customer' },
  { path: '/admin/reports/cost-by-customer', email: 'admin@demo.com', expect: 'Total under management' },
  { path: '/admin/reports/service-inventory', email: 'admin@demo.com', expect: 'Account number' },
  { path: '/admin/reports/circuit-inventory', email: 'admin@demo.com', expect: 'Carrier account' },
  { path: '/admin/reports/ticket-register', email: 'admin@demo.com', expect: 'Open tickets' },
  { path: '/admin/reports/ticket-volume', email: 'admin@demo.com', expect: 'Tickets raised' },
  { path: '/admin/reports/renewal-exposure', email: 'admin@demo.com', expect: 'Beyond 90 days' },
  { path: '/admin/reports/location-register', email: 'admin@demo.com', expect: 'Site type' },
  { path: '/admin/reports/contract-inventory', email: 'admin@demo.com', expect: 'Term (months)' },
  { path: '/admin/reports/cost-by-location', email: 'admin@demo.com', expect: 'Monthly cost' },
  { path: '/admin/reports/cost-by-carrier', email: 'admin@demo.com', expect: 'Share' },
  { path: '/admin/settings', email: 'admin@demo.com', expect: 'Reference vocabulary' },
  { path: '/admin/settings', email: 'admin@demo.com', expect: 'Placeholder' },

  // An admin-only report must not resolve for a customer
  { path: '/customer/reports/cost-by-customer', email: 'customer@demo.com', expect: 'Report not found' },
  { path: '/customer/reports/does-not-exist', email: 'customer@demo.com', expect: 'Report not found' },

  // Missing records must land on the in-page not-found, not crash
  { path: '/customer/locations/loc-does-not-exist', email: 'customer@demo.com', expect: 'Location not found' },
  { path: '/admin/customers/t-does-not-exist', email: 'admin@demo.com', expect: 'Customer not found' },

  // Wrong-role URLs are rejected by the guard before any content renders
  { path: '/admin/imports', email: 'customer@demo.com', expectBlockedByGuard: true },
  { path: '/admin/customers', email: 'customer@demo.com', expectBlockedByGuard: true },
  { path: '/admin/customers/new', email: 'customer@demo.com', expectBlockedByGuard: true },
  { path: '/admin/users/new', email: 'customer@demo.com', expectBlockedByGuard: true },
  { path: '/customer/dashboard', email: 'admin@demo.com', expectBlockedByGuard: true },
  // Signed-out access to an authenticated route is likewise blocked
  { path: '/customer/dashboard', email: null, expectBlockedByGuard: true },

  // Charts on the list screens
  { path: '/admin/circuits', email: 'admin@demo.com', expect: 'Circuit health' },
  { path: '/admin/contracts', email: 'admin@demo.com', expect: 'Renewal exposure' },
  { path: '/admin/tickets', email: 'admin@demo.com', expect: 'Where the load sits' },
  { path: '/admin/locations', email: 'admin@demo.com', expect: 'Highest-cost locations' },
  { path: '/customer/circuits', email: 'customer@demo.com', expect: 'Circuit health' },
  { path: '/customer/tickets', email: 'customer@demo.com', expect: 'Tickets by priority' },
  { path: '/admin/dashboard', email: 'admin@demo.com', expect: 'Spend under management' },
  { path: '/admin/dashboard', email: 'admin@demo.com', expect: 'Tickets raised' },
  { path: '/customer/dashboard', email: 'customer@demo.com', expect: 'Spend under management' },

  // Drill-down: a chart segment links to a filtered list, so the filter has to
  // survive the URL and actually exclude the rows it claims to.
  {
    path: '/admin/circuits?status=Degraded',
    email: 'admin@demo.com',
    expect: DEGRADED_CIRCUIT.circuitId,
    expectMissing: ACTIVE_CIRCUIT.circuitId,
  },
  {
    path: '/admin/tickets?priority=Critical',
    email: 'admin@demo.com',
    expect: CRITICAL_TICKET.number,
    expectMissing: LOW_TICKET.number,
  },
  {
    path: '/admin/contracts?renewal=Expired',
    email: 'admin@demo.com',
    expect: EXPIRED_CONTRACT.contractNumber,
  },
]

let failures = 0

for (const testCase of CASES) {
  const label = `${(testCase.email ?? 'anonymous').padEnd(20)} ${testCase.path}`

  try {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={[testCase.path]}>
        <ToastProvider>
          <SettingsProvider>
            <SessionProvider initialEmail={testCase.email ?? undefined}>
              <DataProvider>
                <App />
              </DataProvider>
            </SessionProvider>
          </SettingsProvider>
        </ToastProvider>
      </MemoryRouter>,
    )

    if (testCase.expectBlockedByGuard) {
      if (html.trim() === '') {
        console.log(`ok    ${label}  (blocked by role guard)`)
      } else {
        failures++
        console.log(`FAIL  ${label}  (guard let ${html.length} chars through)`)
      }
    } else if (html.length < 200) {
      failures++
      console.log(`FAIL  ${label}  (rendered ${html.length} chars)`)
    } else if (testCase.expect && !html.includes(testCase.expect)) {
      failures++
      console.log(`FAIL  ${label}  (missing "${testCase.expect}")`)
    } else if (testCase.expectMissing && html.includes(testCase.expectMissing)) {
      failures++
      console.log(`FAIL  ${label}  (filter did not exclude "${testCase.expectMissing}")`)
    } else {
      console.log(`ok    ${label}`)
    }
  } catch (error) {
    failures++
    console.log(`THREW ${label}\n      ${(error as Error).message}`)
  }
}

/**
 * Tenant separation, checked against rendered output.
 *
 * The strongest evidence available headlessly: render the customer screens for
 * one tenant and assert that no other tenant's name, location or circuit ID
 * appears anywhere in the markup.
 */
const renderFor = (path: string, email: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <SettingsProvider>
          <SessionProvider initialEmail={email}>
            <DataProvider>
              <App />
            </DataProvider>
          </SessionProvider>
        </SettingsProvider>
      </ToastProvider>
    </MemoryRouter>,
  )

const SCREENS = [
  '/customer/dashboard',
  '/customer/locations',
  '/customer/services',
  '/customer/circuits',
  '/customer/contracts',
  '/customer/documents',
  '/customer/tickets',
  '/customer/profile',
]

/*
 * Chart edge cases.
 *
 * Every seeded tenant happens to have chartable data, so the empty and
 * all-zero states are exercised directly against the components. A chart that
 * only works with data is a chart that breaks on a new customer's first day.
 */
console.log('\nchart edge cases:')

const chartCases: Array<{ name: string; render: () => string; expect: string }> = [
  {
    name: 'runway with no contracts renders the empty state',
    expect: 'No contracts end in the next 12 months',
    render: () =>
      renderToStaticMarkup(
        <MemoryRouter>
          <ChartFrame
            title="Renewal runway"
            isEmpty
            emptyTitle="No contracts end in the next 12 months"
            emptyDescription="Months with contracts reaching their end date will be charted here."
          >
            <ColumnChart rows={[]} formatValue={String} ariaLabel="empty" />
          </ChartFrame>
        </MemoryRouter>,
      ),
  },
  {
    name: 'runway of all-zero months still draws 12 baseline stubs',
    expect: 'Jan',
    render: () =>
      renderToStaticMarkup(
        <MemoryRouter>
          <ChartFrame title="Renewal runway">
            <ColumnChart
              rows={renewalRunway(d).map((month) => ({ label: month.label, value: 0 }))}
              formatValue={String}
              ariaLabel="all zero"
            />
          </ChartFrame>
        </MemoryRouter>,
      ),
  },
  {
    name: 'bar chart reports categories it truncated',
    expect: 'not shown',
    render: () =>
      renderToStaticMarkup(
        <MemoryRouter>
          <ChartFrame title="Monthly cost by service type">
            <BarChart
              rows={mrcByServiceType(d)}
              formatValue={String}
              maxRows={2}
              ariaLabel="truncated"
            />
          </ChartFrame>
        </MemoryRouter>,
      ),
  },
]

for (const chartCase of chartCases) {
  try {
    const html = chartCase.render()
    if (html.includes(chartCase.expect)) {
      console.log(`ok    ${chartCase.name}`)
    } else {
      failures++
      console.log(`FAIL  ${chartCase.name}  (missing "${chartCase.expect}")`)
    }
  } catch (error) {
    failures++
    console.log(`THREW ${chartCase.name}\n      ${(error as Error).message}`)
  }
}

const OTHER_TENANTS = d.tenants.filter((t) => t.id !== 't-acme')

/**
 * Only tenant-unique values are used as leak markers.
 *
 * Location names deliberately repeat across customers (two companies can both
 * have a "Kansas City Regional Office"), so matching on those produces false
 * positives. Circuit IDs and service account numbers embed the customer code,
 * and tenant names are unique, so all three identify their owner unambiguously.
 */
const foreignMarkers: Array<{ kind: string; value: string }> = []

for (const tenant of OTHER_TENANTS) {
  foreignMarkers.push({ kind: 'tenant name', value: tenant.name })
}

for (const circuit of d.circuits) {
  const service = d.services.find((s) => s.id === circuit.serviceId)!
  if (service.tenantId !== 't-acme') {
    foreignMarkers.push({ kind: 'circuit ID', value: circuit.circuitId })
  }
}

for (const service of d.services.filter((s) => s.tenantId !== 't-acme')) {
  foreignMarkers.push({ kind: 'account number', value: service.accountNumber })
}

for (const contract of d.contracts.filter((c) => c.tenantId !== 't-acme')) {
  foreignMarkers.push({ kind: 'contract number', value: contract.contractNumber })
}

for (const ticket of d.tickets.filter((t) => t.tenantId !== 't-acme')) {
  foreignMarkers.push({ kind: 'ticket number', value: ticket.number })
}

console.log(`\ntenant separation in rendered output (${foreignMarkers.length} foreign markers per screen):`)

for (const screen of SCREENS) {
  const html = renderFor(screen, 'customer@demo.com')
  const leaks = foreignMarkers.filter((marker) => html.includes(marker.value))

  if (leaks.length) {
    failures++
    console.log(
      `FAIL  ${screen} leaked: ${leaks
        .slice(0, 3)
        .map((leak) => `${leak.kind} "${leak.value}"`)
        .join(', ')}`,
    )
  } else {
    console.log(`ok    ${screen} shows Acme Corporation records only`)
  }
}

console.log(
  failures === 0
    ? `\nALL ${CASES.length} ROUTES RENDERED, NO TENANT LEAKS\n`
    : `\n${failures} CHECK(S) FAILED\n`,
)
process.exit(failures === 0 ? 0 : 1)
