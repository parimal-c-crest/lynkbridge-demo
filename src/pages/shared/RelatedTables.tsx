import { FileText, LifeBuoy } from 'lucide-react'
import { DataTable } from '@/components/data/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate, formatFileSize } from '@/lib/format'
import { usePortal } from '@/lib/usePortal'
import {
  circuitForService,
  contractMrc,
  describeRelatedEntity,
  getCarrier,
  getContract,
  getLocation,
  getService,
} from '@/data/selectors'
import type { Circuit, Contract, DocumentRecord, Service, Ticket } from '@/data/types'

/**
 * Compact related-record tables reused by every detail page.
 *
 * Location, service, circuit, contract, customer and carrier detail screens all
 * need to list the same handful of entity types. Defining each table once keeps
 * the columns and links consistent everywhere they appear.
 */

export function RelatedServicesTable({ services }: { services: Service[] }) {
  const { data, path } = usePortal()

  return (
    <DataTable
      rows={services}
      rowKey={(row) => row.id}
      rowHref={(row) => path(`/services/${row.id}`)}
      empty={<EmptyState dense title="No services" description="No services are recorded against this record." />}
      columns={[
        {
          key: 'name',
          header: 'Service',
          render: (row) => <span className="font-medium text-ink-900">{row.name}</span>,
        },
        { key: 'type', header: 'Type', render: (row) => row.type },
        {
          key: 'carrier',
          header: 'Carrier',
          hideBelow: 'md',
          render: (row) => getCarrier(data, row.carrierId)?.name ?? '—',
        },
        { key: 'bandwidth', header: 'Bandwidth', hideBelow: 'lg', render: (row) => row.bandwidth },
        { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'mrc', header: 'MRC', align: 'right', render: (row) => formatCurrency(row.mrc) },
      ]}
    />
  )
}

