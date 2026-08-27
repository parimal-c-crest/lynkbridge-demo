import { RotateCcw } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard, FieldGrid } from '@/components/ui/DetailCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { Select } from '@/components/forms/Fields'
import { Toggle } from '@/components/forms/Toggle'
import { usePortal } from '@/lib/usePortal'
import { formatDate } from '@/lib/format'
import { getTenant, getUser } from '@/data/selectors'
import { DOCUMENT_TYPES, SERVICE_TYPES } from '@/data/types'
import { useSettings } from '@/state/SettingsContext'
import { useToast } from '@/state/ToastContext'

const TICKET_STATUSES = ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed']
const TICKET_PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
const CIRCUIT_STATES = ['Active', 'Provisioning', 'Degraded', 'Disconnected']

/**
 * Settings, for both roles.
 *
 * Admins get the platform-wide configuration; customers get the subset that
 * affects their own portal, plus their organisation's details read-only. The
 * screen separates settings that genuinely drive the product from ones that are
 * placeholders, and says which is which rather than letting a client assume.
 */
export function SettingsPage() {
  const { data, isAdmin, session } = usePortal()
  const { settings, update, reset, isModified } = useSettings()
  const { notify } = useToast()

  const tenant = getTenant(data, session.tenantId)
  const user = getUser(data, session.userId)

  return (
    <PageContainer
      title="Settings"
      description={
        isAdmin
          ? 'Platform configuration, reference vocabulary and notification preferences.'
          : 'How your portal behaves, and the preferences held against your account.'
      }
      actions={
        isModified ? (
          <Button
            variant="secondary"
            icon={<RotateCcw className="size-4" />}
            onClick={() => {
              reset()
              notify({ tone: 'info', title: 'Settings restored to defaults' })
            }}
          >
            Restore defaults
          </Button>
        ) : null
      }
    >
      <Alert tone="info" title="These settings are live, but not saved">
        <p className="leading-relaxed">
          The controls marked as active genuinely change what the portal shows — adjust the renewal window and every
          badge, filter and chart moves with it. Nothing persists: a refresh restores the defaults, because this
          prototype has no backend to store preferences in.
        </p>
      </Alert>

      <div className="grid gap-5 xl:grid-cols-2">
        <DetailCard
          title="Portal behaviour"
          description="Settings that change what you see across the product."
        >
          <div className="space-y-4">
            <Select
              label="Contract renewal notice window"
              value={String(settings.renewalWindowDays)}
              onChange={(event) => update('renewalWindowDays', Number(event.target.value))}
              options={[30, 45, 60, 90, 120, 180].map((days) => ({
                value: String(days),
                label: `${days} days`,
              }))}
              hint="Contracts inside this window read as Expiring Soon on every screen, chart and filter."
            />

            <Select
              label="Rows per page"
              value={String(settings.pageSize)}
              onChange={(event) => update('pageSize', Number(event.target.value))}
              options={[10, 25, 50, 100].map((size) => ({ value: String(size), label: `${size} rows` }))}
              hint="Applies to every list screen in the portal."
            />

            <Select
              label="Default renewal runway range"
              value={String(settings.runwayMonths)}
              onChange={(event) => update('runwayMonths', Number(event.target.value))}
              options={[6, 12, 24].map((months) => ({ value: String(months), label: `${months} months` }))}
              hint="The window the dashboard runway chart opens on."
            />
          </div>
        </DetailCard>

        <DetailCard
          title="Notifications"
          description="What LynkBridge would tell you about, and when."
        >
          <div className="divide-y divide-ink-100">
            <Toggle
              inert
              label="Contract renewal reminders"
              description="Ahead of each contract reaching its notice window."
              checked={settings.notifyRenewals}
              onChange={(value) => update('notifyRenewals', value)}
            />
            <Toggle
              inert
              label="Ticket updates"
              description="When a ticket you raised changes status or receives a note."
              checked={settings.notifyTicketUpdates}
              onChange={(value) => update('notifyTicketUpdates', value)}
            />
            <Toggle
              inert
              label="Service disruption alerts"
              description="Depends on network monitoring, which is a future roadmap item."
              checked={settings.notifyOutages}
              onChange={(value) => update('notifyOutages', value)}
            />
            <Toggle
              inert
              label="Weekly summary"
              description="A digest of estate changes, renewals and open tickets."
              checked={settings.notifyWeeklyDigest}
              onChange={(value) => update('notifyWeeklyDigest', value)}
            />
          </div>

          <Alert tone="warning" className="mt-4">
            No notification system exists in this prototype. These switches record a preference and nothing more —
            notifications are on the future roadmap.
          </Alert>
        </DetailCard>
      </div>

      {isAdmin ? (
        <DetailCard
          title="Reference vocabulary"
          description="The value sets the platform recognises today."
        >
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <VocabularyList title="Service types" values={[...SERVICE_TYPES]} confirmed />
            <VocabularyList title="Document categories" values={[...DOCUMENT_TYPES]} />
            <VocabularyList title="Ticket statuses" values={TICKET_STATUSES} />
            <VocabularyList title="Ticket priorities" values={TICKET_PRIORITIES} />
            <VocabularyList title="Circuit states" values={CIRCUIT_STATES} />
            <VocabularyList title="Roles" values={['LynkBridge Admin', 'Customer User']} confirmed />
          </div>

          <ProtoNote label="Why these are read-only" defaultOpen>
            Only the service types and the two roles came from the client discussion. Everything else is placeholder
            vocabulary this prototype invented to make screens work. Making these editable would imply the taxonomy is
            settled — it is not, and defining it is a discovery question.
          </ProtoNote>
        </DetailCard>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <DetailCard title="Account">
          <FieldGrid
            columns={2}
            fields={[
              { label: 'Name', value: session.name },
              { label: 'Email', value: session.email },
              { label: 'Role', value: session.role },
              { label: 'Job title', value: user?.title ?? '—' },
              { label: 'Account status', value: user ? <StatusBadge status={user.status} /> : '—' },
              ...(isAdmin
                ? []
                : [
                    { label: 'Organisation', value: session.tenantName ?? '—' },
                    { label: 'Customer since', value: formatDate(tenant?.onboardedAt) },
                  ]),
            ]}
          />
          <Alert tone="info" className="mt-4">
            Editing your details, changing a password and managing sign-in security are not implemented. What a user
            may change about their own account has not been defined.
          </Alert>
        </DetailCard>

        <DetailCard
          title={isAdmin ? 'Platform' : 'Organisation'}
          description={isAdmin ? 'Environment this prototype is running as.' : 'Held by LynkBridge about your company.'}
        >
          {isAdmin ? (
            <FieldGrid
              columns={2}
              fields={[
                { label: 'Environment', value: 'Prototype' },
                { label: 'Customers', value: data.tenants.length },
                { label: 'Portal users', value: data.users.length },
                { label: 'Carriers', value: data.carriers.length },
                { label: 'Data source', value: 'Generated mock records' },
                { label: 'Persistence', value: 'None — resets on refresh' },
                { label: 'Users & roles', value: 'Manage users', to: '/admin/users' },
                { label: 'Imports', value: 'Import data', to: '/admin/imports' },
              ]}
            />
          ) : (
            <FieldGrid
              columns={2}
              fields={[
                { label: 'Company', value: tenant?.name ?? '—' },
                { label: 'Industry', value: tenant?.industry ?? '—' },
                { label: 'Head office', value: tenant ? `${tenant.hqCity}, ${tenant.hqState}` : '—' },
                { label: 'Primary contact', value: tenant?.primaryContact ?? '—' },
                { label: 'Contact email', value: tenant?.primaryEmail ?? '—' },
                { label: 'Phone', value: tenant?.phone ?? '—' },
                { label: 'Status', value: tenant ? <StatusBadge status={tenant.status} /> : '—' },
                // Profile is a customer-only screen, so this is pinned rather than built
                // from the role prefix — /admin/profile does not exist.
                { label: 'People with access', value: 'View profile', to: '/customer/profile' },
              ]}
            />
          )}
        </DetailCard>
      </div>

      <ProtoNote label="Settings was not in the build specification">
        This module was added on request. The split between platform settings, portal preferences and account details
        is a proposal — who may change each setting, whether preferences are per-user or per-organisation, and which
        of these belong to LynkBridge rather than the customer are all undefined.
      </ProtoNote>
    </PageContainer>
  )
}

function VocabularyList({ title, values, confirmed }: { title: string; values: string[]; confirmed?: boolean }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
        {title}
        {confirmed ? (
          <span className="rounded bg-ok-50 px-1.5 py-0.5 text-[10px] font-medium normal-case text-ok-700 ring-1 ring-inset ring-ok-200">
            Confirmed
          </span>
        ) : (
          <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium normal-case text-ink-500 ring-1 ring-inset ring-ink-200">
            Placeholder
          </span>
        )}
      </p>
      <ul className="mt-2 space-y-1">
        {values.map((value) => (
          <li key={value} className="text-sm text-ink-700">
            {value}
          </li>
        ))}
      </ul>
    </div>
  )
}
