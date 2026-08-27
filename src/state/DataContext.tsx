import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { PROTOTYPE_TODAY, seedDataset } from '@/data/dataset'
import { scopeToTenant } from '@/data/selectors'
import type {
  Circuit,
  CircuitStatus,
  Contract,
  Dataset,
  DocumentRecord,
  DocumentType,
  Id,
  ImportEntity,
  ImportRun,
  Location,
  RecordStatus,
  RelatedEntityType,
  Service,
  ServiceType,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '@/data/types'
import { useSession } from './SessionContext'

/**
 * In-memory store for the prototype.
 *
 * Every "write" below mutates React state and nothing else. There is no
 * persistence: a page refresh restores the seed dataset. That is deliberate —
 * the prototype demonstrates workflows, it does not store business records.
 */

const today = PROTOTYPE_TODAY.toISOString().slice(0, 10)

interface CreateTicketInput {
  subject: string
  description: string
  locationId: Id | null
  serviceId: Id | null
  priority: TicketPriority
  attachmentName?: string | null
  tenantId: Id
  requestedBy: string
}

interface UploadDocumentInput {
  tenantId: Id
  name: string
  type: DocumentType
  relatedEntityType: RelatedEntityType
  relatedEntityId: Id
  locationId: Id | null
  uploadedBy: string
  sizeKb: number
}

interface RecordImportInput {
  entity: ImportEntity
  fileName: string
  tenantId: Id | null
  rowsDetected: number
  rowsValid: number
  warnings: number
  errors: number
  runBy: string
}

interface CreateLocationInput {
  tenantId: Id
  name: string
  siteType: string
  addressLine: string
  city: string
  state: string
  zip: string
  status: RecordStatus
  openedAt: string
}

interface CreateContractInput {
  tenantId: Id
  carrierId: Id
  contractNumber: string
  startDate: string
  endDate: string
  termMonths: number
  autoRenew: boolean
  notes: string
}

/** A circuit without its service — the service supplies the missing half. */
interface CircuitDetailsInput {
  circuitId: string
  accountNumber: string
  bandwidth: string
  status: CircuitStatus
  demarcation: string
  activatedAt: string
}

interface CreateServiceInput {
  tenantId: Id
  locationId: Id
  carrierId: Id
  contractId: Id
  name: string
  type: ServiceType
  status: RecordStatus
  bandwidth: string
  accountNumber: string
  mrc: number
  installedAt: string
  /**
   * Circuit-bearing services can be created with their circuit in one action,
   * so a physically delivered service is never left without the delivery every
   * other screen expects it to have.
   */
  circuit?: CircuitDetailsInput
}

interface CreateCircuitInput extends CircuitDetailsInput {
  serviceId: Id
}

interface DataContextValue {
  data: Dataset
  createLocation: (input: CreateLocationInput) => Location
  createContract: (input: CreateContractInput) => Contract
  createService: (input: CreateServiceInput) => Service
  createCircuit: (input: CreateCircuitInput) => Circuit
  createTicket: (input: CreateTicketInput) => Ticket
  addTicketNote: (ticketId: Id, actor: string, note: string) => void
  setTicketStatus: (ticketId: Id, status: TicketStatus, actor: string) => void
  uploadDocument: (input: UploadDocumentInput) => DocumentRecord
  recordImport: (input: RecordImportInput) => ImportRun
  resetPrototypeData: () => void
  /** True once anything in this session has been changed locally. */
  hasLocalChanges: boolean
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Dataset>(seedDataset)
  const [hasLocalChanges, setHasLocalChanges] = useState(false)

  const createLocation = useCallback((input: CreateLocationInput): Location => {
    let created!: Location

    setData((current) => {
      created = { id: `loc-local-${current.locations.length + 1}`, ...input }
      return { ...current, locations: [created, ...current.locations] }
    })

    setHasLocalChanges(true)
    return created
  }, [])

  const createContract = useCallback((input: CreateContractInput): Contract => {
    let created!: Contract

    setData((current) => {
      created = { id: `con-local-${current.contracts.length + 1}`, ...input }
      return { ...current, contracts: [created, ...current.contracts] }
    })

    setHasLocalChanges(true)
    return created
  }, [])

  const createService = useCallback((input: CreateServiceInput): Service => {
    let created!: Service

    setData((current) => {
      const { circuit, ...service } = input
      created = { id: `svc-local-${current.services.length + 1}`, ...service }

      // The service and its circuit land together, so the 1:1 rule holds at
      // every point rather than only after a second form is submitted.
      const circuits = circuit
        ? [{ id: `cir-local-${current.circuits.length + 1}`, serviceId: created.id, ...circuit }, ...current.circuits]
        : current.circuits

      return { ...current, services: [created, ...current.services], circuits }
    })

    setHasLocalChanges(true)
    return created
  }, [])

  const createCircuit = useCallback((input: CreateCircuitInput): Circuit => {
    let created!: Circuit

    setData((current) => {
      created = { id: `cir-local-${current.circuits.length + 1}`, ...input }
      return { ...current, circuits: [created, ...current.circuits] }
    })

    setHasLocalChanges(true)
    return created
  }, [])

  const createTicket = useCallback((input: CreateTicketInput): Ticket => {
    let created!: Ticket

    setData((current) => {
      const nextNumber = 1000 + current.tickets.length + 1

      created = {
        id: `tkt-local-${nextNumber}`,
        tenantId: input.tenantId,
        number: `TKT-${nextNumber}`,
        subject: input.subject,
        description: input.description,
        locationId: input.locationId,
        serviceId: input.serviceId,
        priority: input.priority,
        status: 'Open',
        createdAt: today,
        updatedAt: today,
        requestedBy: input.requestedBy,
        history: [
          {
            at: today,
            actor: input.requestedBy,
            action: 'Ticket created',
            detail: input.attachmentName
              ? `Submitted through the customer portal with attachment "${input.attachmentName}".`
              : 'Submitted through the customer portal.',
          },
        ],
      }

      return { ...current, tickets: [created, ...current.tickets] }
    })

    setHasLocalChanges(true)
    return created
  }, [])

  const addTicketNote = useCallback((ticketId: Id, actor: string, note: string) => {
    setData((current) => ({
      ...current,
      tickets: current.tickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              updatedAt: today,
              history: [...ticket.history, { at: today, actor, action: 'Note added', detail: note }],
            }
          : ticket,
      ),
    }))
    setHasLocalChanges(true)
  }, [])

  const setTicketStatus = useCallback((ticketId: Id, status: TicketStatus, actor: string) => {
    setData((current) => ({
      ...current,
      tickets: current.tickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status,
              updatedAt: today,
              history: [...ticket.history, { at: today, actor, action: `Status changed to ${status}` }],
            }
          : ticket,
      ),
    }))
    setHasLocalChanges(true)
  }, [])

  const uploadDocument = useCallback((input: UploadDocumentInput): DocumentRecord => {
    let created!: DocumentRecord

    setData((current) => {
      created = {
        id: `doc-local-${current.documents.length + 1}`,
        tenantId: input.tenantId,
        name: input.name,
        type: input.type,
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
        locationId: input.locationId,
        uploadedAt: today,
        uploadedBy: input.uploadedBy,
        sizeKb: input.sizeKb,
        fileKind: input.name.toLowerCase().endsWith('.xlsx')
          ? 'xlsx'
          : input.name.toLowerCase().endsWith('.docx')
            ? 'docx'
            : input.name.toLowerCase().endsWith('.png')
              ? 'png'
              : 'pdf',
      }

      return { ...current, documents: [created, ...current.documents] }
    })

    setHasLocalChanges(true)
    return created
  }, [])

  const recordImport = useCallback((input: RecordImportInput): ImportRun => {
    let created!: ImportRun

    setData((current) => {
      created = {
        id: `imp-local-${current.imports.length + 1}`,
        entity: input.entity,
        fileName: input.fileName,
        runAt: today,
        runBy: input.runBy,
        tenantId: input.tenantId,
        rowsDetected: input.rowsDetected,
        rowsValid: input.rowsValid,
        warnings: input.warnings,
        errors: input.errors,
        status: input.errors > 0 || input.warnings > 0 ? 'Completed with warnings' : 'Completed',
      }

      return { ...current, imports: [created, ...current.imports] }
    })

    setHasLocalChanges(true)
    return created
  }, [])

  const resetPrototypeData = useCallback(() => {
    setData(seedDataset)
    setHasLocalChanges(false)
  }, [])

  const value = useMemo(
    () => ({
      data,
      createLocation,
      createContract,
      createService,
      createCircuit,
      createTicket,
      addTicketNote,
      setTicketStatus,
      uploadDocument,
      recordImport,
      resetPrototypeData,
      hasLocalChanges,
    }),
    [
      data,
      createLocation,
      createContract,
      createService,
      createCircuit,
      createTicket,
      addTicketNote,
      setTicketStatus,
      uploadDocument,
      recordImport,
      resetPrototypeData,
      hasLocalChanges,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used inside DataProvider')
  return context
}

/**
 * The dataset as the signed-in user is allowed to see it.
 *
 * Customers get their own tenant's records; LynkBridge admins get everything.
 * PROTOTYPE ONLY — this is a client-side filter for demonstration, not a
 * security boundary.
 */
export function useScopedData(): Dataset {
  const { data } = useData()
  const { session } = useSession()

  return useMemo(
    () => scopeToTenant(data, session?.role === 'Customer User' ? session.tenantId : null),
    [data, session],
  )
}
