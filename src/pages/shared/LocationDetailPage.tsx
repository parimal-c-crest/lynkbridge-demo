import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard, FieldGrid } from '@/components/ui/DetailCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { LinkButton } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { usePortal } from '@/lib/usePortal'
import { formatCurrency, formatDate } from '@/lib/format'
import {
  circuitsAtLocation,
  contractsAtLocation,
  documentsAtLocation,
  getLocation,
  getTenant,
  servicesAtLocation,
  ticketsAtLocation,
  totalMrc,
} from '@/data/selectors'
import {
  RelatedCircuitsTable,
  RelatedContractsTable,
  RelatedDocumentsTable,
  RelatedServicesTable,
  RelatedTicketsTable,
} from './RelatedTables'
import { NotFoundRecord } from './NotFoundRecord'

export function LocationDetailPage() {
  const { id } = useParams()
  const { data, isAdmin, path } = usePortal()
  const [tab, setTab] = useState('overview')

  const location = getLocation(data, id)

  if (!location) {
    return (
      <NotFoundRecord
        title="Location not found"
        description="This location does not exist, or it belongs to another customer."
        backTo={path('/locations')}
        backLabel="Back to locations"
      />
    )
  }

  const tenant = getTenant(data, location.tenantId)
  const services = servicesAtLocation(data, location.id)
  const circuits = circuitsAtLocation(data, location.id)
  const contracts = contractsAtLocation(data, location.id)
  const documents = documentsAtLocation(data, location.id)
  const tickets = ticketsAtLocation(data, location.id)
  const openCount = tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length

  return (
    <PageContainer
      title={location.name}
      description={`${location.addressLine}, ${location.city}, ${location.state} ${location.zip}`}
      breadcrumbs={[
        { label: isAdmin ? 'Admin' : 'Portal', to: path('/dashboard') },
        { label: 'Locations', to: path('/locations') },
        { label: location.name },
      ]}
      meta={
        <>
          <StatusBadge status={location.status} />
          <span className="text-xs text-ink-500">{location.siteType}</span>
          {isAdmin && tenant ? (
            <span className="text-xs text-ink-500">
              ·{' '}
              <a href={`/admin/customers/${tenant.id}`} className="text-brand-600 hover:underline">
                {tenant.name}
              </a>
            </span>
          ) : null}
        </>
      }
      actions={
        <LinkButton to={`${path('/tickets/new')}?location=${location.id}`} variant="secondary">
          Raise a ticket
        </LinkButton>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Services" value={services.length} />
        <StatCard label="Circuits" value={circuits.length} />
        <StatCard
          label="Monthly cost"
          value={formatCurrency(totalMrc(services))}
          hint="Active services only"
        />
        <StatCard
          label="Open tickets"
          value={openCount}
          tone={openCount > 0 ? 'warn' : 'default'}
        />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          {
            key: 'overview',
            label: 'Overview',
            content: (
              <DetailCard title="Location details">
                <FieldGrid
                  fields={[
                    { label: 'Location name', value: location.name },
                    { label: 'Site type', value: location.siteType },
                    { label: 'Status', value: <StatusBadge status={location.status} /> },
                    { label: 'Street address', value: location.addressLine },
                    { label: 'City', value: `${location.city}, ${location.state}` },
                    { label: 'ZIP', value: location.zip },
                    ...(isAdmin && tenant
                      ? [{ label: 'Customer', value: tenant.name, to: `/admin/customers/${tenant.id}` }]
                      : []),
                    { label: 'Site opened', value: formatDate(location.openedAt) },
                    { label: 'Monthly cost', value: formatCurrency(totalMrc(services)) },
                  ]}
                />
              </DetailCard>
            ),
          },
          {
            key: 'services',
            label: 'Services',
            count: services.length,
            content: (
              <DetailCard title="Services at this location" flush>
                <RelatedServicesTable services={services} />
              </DetailCard>
            ),
          },
          {
            key: 'circuits',
            label: 'Circuits',
            count: circuits.length,
            content: (
              <DetailCard title="Circuits at this location" flush>
                <RelatedCircuitsTable circuits={circuits} />
              </DetailCard>
            ),
          },
          {
            key: 'contracts',
            label: 'Contracts',
            count: contracts.length,
            content: (
              <DetailCard
                title="Contracts covering this location"
                description="Contracts reached through the services delivered here."
                flush
              >
                <RelatedContractsTable contracts={contracts} />
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
