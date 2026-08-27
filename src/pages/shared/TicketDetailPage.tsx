import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { MessageSquarePlus } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard, FieldGrid } from '@/components/ui/DetailCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Timeline } from '@/components/ui/Timeline'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Select, Textarea } from '@/components/forms/Fields'
import { usePortal } from '@/lib/usePortal'
import { formatDate } from '@/lib/format'
import { getLocation, getService, getTenant, getTicket } from '@/data/selectors'
import { useData } from '@/state/DataContext'
import { useToast } from '@/state/ToastContext'
import type { TicketStatus } from '@/data/types'
import { NotFoundRecord } from './NotFoundRecord'

const STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed']

export function TicketDetailPage() {
  const { id } = useParams()
  const routerLocation = useLocation()
  const { data, isAdmin, path, session } = usePortal()
  const { addTicketNote, setTicketStatus } = useData()
  const { notify } = useToast()

  const [note, setNote] = useState('')

  const ticket = getTicket(data, id)
  const justCreated = (routerLocation.state as { justCreated?: boolean } | null)?.justCreated

  if (!ticket) {
    return (
      <NotFoundRecord
        title="Ticket not found"
        description="This ticket does not exist, or it belongs to another customer."
        backTo={path('/tickets')}
        backLabel="Back to tickets"
      />
    )
  }

  const location = getLocation(data, ticket.locationId)
  const service = getService(data, ticket.serviceId)
  const tenant = getTenant(data, ticket.tenantId)

  const submitNote = () => {
    if (!note.trim()) return
    addTicketNote(ticket.id, session.name, note.trim())
    setNote('')
    notify({ tone: 'success', title: 'Note added to the ticket history' })
  }

  return (
    <PageContainer
      title={ticket.subject}
      description={`${ticket.number} · raised by ${ticket.requestedBy} on ${formatDate(ticket.createdAt)}`}
      breadcrumbs={[
        { label: isAdmin ? 'Admin' : 'Portal', to: path('/dashboard') },
        { label: 'Tickets', to: path('/tickets') },
        { label: ticket.number },
      ]}
      meta={
        <>
          <StatusBadge status={ticket.status} />
          <StatusBadge status={ticket.priority} />
          <span className="text-xs text-ink-500">Updated {formatDate(ticket.updatedAt)}</span>
          {isAdmin && tenant ? <span className="text-xs text-ink-500">· {tenant.name}</span> : null}
        </>
      }
    >
      {justCreated ? (
        <Alert tone="success" title={`Ticket ${ticket.number} created`}>
          Your ticket has been recorded in this prototype session. In the real product this is where confirmation and
          any notification would be issued.
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <DetailCard title="Description">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{ticket.description}</p>
          </DetailCard>

          <DetailCard
            title="History"
            description="Every recorded change on this ticket, oldest first."
          >
            <Timeline entries={ticket.history} />

            <div className="mt-5 border-t border-ink-200 pt-4">
              <Textarea
                label="Add a note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add an update for the record…"
              />
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={submitNote}
                  disabled={!note.trim()}
                  icon={<MessageSquarePlus className="size-4" />}
                >
                  Add note
                </Button>
              </div>
            </div>
          </DetailCard>
        </div>

        <div className="space-y-5">
          <DetailCard title="Ticket information">
            <FieldGrid
              columns={2}
              fields={[
                { label: 'Ticket number', value: ticket.number },
                { label: 'Status', value: <StatusBadge status={ticket.status} /> },
                { label: 'Priority', value: <StatusBadge status={ticket.priority} /> },
                { label: 'Raised by', value: ticket.requestedBy },
                ...(isAdmin && tenant
                  ? [{ label: 'Customer', value: tenant.name, to: `/admin/customers/${tenant.id}` }]
                  : []),
                {
                  label: 'Location',
                  value: location?.name ?? '—',
                  to: location ? path(`/locations/${location.id}`) : undefined,
                },
                {
                  label: 'Service',
                  value: service?.name ?? 'Not service-specific',
                  to: service ? path(`/services/${service.id}`) : undefined,
                },
                { label: 'Created', value: formatDate(ticket.createdAt) },
                { label: 'Last updated', value: formatDate(ticket.updatedAt) },
              ]}
            />
          </DetailCard>

          {isAdmin ? (
            <DetailCard title="Update status" description="Changes are recorded in this session only.">
              <Select
                label="Status"
                value={ticket.status}
                onChange={(event) => {
                  setTicketStatus(ticket.id, event.target.value as TicketStatus, session.name)
                  notify({ tone: 'success', title: `Status set to ${event.target.value}` })
                }}
                options={STATUSES.map((value) => ({ value, label: value }))}
                hint="Prototype statuses — no workflow rules are enforced."
              />
            </DetailCard>
          ) : null}
        </div>
      </div>
    </PageContainer>
  )
}
