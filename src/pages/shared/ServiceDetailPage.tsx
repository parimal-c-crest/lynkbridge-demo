import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard, FieldGrid } from '@/components/ui/DetailCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { LinkButton } from '@/components/ui/Button'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { usePortal } from '@/lib/usePortal'
import { formatCurrency, formatDate } from '@/lib/format'
import {
  circuitForService,
  documentsFor,
  getCarrier,
  getContract,
  getLocation,
  getService,
  getTenant,
  ticketsForService,
} from '@/data/selectors'
import { RelatedCircuitsTable, RelatedDocumentsTable, RelatedTicketsTable } from './RelatedTables'
import { NotFoundRecord } from './NotFoundRecord'

export function ServiceDetailPage() {
  const { id } = useParams()
  const { data, isAdmin, path, statusOf } = usePortal()
  const [tab, setTab] = useState('overview')

  const service = getService(data, id)

  if (!service) {
    return (
      <NotFoundRecord
        title="Service not found"
        description="This service does not exist, or it belongs to another customer."
        backTo={path('/services')}
        backLabel="Back to services"
      />
    )
  }

  const location = getLocation(data, service.locationId)
  const carrier = getCarrier(data, service.carrierId)
  const contract = getContract(data, service.contractId)
  const circuit = circuitForService(data, service.id)
  const tenant = getTenant(data, service.tenantId)
  const documents = documentsFor(data, 'Service', service.id)
  const tickets = ticketsForService(data, service.id)

  return (
    <PageContainer
      title={service.name}
      description={`${service.type} service delivered at ${location?.name ?? 'an unknown location'}`}
      breadcrumbs={[
        { label: isAdmin ? 'Admin' : 'Portal', to: path('/dashboard') },
        { label: 'Services', to: path('/services') },
        { label: service.name },
      ]}
      meta={
        <>
          <StatusBadge status={service.status} />
          <span className="text-xs text-ink-500">{service.bandwidth}</span>
          <span className="text-xs text-ink-500">· {formatCurrency(service.mrc)} / month</span>
          {isAdmin && tenant ? <span className="text-xs text-ink-500">· {tenant.name}</span> : null}
        </>
      }
      actions={
        <LinkButton to={`${path('/tickets/new')}?service=${service.id}`} variant="secondary">
          Raise a ticket
        </LinkButton>
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
                <DetailCard title="Service details">
                  <FieldGrid
                    fields={[
                      { label: 'Service name', value: service.name },
                      { label: 'Service type', value: service.type },
                      { label: 'Status', value: <StatusBadge status={service.status} /> },
                      {
                        label: 'Location',
                        value: location?.name ?? '—',
                        to: location ? path(`/locations/${location.id}`) : undefined,
                      },
                      {
                        label: 'Carrier',
                        value: carrier?.name ?? '—',
                        to: isAdmin && carrier ? `/admin/carriers/${carrier.id}` : undefined,
                      },
                      {
                        label: 'Circuit ID',
                        value: circuit ? circuit.circuitId : 'No circuit — not physically delivered',
                        to: circuit ? path(`/circuits/${circuit.id}`) : undefined,
                      },
                      { label: 'Bandwidth', value: service.bandwidth },
                      { label: 'Account number', value: <span className="font-mono text-xs">{service.accountNumber}</span> },
                      { label: 'Monthly cost (MRC)', value: formatCurrency(service.mrc) },
                      { label: 'Installed', value: formatDate(service.installedAt) },
                      { label: 'Contract start', value: formatDate(contract?.startDate) },
                      { label: 'Contract end', value: formatDate(contract?.endDate) },
                      ...(isAdmin && tenant
                        ? [{ label: 'Customer', value: tenant.name, to: `/admin/customers/${tenant.id}` }]
                        : []),
                    ]}
                  />
                </DetailCard>

                {contract ? (
                  <DetailCard
                    title="Contract"
                    description="The commercial agreement this service is delivered under."
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
                        { label: 'Term', value: `${contract.termMonths} months` },
                        { label: 'Ends', value: formatDate(contract.endDate) },
                        { label: 'Renewal', value: <StatusBadge status={statusOf(contract)} /> },
                      ]}
                    />
                  </DetailCard>
                ) : null}

                <ProtoNote label="What is assumed on this screen">
                  Service-specific fields are not confirmed. Voice and SD-WAN in particular are likely to need
                  attributes this prototype does not model. The carrier is recorded on the service only — the circuit
                  inherits it — so the two can never disagree.
                </ProtoNote>
              </div>
            ),
          },
          {
            key: 'circuit',
            label: 'Circuit',
            count: circuit ? 1 : 0,
            content: (
              <DetailCard title="Circuit" flush>
                <RelatedCircuitsTable circuits={circuit ? [circuit] : []} />
              </DetailCard>
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
              <DetailCard title="Support tickets" flush>
                <RelatedTicketsTable tickets={tickets} />
              </DetailCard>
            ),
          },
        ]}
      />
    </PageContainer>
  )
}
