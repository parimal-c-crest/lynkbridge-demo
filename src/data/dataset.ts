/**
 * Deterministic mock dataset.
 *
 * Generated rather than hand-written so list pages carry enough rows for search,
 * filtering and pagination to be meaningfully demonstrated. The seed is fixed, so
 * every run of the prototype produces byte-identical data — screenshots, demos and
 * client walkthroughs stay reproducible.
 *
 * Replacing this file with real API calls is the intended migration path: nothing
 * outside `src/data/` knows how these records were produced.
 */
import {
  BANDWIDTH_BY_TYPE,
  CARRIER_SEED,
  CIRCUIT_BEARING_TYPES,
  CITIES,
  CUSTOMER_TITLES,
  DEMARCATIONS,
  DOCUMENT_TEMPLATES,
  FIRST_NAMES,
  LAST_NAMES,
  MRC_BAND_BY_TYPE,
  SERVICE_TYPE_WEIGHTS,
  SITE_TYPES,
  STREETS,
  TICKET_TEMPLATES,
} from './catalog'
import type {
  Carrier,
  Circuit,
  CircuitStatus,
  Contract,
  Dataset,
  DocumentRecord,
  ImportRun,
  Location,
  RecordStatus,
  Service,
  ServiceType,
  Tenant,
  Ticket,
  TicketStatus,
  User,
} from './types'

/**
 * Fixed "today" for the prototype. Renewal windows, ticket ages and dashboard
 * counts are all measured against this date so the demo never drifts — an
 * "Expiring Soon" contract stays expiring soon next month.
 */
export const PROTOTYPE_TODAY = new Date('2026-08-27T00:00:00Z')

/* ---------------------------------------------------------------- utilities */

/** mulberry32 — small, fast, fully deterministic PRNG. */
function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = makeRng(20260827)

const pick = <T>(items: readonly T[]): T => items[Math.floor(rng() * items.length)]
const intBetween = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min
const chance = (p: number) => rng() < p

const iso = (d: Date) => d.toISOString().slice(0, 10)

function shiftDays(base: Date, days: number) {
  const d = new Date(base)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function shiftMonths(base: Date, months: number) {
  const d = new Date(base)
  d.setUTCMonth(d.getUTCMonth() + months)
  return d
}

function personName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
}

function emailFor(name: string, domain: string) {
  const [first, last] = name.toLowerCase().split(' ')
  return `${first}.${last}@${domain}`
}

function pad(n: number, width: number) {
  return String(n).padStart(width, '0')
}

/* ------------------------------------------------------------------ tenants */

const TENANT_SEED: Array<Omit<Tenant, 'primaryContact' | 'primaryEmail' | 'phone'>> = [
  {
    id: 't-acme',
    name: 'Acme Corporation',
    code: 'ACME',
    industry: 'Manufacturing',
    status: 'Active',
    onboardedAt: '2024-03-11',
    hqCity: 'Columbus',
    hqState: 'OH',
  },
  {
    id: 't-global',
    name: 'Global Industries',
    code: 'GLBL',
    industry: 'Logistics & Distribution',
    status: 'Active',
    onboardedAt: '2024-09-02',
    hqCity: 'Charlotte',
    hqState: 'NC',
  },
  {
    id: 't-northwind',
    name: 'Northwind Retail Group',
    code: 'NWND',
    industry: 'Retail',
    status: 'Active',
    onboardedAt: '2025-01-20',
    hqCity: 'Austin',
    hqState: 'TX',
  },
  {
    id: 't-vertex',
    name: 'Vertex Health Partners',
    code: 'VRTX',
    industry: 'Healthcare',
    status: 'Onboarding',
    onboardedAt: '2026-06-15',
    hqCity: 'Denver',
    hqState: 'CO',
  },
]

const TENANT_DOMAINS: Record<string, string> = {
  't-acme': 'acmecorp.example',
  't-global': 'globalind.example',
  't-northwind': 'northwindretail.example',
  't-vertex': 'vertexhealth.example',
}

