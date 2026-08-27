/**
 * Prototype data model.
 *
 * Derived from the build specification's mock data model, with the gaps the
 * specification left open resolved to the smallest reasonable shape. Every
 * decision marked PROTOTYPE is an assumption, not a confirmed requirement, and
 * is listed in `src/prototype/assumptions.ts` for client review.
 *
 * This is NOT a production ERD.
 */

export type Id = string

export type TenantStatus = 'Active' | 'Onboarding' | 'Suspended'
export type RecordStatus = 'Active' | 'Pending' | 'Inactive'
export type CircuitStatus = 'Active' | 'Provisioning' | 'Degraded' | 'Disconnected'
export type RenewalStatus = 'Active' | 'Expiring Soon' | 'Expired'
export type TicketStatus = 'Open' | 'In Progress' | 'Waiting on Customer' | 'Resolved' | 'Closed'
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical'
export type UserRole = 'LynkBridge Admin' | 'Customer User'
export type UserStatus = 'Active' | 'Invited' | 'Disabled'

/** Service types named in the client discussion. Not an exhaustive taxonomy. */
export const SERVICE_TYPES = [
  'Internet',
  'Fiber',
  'DIA',
  'Voice',
  'SD-WAN',
  'Wireless Backup',
  'Security',
  'Other',
] as const
export type ServiceType = (typeof SERVICE_TYPES)[number]

/** PROTOTYPE: document taxonomy is unconfirmed — these are placeholder categories. */
export const DOCUMENT_TYPES = [
  'Contract',
  'Invoice',
  'Service Order',
  'Letter of Agency',
  'Network Diagram',
  'SLA',
  'Other',
] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

/** What a document can hang off. PROTOTYPE: the spec listed one free-text
 *  "related entity" field; a typed pair is the smallest change that makes the
 *  document list's Location and Related Entity columns both resolvable. */
export type RelatedEntityType = 'Customer' | 'Location' | 'Service' | 'Circuit' | 'Contract'

export interface Tenant {
  id: Id
  name: string
  /** Short code used in circuit IDs and account numbers. */
  code: string
  industry: string
  status: TenantStatus
  onboardedAt: string
  primaryContact: string
  primaryEmail: string
  phone: string
  hqCity: string
  hqState: string
}

export interface User {
  id: Id
  /** null for LynkBridge staff — they are not scoped to a tenant. */
  tenantId: Id | null
  name: string
  email: string
  role: UserRole
  title: string
  status: UserStatus
  lastLoginAt: string | null
}

export interface Location {
  id: Id
  tenantId: Id
  name: string
  addressLine: string
  city: string
  state: string
  zip: string
  status: RecordStatus
  siteType: string
  openedAt: string
}

/**
 * Carriers are platform-level records shared across every tenant — the admin
 * carrier list aggregates across customers, so a carrier cannot carry a
 * tenantId. Customers never manage carriers, only view the ones on their
 * own services.
 */
export interface Carrier {
  id: Id
  name: string
  status: RecordStatus
  supportPhone: string
  portalUrl: string
  accountManager: string
}

export interface Service {
  id: Id
  tenantId: Id
  locationId: Id
  /**
   * PROTOTYPE: the carrier reference is held on the Service and nowhere else.
   * The spec put carrierId on both Service and Circuit, which allows the two to
   * disagree. Circuits resolve their carrier through their service.
   */
  carrierId: Id
  contractId: Id
  name: string
  type: ServiceType
  status: RecordStatus
  bandwidth: string
  accountNumber: string
  /**
   * PROTOTYPE: Service.mrc is the single source of truth for cost. Contract MRC
   * and every "monthly service cost" KPI are rolled up from these values, so no
   * two screens can show different totals.
   */
  mrc: number
  installedAt: string
}

/**
 * PROTOTYPE: a service has at most one circuit, and a circuit belongs to exactly
 * one service. The spec implied 1:1 (single Circuit column, single serviceId)
 * but never stated it. Services without physical delivery (e.g. Security) simply
 * have no circuit.
 *
 * Circuits carry no tenantId — they are tenant-scoped through their service.
 */
export interface Circuit {
  id: Id
  /** Human-facing circuit identifier shown in lists, e.g. "LB/ACME/DIA/0142". */
  circuitId: string
  serviceId: Id
  accountNumber: string
  bandwidth: string
  status: CircuitStatus
  demarcation: string
  activatedAt: string
}

export interface Contract {
  id: Id
  tenantId: Id
  carrierId: Id
  contractNumber: string
  startDate: string
  endDate: string
  termMonths: number
  autoRenew: boolean
  notes: string
  /**
   * Note: a contract has NO stored mrc. Contract MRC is rolled up from the
   * services attached to it (see `contractMrc` in selectors.ts) so the contract
   * screen and the service screens can never disagree.
   */
}

export interface DocumentRecord {
  id: Id
  tenantId: Id
  name: string
  type: DocumentType
  relatedEntityType: RelatedEntityType
  relatedEntityId: Id
  /** Denormalised for the list's Location column; null for customer-wide docs. */
  locationId: Id | null
  uploadedAt: string
  uploadedBy: string
  sizeKb: number
  fileKind: 'pdf' | 'xlsx' | 'docx' | 'png'
}

export interface TicketEvent {
  at: string
  actor: string
  action: string
  detail?: string
}

export interface Ticket {
  id: Id
  tenantId: Id
  number: string
  subject: string
  description: string
  locationId: Id | null
  serviceId: Id | null
  /** PROTOTYPE: priorities and statuses are placeholders — no SLA rules implied. */
  priority: TicketPriority
  status: TicketStatus
  createdAt: string
  updatedAt: string
  requestedBy: string
  history: TicketEvent[]
}

export type ImportEntity = 'Customers' | 'Locations' | 'Services' | 'Circuits' | 'Contracts'

export interface ImportRun {
  id: Id
  entity: ImportEntity
  fileName: string
  runAt: string
  runBy: string
  tenantId: Id | null
  rowsDetected: number
  rowsValid: number
  warnings: number
  errors: number
  status: 'Completed' | 'Completed with warnings' | 'Failed'
}

export interface Dataset {
  tenants: Tenant[]
  users: User[]
  locations: Location[]
  carriers: Carrier[]
  services: Service[]
  circuits: Circuit[]
  contracts: Contract[]
  documents: DocumentRecord[]
  tickets: Ticket[]
  imports: ImportRun[]
}
