import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard, FieldGrid } from '@/components/ui/DetailCard'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { DataTable } from '@/components/data/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import { usePortal } from '@/lib/usePortal'
import { formatCurrency, formatDate, formatRelative } from '@/lib/format'
import { getTenant, openTickets, scopeToTenant, totalMrc, usersForTenant } from '@/data/selectors'
import { useData } from '@/state/DataContext'
import {
  RelatedCircuitsTable,
  RelatedContractsTable,
  RelatedDocumentsTable,
  RelatedServicesTable,
  RelatedTicketsTable,
} from '@/pages/shared/RelatedTables'
import { NotFoundRecord } from '@/pages/shared/NotFoundRecord'

export function CustomerDetailPage() {
  const { id } = useParams()
  const { data: allData } = useData()
  const { data } = usePortal()
  const [tab, setTab] = useState('overview')

  const tenant = getTenant(data, id)

  if (!tenant) {
    return (
      <NotFoundRecord
        title="Customer not found"
        description="No customer exists with that identifier."
        backTo="/admin/customers"
        backLabel="Back to customers"
      />
    )
  }

  // Everything below is this customer's slice of the platform, reusing the same
  // scoping helper the customer portal uses.
  const scoped = scopeToTenant(allData, tenant.id)
  const users = usersForTenant(scoped, tenant.id)
  const open = openTickets(scoped.tickets)

  return (
    <PageContainer
      title={tenant.name}
      description={`${tenant.industry} · head office in ${tenant.hqCity}, ${tenant.hqState}`}
      breadcrumbs={[
        { label: 'Admin', to: '/admin/dashboard' },
        { label: 'Customers', to: '/admin/customers' },
        { label: tenant.name },
      ]}
      meta={
        <>
          <StatusBadge status={tenant.status} />
          <span className="text-xs text-ink-500">Customer since {formatDate(tenant.onboardedAt)}</span>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Locations" value={scoped.locations.length} />
        <StatCard label="Services" value={scoped.services.length} />
        <StatCard label="Circuits" value={scoped.circuits.length} />
        <StatCard label="Monthly cost" value={formatCurrency(totalMrc(scoped.services))} hint="Active services" />
        <StatCard label="Open tickets" value={open.length} tone={open.length ? 'warn' : 'default'} />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          {
            key: 'overview',
            label: 'Overview',
            content: (
              <div className="space-y-4">
                <DetailCard title="Customer details">
                  <FieldGrid
                    fields={[
                      { label: 'Company name', value: tenant.name },
                      { label: 'Account code', value: <span className="font-mono text-xs">{tenant.code}</span> },
                      { label: 'Industry', value: tenant.industry },
                      { label: 'Status', value: <StatusBadge status={tenant.status} /> },
                      { label: 'Head office', value: `${tenant.hqCity}, ${tenant.hqState}` },
                      { label: 'Customer since', value: formatDate(tenant.onboardedAt) },
                      { label: 'Primary contact', value: tenant.primaryContact },
                      { label: 'Contact email', value: tenant.primaryEmail },
                      { label: 'Phone', value: tenant.phone },
                    ]}
                  />
                </DetailCard>

                <Alert tone="info" title="Editing is not implemented">
                  Customer administration in this prototype is read-only apart from ticket updates and simulated
                  uploads and imports. Which actions LynkBridge staff may perform, and any approval steps involved,
                  are undefined.
                </Alert>
              </div>
            ),
          },
          {
            key: 'locations',
            label: 'Locations',
            count: scoped.locations.length,
            content: (
              <DetailCard title="Locations" flush>
                <DataTable
                  rows={scoped.locations}
                  rowKey={(row) => row.id}
                  rowHref={(row) => `/admin/locations/${row.id}`}
                  empty={<EmptyState dense title="No locations recorded" />}
                  columns={[
                    {
                      key: 'name',
                      header: 'Location',
                      render: (row) => (
                        <div>
                          <p className="font-medium text-ink-900">{row.name}</p>
                          <p className="text-xs text-ink-500">{row.siteType}</p>
                        </div>
                      ),
                    },
                    { key: 'address', header: 'Address', hideBelow: 'lg', render: (row) => row.addressLine },
                    { key: 'city', header: 'City', render: (row) => `${row.city}, ${row.state}` },
                    {
                      key: 'services',
                      header: 'Services',
                      align: 'right',
                      hideBelow: 'sm',
                      render: (row) => scoped.services.filter((service) => service.locationId === row.id).length,
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
            count: scoped.services.length,
            content: (
              <DetailCard title="Services" flush>
                <RelatedServicesTable services={scoped.services} />
              </DetailCard>
            ),
          },
          {
            key: 'circuits',
            label: 'Circuits',
            count: scoped.circuits.length,
            content: (
              <DetailCard title="Circuits" flush>
                <RelatedCircuitsTable circuits={scoped.circuits} />
              </DetailCard>
            ),
          },
          {
            key: 'contracts',
            label: 'Contracts',
            count: scoped.contracts.length,
            content: (
              <DetailCard title="Contracts" flush>
                <RelatedContractsTable contracts={scoped.contracts} />
              </DetailCard>
            ),
          },
          {
            key: 'documents',
            label: 'Documents',
            count: scoped.documents.length,
            content: (
              <DetailCard title="Documents" flush>
                <RelatedDocumentsTable documents={scoped.documents} />
              </DetailCard>
            ),
          },
          {
            key: 'tickets',
            label: 'Tickets',
            count: scoped.tickets.length,
            content: (
              <DetailCard title="Support tickets" flush>
                <RelatedTicketsTable tickets={scoped.tickets} />
              </DetailCard>
            ),
          },
          {
            key: 'users',
            label: 'Users',
            count: users.length,
            content: (
              <DetailCard title="Portal users" flush>
                <DataTable
                  rows={users}
                  rowKey={(row) => row.id}
                  rowHref={(row) => `/admin/users/${row.id}`}
                  empty={<EmptyState dense title="No portal users" />}
                  columns={[
                    {
                      key: 'name',
                      header: 'Name',
                      render: (row) => (
                        <div>
                          <p className="font-medium text-ink-900">{row.name}</p>
                          <p className="text-xs text-ink-500">{row.title}</p>
                        </div>
                      ),
                    },
                    { key: 'email', header: 'Email', hideBelow: 'md', render: (row) => row.email },
                    { key: 'role', header: 'Role', hideBelow: 'sm', render: (row) => row.role },
                    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
                    {
                      key: 'lastLogin',
                      header: 'Last sign-in',
                      hideBelow: 'lg',
                      render: (row) => formatRelative(row.lastLoginAt),
                    },
                  ]}
                />
              </DetailCard>
            ),
          },
        ]}
      />
    </PageContainer>
  )
}
