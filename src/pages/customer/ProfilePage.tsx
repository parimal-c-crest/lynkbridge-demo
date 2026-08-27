import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard, FieldGrid } from '@/components/ui/DetailCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable } from '@/components/data/DataTable'
import { Alert } from '@/components/ui/Alert'
import { usePortal } from '@/lib/usePortal'
import { formatDate, formatRelative } from '@/lib/format'
import { getTenant, getUser, usersForTenant } from '@/data/selectors'

export function ProfilePage() {
  const { data, session } = usePortal()

  const user = getUser(data, session.userId)
  const tenant = getTenant(data, session.tenantId)
  const colleagues = tenant ? usersForTenant(data, tenant.id) : []

  return (
    <PageContainer
      title="Profile"
      description="Your account details and the other people from your organisation with portal access."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <DetailCard title="Your details" className="lg:col-span-2">
          <FieldGrid
            columns={2}
            fields={[
              { label: 'Name', value: session.name },
              { label: 'Email', value: session.email },
              { label: 'Role', value: session.role },
              { label: 'Job title', value: user?.title ?? '—' },
              { label: 'Organisation', value: session.tenantName ?? '—' },
              { label: 'Account status', value: user ? <StatusBadge status={user.status} /> : '—' },
              { label: 'Last sign-in', value: formatRelative(user?.lastLoginAt) },
            ]}
          />
        </DetailCard>

        <DetailCard title="Organisation">
          <FieldGrid
            columns={2}
            fields={[
              { label: 'Company', value: tenant?.name ?? '—' },
              { label: 'Industry', value: tenant?.industry ?? '—' },
              { label: 'Head office', value: tenant ? `${tenant.hqCity}, ${tenant.hqState}` : '—' },
              { label: 'Primary contact', value: tenant?.primaryContact ?? '—' },
              { label: 'Contact email', value: tenant?.primaryEmail ?? '—' },
              { label: 'Phone', value: tenant?.phone ?? '—' },
              { label: 'Customer since', value: formatDate(tenant?.onboardedAt) },
            ]}
          />
        </DetailCard>
      </div>

      <DetailCard
        title="People at your organisation"
        description="Colleagues with access to this portal."
        flush
      >
        <DataTable
          rows={colleagues}
          rowKey={(row) => row.id}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (row) => (
                <div>
                  <p className="font-medium text-ink-900">
                    {row.name}
                    {row.id === session.userId ? <span className="ml-2 text-xs text-brand-600">You</span> : null}
                  </p>
                  <p className="text-xs text-ink-500">{row.title}</p>
                </div>
              ),
            },
            { key: 'email', header: 'Email', hideBelow: 'md', render: (row) => row.email },
            { key: 'role', header: 'Role', hideBelow: 'sm', render: (row) => row.role },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            {
              key: 'lastLogin',
              header: 'Last sign-in',
              hideBelow: 'lg',
              render: (row) => formatRelative(row.lastLoginAt),
            },
          ]}
        />
      </DetailCard>

      <Alert tone="info" title="Account management is not implemented">
        <p className="leading-relaxed">
          Editing your details, changing a password, inviting colleagues and managing permissions are all out of scope
          for this prototype. Exactly what a customer user may do for themselves is one of the open questions for
          discovery.
        </p>
      </Alert>
    </PageContainer>
  )
}
