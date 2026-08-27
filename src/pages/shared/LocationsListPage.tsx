import { Eye, Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { LinkButton } from '@/components/ui/Button'
import { CollectionTable } from '@/components/data/CollectionTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useCollection } from '@/lib/useCollection'
import { usePortal } from '@/lib/usePortal'
import { circuitsAtLocation, getTenant, mrcByLocation, servicesAtLocation } from '@/data/selectors'
import { ChartFrame } from '@/components/charts/ChartFrame'
import { BarChart } from '@/components/charts/BarChart'
import { formatCurrency } from '@/lib/format'
import type { Column } from '@/components/data/DataTable'
import type { Location } from '@/data/types'

export function LocationsListPage() {
  const { data, isAdmin, path } = usePortal()

  const collection = useCollection<Location>({
    rows: data.locations,
    searchText: (row) =>
      [row.name, row.addressLine, row.city, row.state, row.zip, row.siteType].join(' '),
    filters: [
      { key: 'status', label: 'Statuses', value: (row) => row.status },
      { key: 'state', label: 'States', value: (row) => row.state },
      { key: 'siteType', label: 'Site types', value: (row) => row.siteType },
      ...(isAdmin
        ? [
            {
              key: 'customer',
              label: 'Customers',
              value: (row: Location) => getTenant(data, row.tenantId)?.name ?? '—',
            },
          ]
        : []),
    ],
    sorts: [
      { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
      { key: 'city', label: 'City (A–Z)', compare: (a, b) => a.city.localeCompare(b.city) },
      {
        key: 'services',
        label: 'Most services',
        compare: (a, b) => servicesAtLocation(data, b.id).length - servicesAtLocation(data, a.id).length,
      },
    ],
    defaultSortKey: 'name',
  })

  const columns: Column<Location>[] = [
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
    ...(isAdmin
      ? [
          {
            key: 'customer',
            header: 'Customer',
            hideBelow: 'lg' as const,
            render: (row: Location) => getTenant(data, row.tenantId)?.name ?? '—',
          },
        ]
      : []),
    {
      key: 'address',
      header: 'Address',
      hideBelow: 'md',
      render: (row) => <span className="text-ink-600">{row.addressLine}</span>,
    },
    {
      key: 'city',
      header: 'City',
      render: (row) => (
        <span className="whitespace-nowrap">
          {row.city}, {row.state}
        </span>
      ),
    },
    {
      key: 'services',
      header: 'Services',
      align: 'right',
      hideBelow: 'sm',
      render: (row) => servicesAtLocation(data, row.id).length,
    },
    {
      key: 'circuits',
      header: 'Circuits',
      align: 'right',
      hideBelow: 'sm',
      render: (row) => circuitsAtLocation(data, row.id).length,
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '72px',
      render: (row) => (
        // The whole row already navigates; this is the visible affordance for it,
        // so it carries an accessible name rather than relying on the glyph.
        <span
          className="inline-grid size-7 place-items-center rounded-md text-ink-400 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600"
          role="img"
          aria-label={`View ${row.name}`}
          title={`View ${row.name}`}
        >
          <Eye className="size-4" />
        </span>
      ),
    },
  ]

  return (
    <PageContainer
      title="Locations"
      description={
        isAdmin
          ? 'Every site across all customers, with its connected services and circuits.'
          : 'Every site in your organisation, with its connected services and circuits.'
      }
      actions={
        <LinkButton to={path('/locations/new')} variant="primary" icon={<Plus className="size-4" />}>
          Add location
        </LinkButton>
      }
    >
      <ChartFrame
        title="Highest-cost locations"
        description="Where monthly spend is concentrated across the estate."
        isEmpty={data.locations.length === 0}
        emptyTitle="No locations recorded"
        footnote="Active services only. Select a bar to open that location."
      >
        <BarChart
          rows={mrcByLocation(data).map((slice) => ({
            label: slice.label,
            value: slice.value,
            href: slice.suffix ? path(slice.suffix) : undefined,
          }))}
          formatValue={formatCurrency}
          maxRows={6}
          ariaLabel="Monthly cost by location, highest first"
        />
      </ChartFrame>

      <CollectionTable
        collection={collection}
        columns={columns}
        rowKey={(row) => row.id}
        rowHref={(row) => path(`/locations/${row.id}`)}
        filters={[
          { key: 'status', label: 'Statuses' },
          { key: 'state', label: 'States' },
          { key: 'siteType', label: 'Site types' },
          ...(isAdmin ? [{ key: 'customer', label: 'Customers' }] : []),
        ]}
        sorts={[
          { key: 'name', label: 'Name (A–Z)' },
          { key: 'city', label: 'City (A–Z)' },
          { key: 'services', label: 'Most services' },
        ]}
        searchPlaceholder="Search locations by name, address or city…"
        noun="locations"
        emptyTitle="No locations recorded"
        emptyDescription="Locations appear here once they have been added or imported."
      />
    </PageContainer>
  )
}
