import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { LinkButton } from '@/components/ui/Button'
import { CollectionTable } from '@/components/data/CollectionTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useCollection } from '@/lib/useCollection'
import { usePortal } from '@/lib/usePortal'
import { formatCurrency, formatDate } from '@/lib/format'
import { totalMrc, usersForTenant } from '@/data/selectors'
import type { Column } from '@/components/data/DataTable'
import type { Tenant } from '@/data/types'

export function CustomersListPage() {
  const { data } = usePortal()

  const countsFor = (tenantId: string) => ({
    locations: data.locations.filter((location) => location.tenantId === tenantId).length,
    services: data.services.filter((service) => service.tenantId === tenantId).length,
    users: usersForTenant(data, tenantId).length,
    mrc: totalMrc(data.services.filter((service) => service.tenantId === tenantId)),
  })

  const collection = useCollection<Tenant>({
    rows: data.tenants,
    searchText: (row) => [row.name, row.code, row.industry, row.hqCity, row.primaryContact].join(' '),
    filters: [
      { key: 'status', label: 'Statuses', value: (row) => row.status },
      { key: 'industry', label: 'Industries', value: (row) => row.industry },
    ],
    sorts: [
      { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
      { key: 'newest', label: 'Newest first', compare: (a, b) => b.onboardedAt.localeCompare(a.onboardedAt) },
      {
        key: 'largest',
        label: 'Most locations',
        compare: (a, b) => countsFor(b.id).locations - countsFor(a.id).locations,
      },
    ],
    defaultSortKey: 'name',
  })

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.name}</p>
          <p className="text-xs text-ink-500">
            {row.industry} · {row.hqCity}, {row.hqState}
          </p>
        </div>
      ),
    },
    { key: 'locations', header: 'Locations', align: 'right', render: (row) => countsFor(row.id).locations },
    { key: 'services', header: 'Services', align: 'right', render: (row) => countsFor(row.id).services },
    { key: 'users', header: 'Users', align: 'right', hideBelow: 'sm', render: (row) => countsFor(row.id).users },
    {
      key: 'mrc',
      header: 'Monthly cost',
      align: 'right',
      hideBelow: 'md',
      render: (row) => formatCurrency(countsFor(row.id).mrc),
    },
    { key: 'since', header: 'Customer since', hideBelow: 'lg', render: (row) => formatDate(row.onboardedAt) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <PageContainer
      title="Customers"
      description="Every company on the platform, with the size of its estate and its current standing."
      actions={
        <LinkButton to="/admin/customers/new" variant="primary" icon={<Plus className="size-4" />}>
          Add customer
        </LinkButton>
      }
    >
      <CollectionTable
        collection={collection}
        columns={columns}
        rowKey={(row) => row.id}
        rowHref={(row) => `/admin/customers/${row.id}`}
        filters={[
          { key: 'status', label: 'Statuses' },
          { key: 'industry', label: 'Industries' },
        ]}
        sorts={[
          { key: 'name', label: 'Name (A–Z)' },
          { key: 'newest', label: 'Newest first' },
          { key: 'largest', label: 'Most locations' },
        ]}
        searchPlaceholder="Search customers by name, industry or contact…"
        noun="customers"
        emptyTitle="No customers recorded"
        emptyDescription="Customers appear here once they have been added or imported."
      />
    </PageContainer>
  )
}
