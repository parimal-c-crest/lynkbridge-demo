import { useState } from 'react'
import { Cable, CalendarClock, DollarSign, LifeBuoy, MapPin, Network } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { StatCard } from '@/components/ui/StatCard'
import { DetailCard } from '@/components/ui/DetailCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable } from '@/components/data/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { LinkButton } from '@/components/ui/Button'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { usePortal } from '@/lib/usePortal'
import { formatCurrency, formatDate, formatDaysRemaining } from '@/lib/format'
import {
  contractMrc,
  daysUntil,
  getCarrier,
  getLocation,
  mrcByServiceType,
  openTickets,
  recentTickets,
  renewalRunway,
  spendUnderManagement,
  totalMrc,
  upcomingRenewals,
} from '@/data/selectors'
import { ChartFrame } from '@/components/charts/ChartFrame'
import { BarChart } from '@/components/charts/BarChart'
import { ColumnChart } from '@/components/charts/ColumnChart'
import { AreaChart } from '@/components/charts/AreaChart'
import { RangeSelect } from '@/components/charts/RangeSelect'

export function CustomerDashboardPage() {
  const { data, path, session, settings, statusOf } = usePortal()

  const activeServices = data.services.filter((service) => service.status === 'Active')
  const open = openTickets(data.tickets)
  const renewals = upcomingRenewals(data, settings.renewalWindowDays)
  const recent = recentTickets(data.tickets, 5)

  const [runwayMonths, setRunwayMonths] = useState(settings.runwayMonths)
  const [spendMonths, setSpendMonths] = useState(24)

  const runway = renewalRunway(data, runwayMonths, settings.renewalWindowDays)
  const costByType = mrcByServiceType(data)
  const spend = spendUnderManagement(data, spendMonths)

  return (
    <PageContainer
      title={`${session.tenantName ?? 'Customer'} overview`}
      description="Your connectivity estate at a glance — sites, services, spend and anything needing attention."
      actions={
        <LinkButton to={path('/tickets/new')} variant="primary">
          Create ticket
        </LinkButton>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Locations"
          value={data.locations.length}
          icon={<MapPin className="size-4" />}
          to={path('/locations')}
        />
        <StatCard
          label="Active services"
          value={activeServices.length}
          hint={`${data.services.length} total`}
          icon={<Network className="size-4" />}
          to={path('/services')}
        />
        <StatCard
          label="Circuits"
          value={data.circuits.length}
          icon={<Cable className="size-4" />}
          to={path('/circuits')}
        />
        <StatCard
          label="Open tickets"
          value={open.length}
          tone={open.length ? 'warn' : 'default'}
          icon={<LifeBuoy className="size-4" />}
          to={path('/tickets')}
        />
        <StatCard
          label="Monthly cost"
          value={formatCurrency(totalMrc(data.services))}
          hint="Active services"
          icon={<DollarSign className="size-4" />}
          to={path('/services')}
        />
        <StatCard
          label="Upcoming renewals"
          value={renewals.length}
          hint={`Next ${settings.renewalWindowDays} days`}
          tone={renewals.length ? 'warn' : 'default'}
          icon={<CalendarClock className="size-4" />}
          to={path('/contracts')}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartFrame
          title="Renewal runway"
          description="Monthly cost reaching its contract end date, month by month."
          isEmpty={runway.every((month) => month.mrc === 0)}
          emptyTitle="No contracts end in this window"
          emptyDescription="Months with contracts reaching their end date will be charted here."
          footnote={
            <>
              Amber months fall inside the {settings.renewalWindowDays}-day renewal window. Figures roll up from the
              services on each contract.
            </>
          }
          actions={
            <RangeSelect
              value={runwayMonths}
              onChange={setRunwayMonths}
              options={[
                { value: 6, label: '6 months' },
                { value: 12, label: '12 months' },
                { value: 24, label: '24 months' },
              ]}
              label="Runway range"
            />
          }
        >
          <ColumnChart
            rows={runway.map((month) => ({
              label: month.label,
              longLabel: month.longLabel,
              value: month.mrc,
              emphasis: month.urgent,
              detail: month.contractCount ? String(month.contractCount) : undefined,
              // Urgent months drill into the contracts already flagged for renewal.
              href: month.contractCount
                ? month.urgent
                  ? `${path('/contracts')}?renewal=${encodeURIComponent('Expiring Soon')}`
                  : path('/contracts')
                : undefined,
            }))}
            formatValue={formatCurrency}
            ariaLabel="Monthly cost reaching contract end date, month by month"
          />
        </ChartFrame>

        <ChartFrame
          title="Monthly cost by service type"
          description="Where your monthly spend sits across the estate."
          isEmpty={costByType.length === 0}
          emptyTitle="No active services"
          emptyDescription="Cost breakdown appears once services are active."
          footnote="Active services only. Inactive and pending services are excluded."
          actions={
            <LinkButton to={path('/services')} size="sm">
              All services
            </LinkButton>
          }
        >
          <BarChart
            rows={costByType.map((slice) => ({
              label: slice.label,
              value: slice.value,
              href: `${path('/services')}?type=${encodeURIComponent(slice.label)}`,
            }))}
            formatValue={formatCurrency}
            ariaLabel="Monthly cost by service type, largest first"
          />
        </ChartFrame>
      </div>

      <ChartFrame
        title="Spend under management"
        description="Monthly cost of active services, accumulated by the date each was installed."
        isEmpty={spend.length < 2}
        emptyTitle="Not enough history yet"
        footnote="Services installed before the window form the opening balance, so the line starts from your existing estate rather than from zero."
        actions={
          <RangeSelect
            value={spendMonths}
            onChange={setSpendMonths}
            options={[
              { value: 12, label: '12 months' },
              { value: 24, label: '24 months' },
              { value: 36, label: '36 months' },
            ]}
            label="Spend range"
          />
        }
      >
        <AreaChart
          points={spend}
          formatValue={formatCurrency}
          ariaLabel="Cumulative monthly cost of active services over time"
        />
      </ChartFrame>

      <div className="grid gap-5 xl:grid-cols-2">
        <DetailCard
          title="Upcoming contract renewals"
          description={`Contracts reaching their end date within ${settings.renewalWindowDays} days.`}
          actions={
            <LinkButton to={path('/contracts')} size="sm">
              All contracts
            </LinkButton>
          }
          flush
        >
          <DataTable
            rows={renewals.slice(0, 6)}
            rowKey={(row) => row.id}
            rowHref={(row) => path(`/contracts/${row.id}`)}
            empty={
              <EmptyState
                dense
                icon={<CalendarClock className="size-5" />}
                title="No renewals in the next 90 days"
                description="Contracts approaching their end date will be listed here."
              />
            }
            columns={[
              {
                key: 'contract',
                header: 'Contract',
                render: (row) => (
                  <div>
                    <p className="font-medium text-ink-900">{row.contractNumber}</p>
                    <p className="text-xs text-ink-500">{getCarrier(data, row.carrierId)?.name}</p>
                  </div>
                ),
              },
              {
                key: 'end',
                header: 'End date',
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
              { key: 'status', header: 'Renewal', render: (row) => <StatusBadge status={statusOf(row)} /> },
            ]}
          />
        </DetailCard>

        <DetailCard
          title="Recent tickets"
          description="The most recently updated support requests."
          actions={
            <LinkButton to={path('/tickets')} size="sm">
              All tickets
            </LinkButton>
          }
          flush
        >
          <DataTable
            rows={recent}
            rowKey={(row) => row.id}
            rowHref={(row) => path(`/tickets/${row.id}`)}
            empty={
              <EmptyState
                dense
                icon={<LifeBuoy className="size-5" />}
                title="No support tickets found."
                description="Raise a ticket and it will appear here."
              />
            }
            columns={[
              {
                key: 'subject',
                header: 'Ticket',
                render: (row) => (
                  <div>
                    <p className="font-medium text-ink-900">{row.subject}</p>
                    <p className="font-mono text-xs text-ink-500">{row.number}</p>
                  </div>
                ),
              },
              {
                key: 'location',
                header: 'Location',
                hideBelow: 'md',
                render: (row) => getLocation(data, row.locationId)?.name ?? '—',
              },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              { key: 'updated', header: 'Updated', hideBelow: 'sm', render: (row) => formatDate(row.updatedAt) },
            ]}
          />
        </DetailCard>
      </div>

      <ProtoNote label="About the numbers and charts on this dashboard">
        Every figure is fictional prototype data. The KPI and chart selection is a proposal — which numbers customers
        actually need to see daily has not been confirmed. Monthly cost sums the monthly recurring charge of active
        services only, and the 90-day renewal window is a prototype choice, not a contractual notice period. Ticket
        volume over time and circuit health are further charts the data would support if they prove useful.
      </ProtoNote>
    </PageContainer>
  )
}
