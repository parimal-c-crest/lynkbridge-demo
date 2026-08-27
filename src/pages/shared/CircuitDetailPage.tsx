import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard, FieldGrid } from '@/components/ui/DetailCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { LinkButton } from '@/components/ui/Button'
import { usePortal } from '@/lib/usePortal'
import { formatCurrency, formatDate } from '@/lib/format'
import {
  carrierForCircuit,
  documentsFor,
  getCircuit,
  getContract,
  getService,
  getTenant,
  locationForCircuit,
  ticketsForService,
} from '@/data/selectors'
import { RelatedDocumentsTable, RelatedTicketsTable } from './RelatedTables'
import { NotFoundRecord } from './NotFoundRecord'

export function CircuitDetailPage() {
  const { id } = useParams()
  const { data, isAdmin, path, statusOf } = usePortal()
  const [tab, setTab] = useState('overview')

  const circuit = getCircuit(data, id)

  if (!circuit) {
    return (
      <NotFoundRecord
        title="Circuit not found"
        description="This circuit does not exist, or it belongs to another customer."
        backTo={path('/circuits')}
        backLabel="Back to circuits"
      />
    )
  }

  const service = getService(data, circuit.serviceId)
  const location = locationForCircuit(data, circuit)
  const carrier = carrierForCircuit(data, circuit)
  const contract = service ? getContract(data, service.contractId) : undefined
  const tenant = service ? getTenant(data, service.tenantId) : undefined
  const documents = documentsFor(data, 'Circuit', circuit.id)
  const tickets = service ? ticketsForService(data, service.id) : []

  return (
    <PageContainer
      title={circuit.circuitId}
      description={`${carrier?.name ?? 'Carrier'} circuit delivering ${service?.name ?? 'a service'}`}
      breadcrumbs={[
        { label: isAdmin ? 'Admin' : 'Portal', to: path('/dashboard') },
        { label: 'Circuits', to: path('/circuits') },
        { label: circuit.circuitId },
      ]}
      meta={
        <>
          <StatusBadge status={circuit.status} />
          <span className="text-xs text-ink-500">{circuit.bandwidth}</span>
          {isAdmin && tenant ? <span className="text-xs text-ink-500">· {tenant.name}</span> : null}
        </>
      }
      actions={
        service ? (
          <LinkButton to={`${path('/tickets/new')}?service=${service.id}`} variant="secondary">
            Raise a ticket
          </LinkButton>
        ) : null
      }
    >
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          {
            key: 'overview',
            label: 'Overview',
            content: (
              <div className="space-y-4">
                <DetailCard title="Circuit details">
                  <FieldGrid
                    fields={[
                      { label: 'Circuit ID', value: <span className="font-mono text-xs">{circuit.circuitId}</span> },
                      {
                        label: 'Carrier',
                        value: carrier?.name ?? '—',
                        to: isAdmin && carrier ? `/admin/carriers/${carrier.id}` : undefined,
                      },
                      {
                        label: 'Carrier account',
                        value: <span className="font-mono text-xs">{circuit.accountNumber}</span>,
                      },
                      {
                        label: 'Service',
                        value: service?.name ?? '—',
                        to: service ? path(`/services/${service.id}`) : undefined,
                      },
                      {
                        label: 'Location',
                        value: location?.name ?? '—',
                        to: location ? path(`/locations/${location.id}`) : undefined,
                      },
                      { label: 'Bandwidth', value: circuit.bandwidth },
                      { label: 'Status', value: <StatusBadge status={circuit.status} /> },
                      { label: 'Activated', value: formatDate(circuit.activatedAt) },
                      { label: 'Monthly cost (MRC)', value: service ? formatCurrency(service.mrc) : '—' },
                      { label: 'Demarcation', value: circuit.demarcation, wide: true },
                    ]}
                  />
                </DetailCard>

                {contract ? (
                  <DetailCard
                    title="Contract"
                    actions={
                      <LinkButton to={path(`/contracts/${contract.id}`)} size="sm">
                        Open contract
                      </LinkButton>
                    }
                  >
                    <FieldGrid
                      columns={4}
                      fields={[
                        { label: 'Contract', value: contract.contractNumber },
                        { label: 'Starts', value: formatDate(contract.startDate) },
                        { label: 'Ends', value: formatDate(contract.endDate) },
                        { label: 'Renewal', value: <StatusBadge status={statusOf(contract)} /> },
                      ]}
                    />
                  </DetailCard>
                ) : null}
              </div>
            ),
          },
          {
            key: 'documents',
            label: 'Documents',
            count: documents.length,
            content: (
              <DetailCard title="Documents" flush>
                <RelatedDocumentsTable documents={documents} />
              </DetailCard>
            ),
          },
          {
            key: 'tickets',
            label: 'Tickets',
            count: tickets.length,
            content: (
              <DetailCard
                title="Support tickets"
                description="Tickets raised against the service this circuit delivers."
                flush
              >
                <RelatedTicketsTable tickets={tickets} />
              </DetailCard>
            ),
          },
        ]}
      />
    </PageContainer>
  )
}
