import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { CollectionTable } from '@/components/data/CollectionTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LinkButton } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { useCollection } from '@/lib/useCollection'
import { usePortal } from '@/lib/usePortal'
import { formatDate } from '@/lib/format'
import {
  getLocation,
  getService,
  getTenant,
  openTickets,
  ticketMatrix,
  ticketsByPriority,
} from '@/data/selectors'
import { ChartFrame } from '@/components/charts/ChartFrame'
import { StackedStrip } from '@/components/charts/StackedStrip'
import { Heatmap } from '@/components/charts/Heatmap'
import type { Column } from '@/components/data/DataTable'
import type { Ticket } from '@/data/types'

const STATUSES = ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed']
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low']

export function TicketsListPage() {
  const { data, isAdmin, path } = usePortal()

  const collection = useCollection<Ticket>({
    rows: data.tickets,
    searchText: (row) =>
      [
        row.number,
        row.subject,
        row.description,
        row.requestedBy,
        getLocation(data, row.locationId)?.name,
        getService(data, row.serviceId)?.name,
        getTenant(data, row.tenantId)?.name,
      ]
        .filter(Boolean)
        .join(' '),
    filters: [
      { key: 'status', label: 'Statuses', options: STATUSES, value: (row) => row.status },
      { key: 'priority', label: 'Priorities', options: PRIORITIES, value: (row) => row.priority },
      ...(isAdmin
        ? [
            {
              key: 'customer',
              label: 'Customers',
              value: (row: Ticket) => getTenant(data, row.tenantId)?.name ?? '—',
            },
          ]
        : []),
    ],
    sorts: [
      { key: 'updated', label: 'Recently updated', compare: (a, b) => b.updatedAt.localeCompare(a.updatedAt) },
      { key: 'created', label: 'Newest first', compare: (a, b) => b.createdAt.localeCompare(a.createdAt) },
      {
        key: 'priority',
        label: 'Highest priority',
        compare: (a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority),
      },
    ],
    defaultSortKey: 'updated',
  })

  const open = openTickets(data.tickets)
  const critical = open.filter((ticket) => ticket.priority === 'Critical' || ticket.priority === 'High')

  const columns: Column<Ticket>[] = [
    {
      key: 'number',
      header: 'Ticket #',
      render: (row) => <span className="font-mono text-xs font-medium text-ink-900">{row.number}</span>,
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => <span className="font-medium text-ink-900">{row.subject}</span>,
    },
    ...(isAdmin
      ? [
          {
            key: 'customer',
            header: 'Customer',
            hideBelow: 'lg' as const,
            render: (row: Ticket) => getTenant(data, row.tenantId)?.name ?? '—',
          },
        ]
      : []),
    {
      key: 'location',
      header: 'Location',
      hideBelow: 'xl',
      render: (row) => getLocation(data, row.locationId)?.name ?? '—',
    },
    {
      key: 'service',
      header: 'Service',
      hideBelow: 'xl',
      render: (row) => getService(data, row.serviceId)?.name ?? <span className="text-ink-400">—</span>,
    },
    { key: 'priority', header: 'Priority', hideBelow: 'sm', render: (row) => <StatusBadge status={row.priority} /> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'updated', header: 'Updated', hideBelow: 'md', render: (row) => formatDate(row.updatedAt) },
  ]

  return (
    <PageContainer
      title="Support tickets"
      description={
        isAdmin
          ? 'Every ticket raised across all customers.'
          : 'Requests and issues raised by your organisation, with their current status.'
      }
      actions={
        <LinkButton to={path('/tickets/new')} variant="primary" icon={<Plus className="size-4" />}>
          Create ticket
        </LinkButton>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open tickets" value={open.length} tone={open.length ? 'warn' : 'default'} />
        <StatCard label="High / critical" value={critical.length} tone={critical.length ? 'danger' : 'default'} />
        <StatCard label="All tickets" value={data.tickets.length} />
        <StatCard
          label="Resolved"
          value={data.tickets.filter((ticket) => ticket.status === 'Resolved' || ticket.status === 'Closed').length}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartFrame
          title="Tickets by priority"
          description="The whole book of work by urgency. Select a band to filter the list below."
          isEmpty={data.tickets.length === 0}
          emptyTitle="No support tickets found."
          footnote="Priorities are prototype vocabulary — no response target or SLA is implied by any of them."
        >
          <StackedStrip
            slices={ticketsByPriority(data)}
            hrefFor={(slice) => `${path('/tickets')}?priority=${encodeURIComponent(slice.filterValue)}`}
            ariaLabel="Tickets by priority"
          />
        </ChartFrame>

        <ChartFrame
          title="Where the load sits"
          description="Tickets by status and priority. Select a cell to filter the list below."
          isEmpty={data.tickets.length === 0}
          emptyTitle="No support tickets found."
          footnote="Darker cells hold more tickets. Counts are printed, so the shading only reinforces them."
        >
          <Heatmap
            {...ticketMatrix(data)}
            hrefFor={(cell) =>
              `${path('/tickets')}?status=${encodeURIComponent(cell.row)}&priority=${encodeURIComponent(cell.column)}`
            }
            ariaLabel="Ticket counts by status and priority"
          />
        </ChartFrame>
      </div>

      <CollectionTable
        collection={collection}
        columns={columns}
        rowKey={(row) => row.id}
        rowHref={(row) => path(`/tickets/${row.id}`)}
        filters={[
          { key: 'status', label: 'Statuses' },
          { key: 'priority', label: 'Priorities' },
          ...(isAdmin ? [{ key: 'customer', label: 'Customers' }] : []),
        ]}
        sorts={[
          { key: 'updated', label: 'Recently updated' },
          { key: 'created', label: 'Newest first' },
          { key: 'priority', label: 'Highest priority' },
        ]}
        searchPlaceholder="Search tickets by number, subject or location…"
        noun="tickets"
        emptyTitle="No support tickets found."
        emptyDescription="Tickets raised through the portal will appear here."
        emptyAction={
          <LinkButton to={path('/tickets/new')} variant="primary" icon={<Plus className="size-4" />}>
            Create ticket
          </LinkButton>
        }
      />

      <ProtoNote label="Ticket workflow is not confirmed">
        The statuses and priorities used here are placeholders chosen to make the workflow demonstrable. Assignment,
        escalation, response targets and SLA rules were not defined in the discussion and are deliberately absent.
      </ProtoNote>
    </PageContainer>
  )
}
