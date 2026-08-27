import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { CollectionTable } from '@/components/data/CollectionTable'
import { DetailCard, FieldGrid } from '@/components/ui/DetailCard'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { DataTable } from '@/components/data/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { useCollection } from '@/lib/useCollection'
import { usePortal } from '@/lib/usePortal'
import { formatCurrency } from '@/lib/format'
import {
  circuitsForCarrier,
  getCarrier,
  servicesForCarrier,
  tenantsForCarrier,
  totalMrc,
} from '@/data/selectors'
import { RelatedCircuitsTable, RelatedServicesTable } from '@/pages/shared/RelatedTables'
import { NotFoundRecord } from '@/pages/shared/NotFoundRecord'
import type { Column } from '@/components/data/DataTable'
import type { Carrier } from '@/data/types'

export function CarriersListPage() {
  const { data } = usePortal()

  const collection = useCollection<Carrier>({
    rows: data.carriers,
    searchText: (row) => [row.name, row.accountManager, row.supportPhone].join(' '),
    filters: [{ key: 'status', label: 'Statuses', value: (row) => row.status }],
    sorts: [
      { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
      {
        key: 'services',
        label: 'Most services',
        compare: (a, b) => servicesForCarrier(data, b.id).length - servicesForCarrier(data, a.id).length,
      },
    ],
    defaultSortKey: 'name',
  })

  const columns: Column<Carrier>[] = [
    {
      key: 'name',
      header: 'Carrier',
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.name}</p>
          <p className="text-xs text-ink-500">{row.accountManager}</p>
        </div>
      ),
    },
    {
      key: 'services',
      header: 'Services',
      align: 'right',
      render: (row) => servicesForCarrier(data, row.id).length,
    },
    {
      key: 'customers',
      header: 'Customers',
      align: 'right',
      render: (row) => tenantsForCarrier(data, row.id).length,
    },
    {
      key: 'circuits',
      header: 'Circuits',
      align: 'right',
      hideBelow: 'sm',
      render: (row) => circuitsForCarrier(data, row.id).length,
    },
    { key: 'phone', header: 'Support', hideBelow: 'lg', render: (row) => row.supportPhone },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <PageContainer
      title="Carriers"
      description="Providers delivering services across the platform, with their footprint in the customer base."
    >
      <CollectionTable
        collection={collection}
        columns={columns}
        rowKey={(row) => row.id}
        rowHref={(row) => `/admin/carriers/${row.id}`}
        filters={[{ key: 'status', label: 'Statuses' }]}
        sorts={[
          { key: 'name', label: 'Name (A–Z)' },
          { key: 'services', label: 'Most services' },
        ]}
        searchPlaceholder="Search carriers by name or account manager…"
        noun="carriers"
        emptyTitle="No carriers recorded"
        emptyDescription="Carriers appear here once services have been added against them."
      />

      <ProtoNote label="Why carriers are modelled this way">
        Carriers are platform-level records shared across every customer, which is what lets this list count customers
        per carrier. Customers see the carrier on their own services but never manage carrier records. The fields held
        here are deliberately minimal — no carrier requirements were defined in the discussion.
      </ProtoNote>
    </PageContainer>
  )
}

export function CarrierDetailPage() {
  const { id } = useParams()
  const { data } = usePortal()
  const [tab, setTab] = useState('overview')

  const carrier = getCarrier(data, id)

  if (!carrier) {
    return (
      <NotFoundRecord
        title="Carrier not found"
        description="No carrier exists with that identifier."
        backTo="/admin/carriers"
        backLabel="Back to carriers"
      />
    )
  }

  const services = servicesForCarrier(data, carrier.id)
  const circuits = circuitsForCarrier(data, carrier.id)
  const tenants = tenantsForCarrier(data, carrier.id)
  const contracts = data.contracts.filter((contract) => contract.carrierId === carrier.id)

  return (
    <PageContainer
      title={carrier.name}
      description={`Account manager: ${carrier.accountManager}`}
      breadcrumbs={[
        { label: 'Admin', to: '/admin/dashboard' },
        { label: 'Carriers', to: '/admin/carriers' },
        { label: carrier.name },
      ]}
      meta={<StatusBadge status={carrier.status} />}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Services" value={services.length} />
        <StatCard label="Circuits" value={circuits.length} />
        <StatCard label="Customers" value={tenants.length} />
        <StatCard label="Monthly cost" value={formatCurrency(totalMrc(services))} hint="Active services" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          {
            key: 'overview',
            label: 'Overview',
            content: (
              <DetailCard title="Carrier details">
                <FieldGrid
                  fields={[
                    { label: 'Carrier', value: carrier.name },
                    { label: 'Status', value: <StatusBadge status={carrier.status} /> },
                    { label: 'Account manager', value: carrier.accountManager },
                    { label: 'Support line', value: carrier.supportPhone },
                    { label: 'Carrier portal', value: carrier.portalUrl },
                    { label: 'Contracts', value: contracts.length },
                  ]}
                />
              </DetailCard>
            ),
          },
          {
            key: 'customers',
            label: 'Customers',
            count: tenants.length,
            content: (
              <DetailCard title="Customers using this carrier" flush>
                <DataTable
                  rows={tenants}
                  rowKey={(row) => row.id}
                  rowHref={(row) => `/admin/customers/${row.id}`}
                  empty={<EmptyState dense title="No customers on this carrier" />}
                  columns={[
                    {
                      key: 'name',
                      header: 'Customer',
                      render: (row) => <span className="font-medium text-ink-900">{row.name}</span>,
                    },
                    { key: 'industry', header: 'Industry', hideBelow: 'md', render: (row) => row.industry },
                    {
                      key: 'services',
                      header: 'Services on this carrier',
                      align: 'right',
                      render: (row) => services.filter((service) => service.tenantId === row.id).length,
                    },
                    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
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
              <DetailCard title="Services delivered by this carrier" flush>
                <RelatedServicesTable services={services} />
              </DetailCard>
            ),
          },
          {
            key: 'circuits',
            label: 'Circuits',
            count: circuits.length,
            content: (
              <DetailCard title="Circuits" flush>
                <RelatedCircuitsTable circuits={circuits} />
              </DetailCard>
            ),
          },
        ]}
      />
    </PageContainer>
  )
}
