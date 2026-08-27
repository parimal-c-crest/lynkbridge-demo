import { useState } from 'react'
import { Building2, Cable, CalendarClock, DollarSign, LifeBuoy, MapPin, Network, Upload } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { StatCard } from '@/components/ui/StatCard'
import { DetailCard } from '@/components/ui/DetailCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable } from '@/components/data/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { LinkButton } from '@/components/ui/Button'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { usePortal } from '@/lib/usePortal'
import { formatCurrency, formatDate, formatDaysRemaining, formatNumber } from '@/lib/format'
import {
  contractMrc,
  daysUntil,
  getCarrier,
  getTenant,
  mrcByCarrier,
  openTickets,
  recentTickets,
  renewalRunway,
  spendUnderManagement,
  ticketsByMonth,
  totalMrc,
  upcomingRenewals,
} from '@/data/selectors'
import { ChartFrame } from '@/components/charts/ChartFrame'
import { BarChart } from '@/components/charts/BarChart'
import { ColumnChart } from '@/components/charts/ColumnChart'
import { AreaChart } from '@/components/charts/AreaChart'
import { RangeSelect } from '@/components/charts/RangeSelect'

export function AdminDashboardPage() {
  const { data, settings, statusOf } = usePortal()

  const open = openTickets(data.tickets)
  const renewals = upcomingRenewals(data, settings.renewalWindowDays)
  const recent = recentTickets(data.tickets, 5)

  const newestCustomers = [...data.tenants]
    .sort((a, b) => b.onboardedAt.localeCompare(a.onboardedAt))
    .slice(0, 4)

  const [runwayMonths, setRunwayMonths] = useState(settings.runwayMonths)
  const [spendMonths, setSpendMonths] = useState(24)

  const runway = renewalRunway(data, runwayMonths, settings.renewalWindowDays)
  const costByCarrier = mrcByCarrier(data)
  const spend = spendUnderManagement(data, spendMonths)
  const ticketTrend = ticketsByMonth(data, 6)

  return (
    <PageContainer
      title="Platform overview"
      description="Every customer, site and service LynkBridge manages, and everything currently needing attention."
      actions={
        <LinkButton to="/admin/imports" variant="primary" icon={<Upload className="size-4" />}>
          Import data
        </LinkButton>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Customers"
          value={data.tenants.length}
          icon={<Building2 className="size-4" />}
          to="/admin/customers"
        />
        <StatCard
          label="Locations"
          value={formatNumber(data.locations.length)}
          icon={<MapPin className="size-4" />}
          to="/admin/locations"
        />
        <StatCard
          label="Services"
          value={formatNumber(data.services.length)}
          icon={<Network className="size-4" />}
          to="/admin/services"
        />
        <StatCard
          label="Circuits"
          value={formatNumber(data.circuits.length)}
          icon={<Cable className="size-4" />}
          to="/admin/circuits"
        />
        <StatCard
          label="Open tickets"
          value={open.length}
          tone={open.length ? 'warn' : 'default'}
          icon={<LifeBuoy className="size-4" />}
          to="/admin/tickets"
        />
        <StatCard
          label="Monthly service cost"
          value={formatCurrency(totalMrc(data.services))}
          hint="Across all customers"
          icon={<DollarSign className="size-4" />}
          to="/admin/services"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartFrame
          title="Renewal runway"
          description="Monthly cost reaching its contract end date, across all customers."
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
                  ? `/admin/contracts?renewal=${encodeURIComponent('Expiring Soon')}`
                  : '/admin/contracts'
                : undefined,
            }))}
            formatValue={formatCurrency}
            ariaLabel="Monthly cost reaching contract end date, month by month"
          />
        </ChartFrame>

        <ChartFrame
          title="Monthly cost by carrier"
          description="How platform-wide spend is distributed across providers."
          isEmpty={costByCarrier.length === 0}
          emptyTitle="No active services"
          emptyDescription="Carrier breakdown appears once services are active."
          footnote="Active services only. A single dominant provider is a concentration risk worth discussing."
          actions={
            <LinkButton to="/admin/carriers" size="sm">
              All carriers
            </LinkButton>
          }
        >
          <BarChart
            rows={costByCarrier.map((slice) => ({
              label: slice.label,
              value: slice.value,
              href: slice.suffix ? `/admin${slice.suffix}` : undefined,
            }))}
            formatValue={formatCurrency}
            ariaLabel="Monthly cost by carrier, largest first"
          />
        </ChartFrame>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <ChartFrame
          title="Spend under management"
          description="Monthly cost of active services across the platform, accumulated by install date."
          className="xl:col-span-2"
          isEmpty={spend.length < 2}
          emptyTitle="Not enough history yet"
          footnote="Services installed before the window form the opening balance, so the line starts from the existing estate rather than from zero."
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

        <ChartFrame
          title="Tickets raised"
          description="Support volume over the last six months."
          isEmpty={ticketTrend.every((month) => month.value === 0)}
          emptyTitle="No tickets raised"
          footnote="Counted by the date each ticket was created."
          actions={
            <LinkButton to="/admin/tickets" size="sm">
              All tickets
            </LinkButton>
          }
        >
          <ColumnChart
            rows={ticketTrend.map((month) => ({
              label: month.label,
              longLabel: month.longLabel,
              value: month.value,
              href: month.value ? '/admin/tickets' : undefined,
            }))}
            formatValue={(value) => `${value} ${value === 1 ? 'ticket' : 'tickets'}`}
            valueLabel="Tickets"
            ariaLabel="Tickets raised per month over the last six months"
          />
        </ChartFrame>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DetailCard
          title="Recent customers"
          description="Most recently onboarded accounts."
          actions={
            <LinkButton to="/admin/customers" size="sm">
              All customers
            </LinkButton>
          }
          flush
        >
          <DataTable
            rows={newestCustomers}
            rowKey={(row) => row.id}
            rowHref={(row) => `/admin/customers/${row.id}`}
            empty={<EmptyState dense title="No customers yet" />}
            columns={[
              {
                key: 'name',
                header: 'Customer',
                render: (row) => (
                  <div>
                    <p className="font-medium text-ink-900">{row.name}</p>
                    <p className="text-xs text-ink-500">{row.industry}</p>
                  </div>
                ),
              },
              {
                key: 'locations',
                header: 'Locations',
                align: 'right',
                hideBelow: 'sm',
                render: (row) => data.locations.filter((location) => location.tenantId === row.id).length,
              },
              {
                key: 'services',
                header: 'Services',
                align: 'right',
                hideBelow: 'sm',
                render: (row) => data.services.filter((service) => service.tenantId === row.id).length,
              },
              { key: 'onboarded', header: 'Since', hideBelow: 'md', render: (row) => formatDate(row.onboardedAt) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            ]}
          />
        </DetailCard>

        <DetailCard
          title="Upcoming renewals"
          description={`Contracts reaching their end date within ${settings.renewalWindowDays} days, across all customers.`}
          actions={
            <LinkButton to="/admin/contracts" size="sm">
              All contracts
            </LinkButton>
          }
          flush
        >
          <DataTable
            rows={renewals.slice(0, 6)}
            rowKey={(row) => row.id}
            rowHref={(row) => `/admin/contracts/${row.id}`}
            empty={
              <EmptyState
                dense
                icon={<CalendarClock className="size-5" />}
                title="No renewals in the next 90 days"
              />
            }
            columns={[
              {
                key: 'contract',
                header: 'Contract',
                render: (row) => (
                  <div>
                    <p className="font-medium text-ink-900">{row.contractNumber}</p>
                    <p className="text-xs text-ink-500">{getTenant(data, row.tenantId)?.name}</p>
                  </div>
                ),
              },
              {
                key: 'provider',
                header: 'Provider',
                hideBelow: 'lg',
                render: (row) => getCarrier(data, row.carrierId)?.name ?? '—',
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
          description="Most recently updated support requests across the platform."
          actions={
            <LinkButton to="/admin/tickets" size="sm">
              All tickets
            </LinkButton>
          }
          flush
        >
          <DataTable
            rows={recent}
            rowKey={(row) => row.id}
            rowHref={(row) => `/admin/tickets/${row.id}`}
            empty={<EmptyState dense icon={<LifeBuoy className="size-5" />} title="No support tickets found." />}
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
                key: 'customer',
                header: 'Customer',
                hideBelow: 'md',
                render: (row) => getTenant(data, row.tenantId)?.name ?? '—',
              },
              { key: 'priority', header: 'Priority', hideBelow: 'lg', render: (row) => <StatusBadge status={row.priority} /> },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            ]}
          />
        </DetailCard>

        <DetailCard
          title="Recent imports"
          description="The latest CSV and Excel loads."
          actions={
            <LinkButton to="/admin/imports" size="sm">
              Import data
            </LinkButton>
          }
          flush
        >
          <DataTable
            rows={data.imports.slice(0, 6)}
            rowKey={(row) => row.id}
            empty={<EmptyState dense icon={<Upload className="size-5" />} title="No imports have been run." />}
            columns={[
              {
                key: 'file',
                header: 'File',
                render: (row) => (
                  <div>
                    <p className="font-medium text-ink-900">{row.fileName}</p>
                    <p className="text-xs text-ink-500">
                      {row.entity} · {getTenant(data, row.tenantId)?.name ?? 'Platform-wide'}
                    </p>
                  </div>
                ),
              },
              { key: 'rows', header: 'Rows', align: 'right', hideBelow: 'sm', render: (row) => formatNumber(row.rowsDetected) },
              {
                key: 'issues',
                header: 'Issues',
                align: 'right',
                hideBelow: 'md',
                render: (row) =>
                  row.errors + row.warnings === 0 ? (
                    <span className="text-ink-400">None</span>
                  ) : (
                    <span>
                      {row.errors ? <span className="text-danger-600">{row.errors} errors</span> : null}
                      {row.errors && row.warnings ? ', ' : null}
                      {row.warnings ? <span className="text-warn-600">{row.warnings} warnings</span> : null}
                    </span>
                  ),
              },
              { key: 'runAt', header: 'Run', hideBelow: 'lg', render: (row) => formatDate(row.runAt) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            ]}
          />
        </DetailCard>
      </div>

      <ProtoNote label="About the numbers and charts on this dashboard">
        All customers, sites, services and figures are fictional. The KPI and chart selection is a prototype proposal
        — what LynkBridge staff actually need to monitor daily has not been defined. Monthly service cost sums the
        monthly recurring charge of active services across every tenant. Ticket volume over time, circuit health and
        import activity are further charts the data would support if they prove useful.
      </ProtoNote>
    </PageContainer>
  )
}