/** How many locations each tenant gets. Northwind is deliberately the largest
 *  so at least one list page needs pagination. */
const LOCATION_COUNT: Record<string, number> = {
  't-acme': 9,
  't-global': 7,
  't-northwind': 14,
  't-vertex': 5,
}

const tenants: Tenant[] = TENANT_SEED.map((t) => {
  const contact = personName()
  return {
    ...t,
    primaryContact: contact,
    primaryEmail: emailFor(contact, TENANT_DOMAINS[t.id]),
    phone: `(${intBetween(201, 989)}) 555-${pad(intBetween(0, 9999), 4)}`,
  }
})

/* ----------------------------------------------------------------- carriers */

const carriers: Carrier[] = CARRIER_SEED.map((c, i) => ({
  id: `car-${pad(i + 1, 2)}`,
  name: c.name,
  status: i === CARRIER_SEED.length - 1 ? 'Inactive' : 'Active',
  supportPhone: `(800) 555-${pad(1200 + i * 7, 4)}`,
  portalUrl: `https://portal.${c.name.toLowerCase().replace(/[^a-z]/g, '')}.example`,
  accountManager: c.accountManager,
}))

const activeCarriers = carriers.filter((c) => c.status === 'Active')

/* ---------------------------------------------------------------- locations */

const locations: Location[] = []
let locationCounter = 0

for (const tenant of tenants) {
  const count = LOCATION_COUNT[tenant.id]
  const usedCities = new Set<string>()

  for (let i = 0; i < count; i++) {
    let city = pick(CITIES)
    let guard = 0
    while (usedCities.has(city[0]) && guard++ < 12) city = pick(CITIES)
    usedCities.add(city[0])

    const isHq = i === 0
    const siteType = isHq ? 'Headquarters' : pick(SITE_TYPES.filter((s) => s !== 'Headquarters'))
    locationCounter += 1

    locations.push({
      id: `loc-${pad(locationCounter, 3)}`,
      tenantId: tenant.id,
      name: isHq ? `${tenant.name.split(' ')[0]} Headquarters` : `${city[0]} ${siteType}`,
      addressLine: `${intBetween(100, 9800)} ${pick(STREETS)}${chance(0.25) ? `, Suite ${intBetween(100, 780)}` : ''}`,
      city: isHq ? tenant.hqCity : city[0],
      state: isHq ? tenant.hqState : city[1],
      zip: pad(intBetween(10000, 99999), 5),
      status: chance(0.88) ? 'Active' : chance(0.5) ? 'Pending' : 'Inactive',
      siteType,
      openedAt: iso(shiftDays(PROTOTYPE_TODAY, -intBetween(200, 2400))),
    })
  }
}

/* ---------------------------------------------------------------- contracts */

const contracts: Contract[] = []
let contractCounter = 0

/** Carriers each tenant actually buys from — keeps the data believable. */
const tenantCarriers: Record<string, Carrier[]> = {}

for (const tenant of tenants) {
  const shuffled = [...activeCarriers].sort(() => rng() - 0.5)
  tenantCarriers[tenant.id] = shuffled.slice(0, intBetween(3, 4))

  for (const carrier of tenantCarriers[tenant.id]) {
    const contractsForCarrier = intBetween(1, 2)

    for (let i = 0; i < contractsForCarrier; i++) {
      contractCounter += 1
      const termMonths = pick([12, 24, 36, 36, 60])

      // Spread end dates across expired / expiring soon / comfortably active so
      // the renewal journey has something to show on every dashboard.
      const bucket = rng()
      const endOffsetDays = bucket < 0.15 ? -intBetween(20, 200) : bucket < 0.45 ? intBetween(5, 88) : intBetween(120, 900)

      const endDate = shiftDays(PROTOTYPE_TODAY, endOffsetDays)
      const startDate = shiftMonths(endDate, -termMonths)

      contracts.push({
        id: `con-${pad(contractCounter, 3)}`,
        tenantId: tenant.id,
        carrierId: carrier.id,
        contractNumber: `${tenant.code}-${carrier.name.slice(0, 3).toUpperCase()}-${pad(contractCounter, 4)}`,
        startDate: iso(startDate),
        endDate: iso(endDate),
        termMonths,
        autoRenew: chance(0.4),
        notes: chance(0.5)
          ? `${termMonths}-month term. ${intBetween(30, 90)}-day written notice required prior to the end date.`
          : 'Standard master service agreement terms apply.',
      })
    }
  }
}

