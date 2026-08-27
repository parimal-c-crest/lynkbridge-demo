import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { LinkButton } from '@/components/ui/Button'
import { CollectionTable } from '@/components/data/CollectionTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useCollection } from '@/lib/useCollection'
import { usePortal } from '@/lib/usePortal'
import { carrierForCircuit, circuitHealth, getService, getTenant, locationForCircuit } from '@/data/selectors'
import { ChartFrame } from '@/components/charts/ChartFrame'
import { StackedStrip } from '@/components/charts/StackedStrip'
import type { Column } from '@/components/data/DataTable'
import type { Circuit } from '@/data/types'

export function CircuitsListPage() {
  const { data, isAdmin, path } = usePortal()

  const collection = useCollection<Circuit>({
    rows: data.circuits,
    searchText: (row) =>
      [
        row.circuitId,
        row.accountNumber,
        row.bandwidth,
        getService(data, row.serviceId)?.name,
        locationForCircuit(data, row)?.name,
        carrierForCircuit(data, row)?.name,
      ]
        .filter(Boolean)
        .join(' '),
    filters: [
      { key: 'status', label: 'Statuses', value: (row) => row.status },
      { key: 'carrier', label: 'Carriers', value: (row) => carrierForCircuit(data, row)?.name ?? '—' },
      { key: 'bandwidth', label: 'Bandwidths', value: (row) => row.bandwidth },
      ...(isAdmin
        ? [
            {
              key: 'customer',
              label: 'Customers',
              value: (row: Circuit) => {
                const service = getService(data, row.serviceId)
                return service ? (getTenant(data, service.tenantId)?.name ?? '—') : '—'
              },
            },
          ]
        : []),
    ],
    sorts: [
      { key: 'circuit', label: 'Circuit ID (A–Z)', compare: (a, b) => a.circuitId.localeCompare(b.circuitId) },
      {
        key: 'status',
        label: 'Status (issues first)',
        compare: (a, b) => statusRank(a.status) - statusRank(b.status),
      },
    ],
    defaultSortKey: 'circuit',
  })

  const columns: Column<Circuit>[] = [
    {
      key: 'circuitId',
      header: 'Circuit ID',
      render: (row) => <span className="font-mono text-xs font-medium text-ink-900">{row.circuitId}</span>,
    },
    {
      key: 'service',
      header: 'Service',
      render: (row) => getService(data, row.serviceId)?.name ?? '—',
    },
    ...(isAdmin
      ? [
          {
            key: 'customer',
            header: 'Customer',
            hideBelow: 'xl' as const,
            render: (row: Circuit) => {
              const service = getService(data, row.serviceId)
              return service ? (getTenant(data, service.tenantId)?.name ?? '—') : '—'
            },
          },
        ]
      : []),
    {
      key: 'location',
      header: 'Location',
      hideBelow: 'md',
      render: (row) => locationForCircuit(data, row)?.name ?? '—',
    },
    {
      key: 'carrier',
      header: 'Carrier',
      hideBelow: 'lg',
      render: (row) => carrierForCircuit(data, row)?.name ?? '—',
    },
    {
      key: 'account',
      header: 'Account',
      hideBelow: 'xl',
      render: (row) => <span className="font-mono text-xs">{row.accountNumber}</span>,
    },
    { key: 'bandwidth', header: 'Bandwidth', hideBelow: 'sm', render: (row) => row.bandwidth },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <PageContainer
      title="Circuits"
      description="Physical delivery for each service, with its carrier account and current state."
      actions={
        <LinkButton to={path('/circuits/new')} variant="primary" icon={<Plus className="size-4" />}>
          Add circuit
        </LinkButton>
      }
    >
      <ChartFrame
        title="Circuit health"
        description="The estate by current state. Select a segment to filter the list below."
        isEmpty={data.circuits.length === 0}
        emptyTitle="No circuits recorded"
        footnote="States are prototype vocabulary — no monitoring system is connected, and nothing here is live."
      >
        <StackedStrip
          slices={circuitHealth(data)}
          hrefFor={(slice) => `${path('/circuits')}?status=${encodeURIComponent(slice.filterValue)}`}
          ariaLabel="Circuits by current state"
        />
      </ChartFrame>

      <CollectionTable
        collection={collection}
        columns={columns}
        rowKey={(row) => row.id}
        rowHref={(row) => path(`/circuits/${row.id}`)}
        filters={[
          { key: 'status', label: 'Statuses' },
          { key: 'carrier', label: 'Carriers' },
          { key: 'bandwidth', label: 'Bandwidths' },
          ...(isAdmin ? [{ key: 'customer', label: 'Customers' }] : []),
        ]}
        sorts={[
          { key: 'circuit', label: 'Circuit ID (A–Z)' },
          { key: 'status', label: 'Status (issues first)' },
        ]}
        searchPlaceholder="Search circuit IDs, accounts or locations…"
        noun="circuits"
        emptyTitle="No circuits recorded"
        emptyDescription="Circuits appear here once services with physical delivery have been added."
      />
    </PageContainer>
  )
}

/** Degraded and disconnected circuits sort to the top — they need attention first. */
function statusRank(status: Circuit['status']) {
  const order: Record<Circuit['status'], number> = {
    Disconnected: 0,
    Degraded: 1,
    Provisioning: 2,
    Active: 3,
  }
  return order[status]
}