export function RelatedCircuitsTable({ circuits }: { circuits: Circuit[] }) {
  const { data, path } = usePortal()

  return (
    <DataTable
      rows={circuits}
      rowKey={(row) => row.id}
      rowHref={(row) => path(`/circuits/${row.id}`)}
      empty={
        <EmptyState
          dense
          title="No circuits"
          description="No physical circuits are recorded against this record."
        />
      }
      columns={[
        {
          key: 'circuitId',
          header: 'Circuit ID',
          render: (row) => <span className="font-mono text-xs font-medium text-ink-900">{row.circuitId}</span>,
        },
        {
          key: 'service',
          header: 'Service',
          hideBelow: 'md',
          render: (row) => getService(data, row.serviceId)?.name ?? '—',
        },
        {
          key: 'carrier',
          header: 'Carrier',
          hideBelow: 'lg',
          render: (row) => {
            const service = getService(data, row.serviceId)
            return service ? (getCarrier(data, service.carrierId)?.name ?? '—') : '—'
          },
        },
        { key: 'bandwidth', header: 'Bandwidth', hideBelow: 'sm', render: (row) => row.bandwidth },
        { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
      ]}
    />
  )
}

export function RelatedContractsTable({ contracts }: { contracts: Contract[] }) {
  const { data, path, statusOf } = usePortal()

  return (
    <DataTable
      rows={contracts}
      rowKey={(row) => row.id}
      rowHref={(row) => path(`/contracts/${row.id}`)}
      empty={<EmptyState dense title="No contracts" description="No contracts are linked to this record." />}
      columns={[
        {
          key: 'number',
          header: 'Contract',
          render: (row) => <span className="font-medium text-ink-900">{row.contractNumber}</span>,
        },
        {
          key: 'provider',
          header: 'Provider',
          hideBelow: 'md',
          render: (row) => getCarrier(data, row.carrierId)?.name ?? '—',
        },
        { key: 'start', header: 'Start', hideBelow: 'lg', render: (row) => formatDate(row.startDate) },
        { key: 'end', header: 'End', render: (row) => formatDate(row.endDate) },
        {
          key: 'mrc',
          header: 'MRC',
          align: 'right',
          hideBelow: 'sm',
          render: (row) => formatCurrency(contractMrc(data, row.id)),
        },
        { key: 'renewal', header: 'Renewal', render: (row) => <StatusBadge status={statusOf(row)} /> },
      ]}
    />
  )
}

export function RelatedDocumentsTable({ documents }: { documents: DocumentRecord[] }) {
  const { data, path } = usePortal()

  return (
    <DataTable
      rows={documents}
      rowKey={(row) => row.id}
      rowHref={(row) => path(`/documents/${row.id}`)}
      empty={
        <EmptyState
          dense
          icon={<FileText className="size-5" />}
          title="No documents have been uploaded."
          description="Contracts, invoices and site documentation appear here."
        />
      }
      columns={[
        {
          key: 'name',
          header: 'Document',
          render: (row) => <span className="font-medium text-ink-900">{row.name}</span>,
        },
        { key: 'type', header: 'Type', render: (row) => row.type },
        {
          key: 'related',
          header: 'Related to',
          hideBelow: 'lg',
          render: (row) => describeRelatedEntity(data, row).label,
        },
        { key: 'uploaded', header: 'Uploaded', hideBelow: 'sm', render: (row) => formatDate(row.uploadedAt) },
        {
          key: 'size',
          header: 'Size',
          align: 'right',
          hideBelow: 'md',
          render: (row) => formatFileSize(row.sizeKb),
        },
      ]}
    />
  )
}

export function RelatedTicketsTable({ tickets }: { tickets: Ticket[] }) {
  const { data, path } = usePortal()

  return (
    <DataTable
      rows={tickets}
      rowKey={(row) => row.id}
      rowHref={(row) => path(`/tickets/${row.id}`)}
      empty={
        <EmptyState
          dense
          icon={<LifeBuoy className="size-5" />}
          title="No support tickets found."
          description="Tickets raised against this record appear here."
        />
      }
      columns={[
        {
          key: 'number',
          header: 'Ticket',
          render: (row) => <span className="font-mono text-xs font-medium text-ink-900">{row.number}</span>,
        },
        {
          key: 'subject',
          header: 'Subject',
          render: (row) => <span className="text-ink-800">{row.subject}</span>,
        },
        {
          key: 'location',
          header: 'Location',
          hideBelow: 'lg',
          render: (row) => getLocation(data, row.locationId)?.name ?? '—',
        },
        { key: 'priority', header: 'Priority', hideBelow: 'sm', render: (row) => <StatusBadge status={row.priority} /> },
        { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'updated', header: 'Updated', hideBelow: 'md', render: (row) => formatDate(row.updatedAt) },
      ]}
    />
  )
}

/** Service rows shown on a contract, where the contract column is redundant. */
export function ContractServicesTable({ services }: { services: Service[] }) {
  const { data, path } = usePortal()

  return (
    <DataTable
      rows={services}
      rowKey={(row) => row.id}
      rowHref={(row) => path(`/services/${row.id}`)}
      empty={<EmptyState dense title="No services on this contract" />}
      columns={[
        {
          key: 'name',
          header: 'Service',
          render: (row) => <span className="font-medium text-ink-900">{row.name}</span>,
        },
        {
          key: 'location',
          header: 'Location',
          render: (row) => getLocation(data, row.locationId)?.name ?? '—',
        },
        {
          key: 'circuit',
          header: 'Circuit',
          hideBelow: 'md',
          render: (row) => {
            const circuit = circuitForService(data, row.id)
            return circuit ? <span className="font-mono text-xs">{circuit.circuitId}</span> : '—'
          },
        },
        { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'mrc', header: 'MRC', align: 'right', render: (row) => formatCurrency(row.mrc) },
      ]}
    />
  )
}

/** Contract lookup used by service and circuit detail headers. */
export const contractLabel = (data: Parameters<typeof getContract>[0], contractId: string) =>
  getContract(data, contractId)?.contractNumber ?? '—'