/* ----------------------------------------------------------------- services */

const services: Service[] = []
const circuits: Circuit[] = []
let serviceCounter = 0
let circuitCounter = 0

for (const location of locations) {
  const tenant = tenants.find((t) => t.id === location.tenantId)!
  const serviceCount = location.siteType === 'Headquarters' ? intBetween(4, 5) : intBetween(2, 4)
  const usedTypes = new Set<ServiceType>()

  for (let i = 0; i < serviceCount; i++) {
    // First service at every site is always primary connectivity.
    let type: ServiceType = i === 0 ? pick(['Fiber', 'DIA', 'Internet']) : pick(SERVICE_TYPE_WEIGHTS)
    let guard = 0
    while (usedTypes.has(type) && guard++ < 10) type = pick(SERVICE_TYPE_WEIGHTS)
    usedTypes.add(type)

    const carrier = pick(tenantCarriers[tenant.id])
    const carrierContracts = contracts.filter((c) => c.tenantId === tenant.id && c.carrierId === carrier.id)
    const contract = pick(carrierContracts)
    const [minMrc, maxMrc] = MRC_BAND_BY_TYPE[type]

    serviceCounter += 1
    const serviceId = `svc-${pad(serviceCounter, 4)}`

    const status: RecordStatus =
      location.status === 'Inactive' ? 'Inactive' : chance(0.86) ? 'Active' : chance(0.6) ? 'Pending' : 'Inactive'

    services.push({
      id: serviceId,
      tenantId: tenant.id,
      locationId: location.id,
      carrierId: carrier.id,
      contractId: contract.id,
      name: `${type} — ${location.city}`,
      type,
      status,
      bandwidth: pick(BANDWIDTH_BY_TYPE[type]),
      accountNumber: `${tenant.code}-${pad(intBetween(100000, 999999), 6)}`,
      mrc: Math.round((intBetween(minMrc, maxMrc) / 5) * 5),
      installedAt: iso(shiftDays(PROTOTYPE_TODAY, -intBetween(60, 1800))),
    })

    // PROTOTYPE: 1:1 service-to-circuit, and only for physically delivered types.
    if (CIRCUIT_BEARING_TYPES.includes(type)) {
      circuitCounter += 1
      const circuitStatus: CircuitStatus =
        status === 'Inactive'
          ? 'Disconnected'
          : status === 'Pending'
            ? 'Provisioning'
            : chance(0.94)
              ? 'Active'
              : 'Degraded'

      circuits.push({
        id: `cir-${pad(circuitCounter, 4)}`,
        circuitId: `LB/${tenant.code}/${type.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase()}/${pad(circuitCounter, 4)}`,
        serviceId,
        accountNumber: `${carrier.name.slice(0, 2).toUpperCase()}${pad(intBetween(1000000, 9999999), 7)}`,
        bandwidth: BANDWIDTH_BY_TYPE[type][0],
        status: circuitStatus,
        demarcation: pick(DEMARCATIONS),
        activatedAt: iso(shiftDays(PROTOTYPE_TODAY, -intBetween(40, 1700))),
      })
    }
  }
}

/* -------------------------------------------------------------------- users */

