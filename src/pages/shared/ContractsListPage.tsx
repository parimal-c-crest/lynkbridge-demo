import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { LinkButton } from '@/components/ui/Button'
import { CollectionTable } from '@/components/data/CollectionTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { useCollection } from '@/lib/useCollection'
import { usePortal } from '@/lib/usePortal'
import { formatCurrency, formatDate, formatDaysRemaining } from '@/lib/format'
import {
  contractMrc,
  daysUntil,
  getCarrier,
  getTenant,
  renewalExposure,
} from '@/data/selectors'
import { ChartFrame } from '@/components/charts/ChartFrame'
import { StackedStrip } from '@/components/charts/StackedStrip'
import type { Column } from '@/components/data/DataTable'
import type { Contract } from '@/data/types'

export function ContractsListPage() {
  const { data, isAdmin, path, settings, statusOf } = usePortal()

  const collection = useCollection<Contract>({
    rows: data.contracts,
    searchText: (row) =>
      [row.contractNumber, getCarrier(data, row.carrierId)?.name, getTenant(data, row.tenantId)?.name, row.notes]
        .filter(Boolean)
        .join(' '),
    filters: [
      {
        key: 'renewal',
        label: 'Renewal statuses',
        options: ['Active', 'Expiring Soon', 'Expired'],
        value: (row) => statusOf(row),
      },
      { key: 'provider', label: 'Providers', value: (row) => getCarrier(data, row.carrierId)?.name ?? '—' },
      ...(isAdmin
        ? [
            {
              key: 'customer',
              label: 'Customers',
              value: (row: Contract) => getTenant(data, row.tenantId)?.name ?? '—',
            },
          ]
        : []),
    ],
    sorts: [
      { key: 'end-asc', label: 'Ending soonest', compare: (a, b) => a.endDate.localeCompare(b.endDate) },
      { key: 'end-desc', label: 'Ending latest', compare: (a, b) => b.endDate.localeCompare(a.endDate) },
      {
        key: 'mrc-desc',
        label: 'Highest MRC',
        compare: (a, b) => contractMrc(data, b.id) - contractMrc(data, a.id),
      },
    ],
    defaultSortKey: 'end-asc',
  })

  const columns: Column<Contract>[] = [
    {
      key: 'contract',
      header: 'Contract',
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.contractNumber}</p>
          <p className="text-xs text-ink-500">{row.termMonths}-month term</p>
        </div>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: 'customer',
            header: 'Customer',
            hideBelow: 'lg' as const,
            render: (row: Contract) => getTenant(data, row.tenantId)?.name ?? '—',
          },
        ]
      : []),
    {
      key: 'provider',
      header: 'Provider',
      render: (row) => getCarrier(data, row.carrierId)?.name ?? '—',
    },
    { key: 'start', header: 'Start Date', hideBelow: 'xl', render: (row) => formatDate(row.startDate) },
    {
      key: 'end',
      header: 'End Date',
      render: (row) => (
        <div>
          <p>{formatDate(row.endDate)}</p>
          <p className="text-xs text-ink-500">{formatDaysRemaining(daysUntil(row.endDate))}</p>
        </div>
      ),
    },
    {
      key: 'mrc',
      header: 'MRC',
      align: 'right',
      hideBelow: 'sm',
      render: (row) => formatCurrency(contractMrc(data, row.id)),
    },
    { key: 'renewal', header: 'Renewal Status', render: (row) => <StatusBadge status={statusOf(row)} /> },
  ]

  return (
    <PageContainer
      title="Contracts"
      description="Commercial agreements with start and end dates, monthly cost and renewal position."
      actions={
        <LinkButton to={path('/contracts/new')} variant="primary" icon={<Plus className="size-4" />}>
          Add contract
        </LinkButton>
      }
    >
      <ChartFrame
        title="Renewal exposure"
        description="Monthly cost by how close each contract is to its end date. Select a band to filter the list."
        isEmpty={data.contracts.length === 0}
        emptyTitle="No contracts recorded"
        footnote="Bands are a prototype choice. The real notice periods per contract have not been confirmed."
      >
        <StackedStrip
          slices={renewalExposure(data)}
          formatValue={formatCurrency}
          hrefFor={(slice) => `${path('/contracts')}?renewal=${encodeURIComponent(slice.filterValue)}`}
          ariaLabel="Monthly cost by renewal proximity"
        />
      </ChartFrame>

      <CollectionTable
        collection={collection}
        columns={columns}
        rowKey={(row) => row.id}
        rowHref={(row) => path(`/contracts/${row.id}`)}
        filters={[
          { key: 'renewal', label: 'Renewal statuses' },
          { key: 'provider', label: 'Providers' },
          ...(isAdmin ? [{ key: 'customer', label: 'Customers' }] : []),
        ]}
        sorts={[
          { key: 'end-asc', label: 'Ending soonest' },
          { key: 'end-desc', label: 'Ending latest' },
          { key: 'mrc-desc', label: 'Highest MRC' },
        ]}
        searchPlaceholder="Search contract numbers or providers…"
        noun="contracts"
        emptyTitle="No contracts recorded"
        emptyDescription="Contracts appear here once they have been added or imported."
      />

      <ProtoNote label="How renewal status and MRC are calculated here">
        A contract reads as <strong>Expiring Soon</strong> within {settings.renewalWindowDays} days of its end date; the real
        notice period is unconfirmed. Contract MRC is summed from the services on the contract rather than stored
        separately, so the figure always agrees with the service screens. No renewal automation exists in this
        prototype — renewal handling is a Phase 1 workflow question.
      </ProtoNote>
    </PageContainer>
  )
}
