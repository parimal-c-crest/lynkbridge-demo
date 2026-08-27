/**
 * The prototype's honesty register.
 *
 * The build specification is explicit that undefined requirements must not be
 * silently promoted into confirmed ones. Everything the team had to decide in
 * order to make a screen work is recorded here and surfaced in the running app
 * at /roadmap, so the client can confirm or correct it during discovery.
 */

export interface RegisterItem {
  area: string
  detail: string
}

/** Confirmed by the client discussion. Safe to build against. */
export const CONFIRMED: RegisterItem[] = [
  { area: 'Platform', detail: 'B2B multi-tenant SaaS portal for enterprise and multi-location businesses.' },
  { area: 'Roles', detail: 'Two sides: customer users and LynkBridge administrators.' },
  { area: 'Tenancy', detail: 'Each company sees only its own information.' },
  { area: 'Inventory', detail: 'Locations, services, circuits, accounts, bandwidth and carrier/provider records.' },
  { area: 'Service types', detail: 'Internet, Fiber, DIA, Voice, SD-WAN, Wireless Backup, Security and other types.' },
  { area: 'Contracts', detail: 'Contract start and end dates, renewal tracking, and monthly recurring cost.' },
  { area: 'Documents', detail: 'Document storage for customer-related documents.' },
  { area: 'Support', detail: 'Ticket creation, status and history in Phase 1.' },
  { area: 'Data entry', detail: 'CSV and Excel import instead of carrier API integrations for the MVP.' },
  { area: 'Dashboards', detail: 'A customer dashboard and a LynkBridge administrative dashboard.' },
  { area: 'Search', detail: 'Search and filtering across platform information.' },
  { area: 'Design', detail: 'UI/UX is in scope; the product is a data-dense operational tool, not a marketing site.' },
]

/** Decided by the build team purely to make the prototype work. Not requirements. */
export const ASSUMPTIONS: RegisterItem[] = [
  {
    area: 'Cost model',
    detail:
      'Monthly cost is stored on the service. Contract MRC and every dashboard cost figure is rolled up from those service values, so no two screens can disagree. The specification put a cost field on both the service and the contract, which allowed them to diverge.',
  },
  {
    area: 'Service ↔ circuit',
    detail:
      'A service has at most one circuit, and only service types with physical delivery get one. Security and Other services have no circuit. The specification implied one-to-one but never stated it.',
  },
  {
    area: 'Carrier reference',
    detail:
      'The carrier is recorded on the service only; a circuit resolves its carrier through its service. The specification recorded it on both, which allowed the two to contradict each other.',
  },
  {
    area: 'Carrier scope',
    detail:
      'Carriers are platform-level records shared across all tenants, because the admin carrier list aggregates customer counts. Customers can view the carriers on their own services but never manage them.',
  },
  {
    area: 'Circuit tenancy',
    detail: 'Circuits carry no tenant of their own — they are scoped through their parent service.',
  },
  {
    area: 'Customer creation',
    detail:
      'Adding a customer records the company and its primary contact, and nothing else. The short code that appears in circuit IDs is derived from the name as a convenience and stays editable — whether codes are assigned by LynkBridge or agreed with the customer is unconfirmed, as is everything else onboarding involves.',
  },
  {
    area: 'User creation',
    detail:
      'Adding a user records who someone is, which company they belong to and which of the two roles they hold. A new user defaults to Invited and has never signed in. No invitation is sent, no credential is set, and no permission beyond the role is offered.',
  },
  {
    area: 'Document links',
    detail:
      'A document points at one typed record (customer, location, service, circuit or contract) rather than a single free-text field, so both the Location and Related Entity columns can resolve.',
  },
  {
    area: 'Document categories',
    detail:
      'Contract, Invoice, Service Order, Letter of Agency, Network Diagram, SLA and Other are placeholders. No taxonomy has been confirmed.',
  },
  {
    area: 'Ticket vocabulary',
    detail:
      'Statuses (Open, In Progress, Waiting on Customer, Resolved, Closed) and priorities (Low to Critical) are placeholders. No workflow, assignment model or SLA rule is implied.',
  },
  {
    area: 'Renewal window',
    detail: 'Contracts within 90 days of their end date read as "Expiring Soon". The real notice period is unconfirmed.',
  },
  {
    area: 'Roles',
    detail:
      'Exactly two roles exist, matching the discussion. No permission matrix has been invented, because none was defined.',
  },
  {
    area: 'Demo accounts',
    detail:
      'A second customer login (customer2@demo.com, Global Industries) was added beyond the two accounts in the specification, so tenant separation can be demonstrated by comparison rather than asserted.',
  },
  {
    area: 'Import validation',
    detail:
      'The import screen reports rows detected, valid rows, warnings and errors against a simulated parse. The real validation rules, required columns and update-versus-insert behaviour are undefined.',
  },
  {
    area: 'Dashboard KPIs',
    detail: 'The KPI selection on both dashboards is a prototype proposal, not a confirmed reporting requirement.',
  },
  {
    area: 'Dashboard charts',
    detail:
      'Which charts appear, and on which screen, is a prototype proposal. The renewal runway, cost breakdowns, circuit health, ticket load and spend-under-management views were chosen because the confirmed requirements name renewal tracking and monthly cost — not because any reporting requirement was specified.',
  },
  {
    area: 'Renewal exposure bands',
    detail:
      'Contracts are bucketed into expired, 30, 60 and 90-day bands. Real notice periods vary per contract and have not been supplied.',
  },
  {
    area: 'Spend under management',
    detail:
      'Cumulative monthly cost is accumulated by service install date, with everything installed before the window forming an opening balance. There is no historical price record in the prototype, so this reconstructs a trend rather than reporting one.',
  },
  {
    area: 'Reports module',
    detail:
      'Reporting was not in the build specification — it was added on request. The catalogue, the categories, the columns in each report and the CSV export format are all proposals built from data the prototype already holds. Scheduled delivery, saved report definitions and date-range filtering are not implemented.',
  },
  {
    area: 'Settings module',
    detail:
      'Settings was not in the build specification — it was added on request. The split between platform settings, portal preferences and account details is a proposal. Who may change each setting, and whether preferences belong to a user or an organisation, is undefined. Notification switches record a preference and do nothing, because notifications are a roadmap item.',
  },
  {
    area: 'Configurable renewal window',
    detail:
      'The renewal notice window and rows-per-page are adjustable in Settings and genuinely drive every screen. That is a demonstration that these are configuration rather than hardcoded assumptions — not a claim that either value has been agreed.',
  },
  {
    area: 'Record creation',
    detail:
      'Locations, services, circuits and contracts can be created from their list screens, by either role. The specification described import as the way records arrive and never said who may add one by hand, so this is a proposal: it exists to show the shape of each record and the relationships it has to satisfy, not to assert that customers may create their own inventory. Which fields are mandatory, whether an approval step applies, and whether editing and deletion belong in Phase 1 all remain undefined.',
  },
  {
    area: 'Service and circuit together',
    detail:
      'A circuit-bearing service can be recorded with its circuit in one action, because a service has at most one circuit and every screen assumes a physically delivered service has one. The circuit form therefore only offers services that do not already have a circuit.',
  },
  {
    area: 'Derived contract end date',
    detail:
      'On the contract form the end date is derived from the start date and term rather than typed, so the two cannot contradict each other. Real agreements may have end dates that do not fall on a clean term boundary.',
  },
  {
    area: 'Fixed clock',
    detail:
      'All dates are measured against a fixed prototype date so renewal windows and ticket ages stay stable between demos.',
  },
]