const users: User[] = [
  {
    id: 'usr-admin-1',
    tenantId: null,
    name: 'Jordan Avery',
    email: 'admin@demo.com',
    role: 'LynkBridge Admin',
    title: 'Platform Administrator',
    status: 'Active',
    lastLoginAt: iso(shiftDays(PROTOTYPE_TODAY, 0)),
  },
  {
    id: 'usr-admin-2',
    tenantId: null,
    name: 'Renée Caldwell',
    email: 'renee.caldwell@lynkbridge.example',
    role: 'LynkBridge Admin',
    title: 'Customer Success Lead',
    status: 'Active',
    lastLoginAt: iso(shiftDays(PROTOTYPE_TODAY, -2)),
  },
  {
    id: 'usr-admin-3',
    tenantId: null,
    name: 'Idris Mahoney',
    email: 'idris.mahoney@lynkbridge.example',
    role: 'LynkBridge Admin',
    title: 'Provisioning Specialist',
    status: 'Invited',
    lastLoginAt: null,
  },
]

let userCounter = 0

for (const tenant of tenants) {
  const domain = TENANT_DOMAINS[tenant.id]
  const count = intBetween(3, 5)

  for (let i = 0; i < count; i++) {
    userCounter += 1
    const isDemoUser = i === 0 && (tenant.id === 't-acme' || tenant.id === 't-global')
    const name = i === 0 ? tenant.primaryContact : personName()

    users.push({
      id: `usr-${pad(userCounter, 3)}`,
      tenantId: tenant.id,
      name,
      // The two demo logins are pinned to fixed addresses so the login screen
      // can advertise them; everyone else gets a generated address.
      email: isDemoUser
        ? tenant.id === 't-acme'
          ? 'customer@demo.com'
          : 'customer2@demo.com'
        : emailFor(name, domain),
      role: 'Customer User',
      title: i === 0 ? 'IT Director' : pick(CUSTOMER_TITLES),
      status: chance(0.85) ? 'Active' : chance(0.6) ? 'Invited' : 'Disabled',
      lastLoginAt: chance(0.85) ? iso(shiftDays(PROTOTYPE_TODAY, -intBetween(0, 40))) : null,
    })
  }
}

/* ---------------------------------------------------------------- documents */

const documents: DocumentRecord[] = []
let documentCounter = 0

for (const tenant of tenants) {
  const tenantLocations = locations.filter((l) => l.tenantId === tenant.id)
  const tenantContracts = contracts.filter((c) => c.tenantId === tenant.id)
  const tenantServices = services.filter((s) => s.tenantId === tenant.id)
  const count = intBetween(10, 16)

  for (let i = 0; i < count; i++) {
    documentCounter += 1
    const template = pick(DOCUMENT_TEMPLATES)
    const uploader = pick(users.filter((u) => u.tenantId === tenant.id || u.role === 'LynkBridge Admin'))

    // Attach the document to whichever entity type suits its category.
    let relatedEntityType: DocumentRecord['relatedEntityType']
    let relatedEntityId: string
    let locationId: string | null

    if (template.type === 'Contract' || template.type === 'SLA' || template.type === 'Invoice') {
      const contract = pick(tenantContracts)
      relatedEntityType = 'Contract'
      relatedEntityId = contract.id
      locationId = null
    } else if (template.type === 'Network Diagram' || template.type === 'Service Order') {
      const service = pick(tenantServices)
      relatedEntityType = 'Service'
      relatedEntityId = service.id
      locationId = service.locationId
    } else if (chance(0.5)) {
      const location = pick(tenantLocations)
      relatedEntityType = 'Location'
      relatedEntityId = location.id
      locationId = location.id
    } else {
      relatedEntityType = 'Customer'
      relatedEntityId = tenant.id
      locationId = null
    }

    const uploadedAt = shiftDays(PROTOTYPE_TODAY, -intBetween(3, 700))

    documents.push({
      id: `doc-${pad(documentCounter, 3)}`,
      tenantId: tenant.id,
      name: `${tenant.code} ${template.label} ${uploadedAt.getUTCFullYear()}.${template.kind}`,
      type: template.type,
      relatedEntityType,
      relatedEntityId,
      locationId,
      uploadedAt: iso(uploadedAt),
      uploadedBy: uploader.name,
      sizeKb: intBetween(48, 8400),
      fileKind: template.kind,
    })
  }
}

/* ------------------------------------------------------------------ tickets */

const TICKET_STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed']

const tickets: Ticket[] = []
let ticketCounter = 0

