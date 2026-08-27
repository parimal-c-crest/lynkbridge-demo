import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { LinkButton } from '@/components/ui/Button'
import { CollectionTable } from '@/components/data/CollectionTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useCollection } from '@/lib/useCollection'
import { usePortal } from '@/lib/usePortal'
import { formatCurrency, formatDate } from '@/lib/format'
import { circuitForService, getCarrier, getContract, getLocation, getTenant } from '@/data/selectors'
import { SERVICE_TYPES } from '@/data/types'
import type { Column } from '@/components/data/DataTable'
import type { Service } from '@/data/types'

export function ServicesListPage() {
  const { data, isAdmin, path } = usePortal()

  const collection = useCollection<Service>({
    rows: data.services,
    searchText: (row) =>
      [
        row.name,
        row.type,
        row.bandwidth,
        row.accountNumber,
        getLocation(data, row.locationId)?.name,
        getCarrier(data, row.carrierId)?.name,
        circuitForService(data, row.id)?.circuitId,
      ]
        .filter(Boolean)
        .join(' '),
    filters: [
      { key: 'type', label: 'Service types', options: [...SERVICE_TYPES], value: (row) => row.type },
      { key: 'status', label: 'Statuses', value: (row) => row.status },
      { key: 'carrier', label: 'Carriers', value: (row) => getCarrier(data, row.carrierId)?.name ?? '—' },
      ...(isAdmin
        ? [
            {
              key: 'customer',
              label: 'Customers',
              value: (row: Service) => getTenant(data, row.tenantId)?.name ?? '—',
            },
          ]
        : []),
    ],
    sorts: [
      { key: 'name', label: 'Service (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
      { key: 'mrc-desc', label: 'Highest MRC', compare: (a, b) => b.mrc - a.mrc },
      {
        key: 'contract-end',
        label: 'Contract ending soonest',
        compare: (a, b) =>
          (getContract(data, a.contractId)?.endDate ?? '').localeCompare(getContract(data, b.contractId)?.endDate ?? ''),
      },
    ],
    defaultSortKey: 'name',
  })

  const columns: Column<Service>[] = [
    {
      key: 'name',
      header: 'Service',
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.name}</p>
          <p className="text-xs text-ink-500">{row.bandwidth}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => row.type },
    ...(isAdmin
      ? [
          {
            key: 'customer',
            header: 'Customer',
            hideBelow: 'xl' as const,
            render: (row: Service) => getTenant(data, row.tenantId)?.name ?? '—',
          },
        ]
      : []),
    {
      key: 'location',
      header: 'Location',
      hideBelow: 'md',
      render: (row) => getLocation(data, row.locationId)?.name ?? '—',
    },
    {
      key: 'carrier',
      header: 'Carrier',
      hideBelow: 'lg',
      render: (row) => getCarrier(data, row.carrierId)?.name ?? '—',
    },
    {
      key: 'circuit',
      header: 'Circuit',
      hideBelow: 'xl',
      render: (row) => {
        const circuit = circuitForService(data, row.id)
        return circuit ? <span className="font-mono text-xs">{circuit.circuitId}</span> : <span className="text-ink-400">—</span>
      },
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'mrc', header: 'MRC', align: 'right', render: (row) => formatCurrency(row.mrc) },
    {
      key: 'contract-end',
      header: 'Contract End',
      hideBelow: 'sm',
      render: (row) => formatDate(getContract(data, row.contractId)?.endDate),
    },
  ]

  return (
    <PageContainer
      title="Services"
      description="Connectivity and managed services, with the carrier, circuit and contract behind each one."
      actions={
        <LinkButton to={path('/services/new')} variant="primary" icon={<Plus className="size-4" />}>
          Add service
        </LinkButton>
      }
    >
      <CollectionTable
        collection={collection}
        columns={columns}
        rowKey={(row) => row.id}
        rowHref={(row) => path(`/services/${row.id}`)}
        filters={[
          { key: 'type', label: 'Service types' },
          { key: 'status', label: 'Statuses' },
          { key: 'carrier', label: 'Carriers' },
          ...(isAdmin ? [{ key: 'customer', label: 'Customers' }] : []),
        ]}
        sorts={[
          { key: 'name', label: 'Service (A–Z)' },
          { key: 'mrc-desc', label: 'Highest MRC' },
          { key: 'contract-end', label: 'Contract ending soonest' },
        ]}
        searchPlaceholder="Search services, bandwidth, accounts or circuit IDs…"
        noun="services"
        emptyTitle="No services recorded"
        emptyDescription="Services appear here once they have been added or imported."
      />
    </PageContainer>
  )
}