/** Must be answered by the client before Phase 1 can be estimated or built. */
export const OPEN_QUESTIONS: RegisterItem[] = [
  { area: 'Roles & permissions', detail: 'What can each role actually do? Are there more than two roles? Who may create, edit and delete each record type?' },
  { area: 'Ticket workflow', detail: 'What are the real statuses, priorities, assignment rules and response expectations? Are SLAs in Phase 1?' },
  { area: 'Documents', detail: 'What document types exist, who may see each one, is versioning required, and what are the retention rules?' },
  { area: 'Import behaviour', detail: 'What are the required columns per entity, does an import update existing records or only insert, and what happens to a partially valid file?' },
  { area: 'Data relationships', detail: 'Can a service have multiple circuits? Can a circuit be shared? Does a contract cover multiple carriers or customers?' },
  { area: 'Service fields', detail: 'What fields are needed per service type? Voice and SD-WAN in particular likely need type-specific attributes.' },
  { area: 'Dashboard requirements', detail: 'Which numbers do customers and LynkBridge staff actually need to see daily?' },
  { area: 'Search scope', detail: 'Which fields must be searchable, and is cross-entity search expected?' },
  { area: 'Scale', detail: 'Year-one tenant count, locations and circuits per tenant, user count and document volume — these drive the architecture.' },
  { area: 'Contract workflow', detail: 'Who is notified of a renewal, when, and what action does the portal need to support?' },
  { area: 'Security & compliance', detail: 'Any regulatory obligations, data residency needs, SSO requirements or audit expectations?' },
  { area: 'Phase 1 acceptance', detail: 'What specifically must be true for Phase 1 to be signed off?' },
]

/** Explicitly deferred. Represented in the UI only as non-functional roadmap items. */
export const ROADMAP: RegisterItem[] = [
  { area: 'Carrier APIs', detail: 'Direct integration with carriers to sync inventory and account data automatically.' },
  { area: 'Network monitoring', detail: 'Live circuit health and performance telemetry.' },
  { area: 'Automated outage detection', detail: 'Detecting and raising outages without a customer reporting them.' },
  { area: 'Billing & invoice management', detail: 'Invoice ingestion, cost validation and dispute handling.' },
  { area: 'Ticket automation', detail: 'Automatic routing, escalation and carrier ticket creation.' },
  { area: 'SLA management', detail: 'SLA tracking, breach detection and credit calculation.' },
  { area: 'CRM integrations', detail: 'Two-way sync with the customer relationship platform.' },
  { area: 'Notifications', detail: 'Email and in-app alerting for renewals, tickets and incidents.' },
  { area: 'AI support automation', detail: 'Assisted triage and resolution suggestions.' },
]