for (const tenant of tenants) {
  const tenantLocations = locations.filter((l) => l.tenantId === tenant.id)
  const tenantUsers = users.filter((u) => u.tenantId === tenant.id)
  const count = intBetween(8, 12)

  for (let i = 0; i < count; i++) {
    ticketCounter += 1
    const template = pick(TICKET_TEMPLATES)
    const location = pick(tenantLocations)
    const locationServices = services.filter((s) => s.locationId === location.id)
    const service = locationServices.length && chance(0.85) ? pick(locationServices) : null
    const requester = pick(tenantUsers)
    const status = pick(TICKET_STATUSES)

    const createdAt = shiftDays(PROTOTYPE_TODAY, -intBetween(1, 180))
    const updatedAt = shiftDays(createdAt, intBetween(0, 12))

    const history = [
      {
        at: iso(createdAt),
        actor: requester.name,
        action: 'Ticket created',
        detail: template.subject,
      },
      {
        at: iso(shiftDays(createdAt, 1)),
        actor: 'LynkBridge Support',
        action: 'Acknowledged',
        detail: 'Ticket received and assigned for review.',
      },
    ]

    if (status !== 'Open') {
      history.push({
        at: iso(shiftDays(createdAt, 2)),
        actor: 'LynkBridge Support',
        action: 'Status changed to In Progress',
        detail: 'Investigation started with the carrier.',
      })
    }

    if (status === 'Waiting on Customer') {
      history.push({
        at: iso(updatedAt),
        actor: 'LynkBridge Support',
        action: 'Waiting on customer',
        detail: 'Additional site access details requested.',
      })
    }

    if (status === 'Resolved' || status === 'Closed') {
      history.push({
        at: iso(updatedAt),
        actor: 'LynkBridge Support',
        action: `Status changed to ${status}`,
        detail: 'Customer confirmed service is operating normally.',
      })
    }

    tickets.push({
      id: `tkt-${pad(ticketCounter, 3)}`,
      tenantId: tenant.id,
      number: `TKT-${pad(1000 + ticketCounter, 4)}`,
      subject: template.subject,
      description: template.description,
      locationId: location.id,
      serviceId: service?.id ?? null,
      priority: template.priority,
      status,
      createdAt: iso(createdAt),
      updatedAt: iso(updatedAt),
      requestedBy: requester.name,
      history,
    })
  }
}

/* ------------------------------------------------------------------ imports */

const imports: ImportRun[] = []
const IMPORT_ENTITIES: ImportRun['entity'][] = ['Customers', 'Locations', 'Services', 'Circuits', 'Contracts']

for (let i = 0; i < 9; i++) {
  const entity = pick(IMPORT_ENTITIES)
  const tenant = entity === 'Customers' ? null : pick(tenants)
  const rowsDetected = intBetween(12, 460)
  const errors = chance(0.2) ? intBetween(1, 9) : 0
  const warnings = chance(0.5) ? intBetween(1, 14) : 0

  imports.push({
    id: `imp-${pad(i + 1, 3)}`,
    entity,
    fileName: `${entity.toLowerCase()}-${tenant ? tenant.code.toLowerCase() : 'platform'}-${intBetween(1, 12)}.${chance(0.6) ? 'csv' : 'xlsx'}`,
    runAt: iso(shiftDays(PROTOTYPE_TODAY, -intBetween(1, 120))),
    runBy: pick(users.filter((u) => u.role === 'LynkBridge Admin')).name,
    tenantId: tenant?.id ?? null,
    rowsDetected,
    rowsValid: rowsDetected - errors,
    warnings,
    errors,
    status: errors > 0 ? 'Completed with warnings' : warnings > 0 ? 'Completed with warnings' : 'Completed',
  })
}

imports.sort((a, b) => b.runAt.localeCompare(a.runAt))

/* ------------------------------------------------------------------ exports */

export const seedDataset: Dataset = {
  tenants,
  users,
  locations,
  carriers,
  services,
  circuits,
  contracts,
  documents,
  tickets,
  imports,
}
