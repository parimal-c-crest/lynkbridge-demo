import { Plus } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { CollectionTable } from '@/components/data/CollectionTable'
import { DetailCard, FieldGrid } from '@/components/ui/DetailCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LinkButton } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { useCollection } from '@/lib/useCollection'
import { usePortal } from '@/lib/usePortal'
import { formatRelative } from '@/lib/format'
import { getTenant, getUser } from '@/data/selectors'
import { NotFoundRecord } from '@/pages/shared/NotFoundRecord'
import type { Column } from '@/components/data/DataTable'
import type { User } from '@/data/types'

export function UsersListPage() {
  const { data } = usePortal()

  const companyOf = (user: User) => getTenant(data, user.tenantId)?.name ?? 'LynkBridge'

  const collection = useCollection<User>({
    rows: data.users,
    searchText: (row) => [row.name, row.email, row.title, row.role, companyOf(row)].join(' '),
    filters: [
      { key: 'role', label: 'Roles', value: (row) => row.role },
      { key: 'status', label: 'Statuses', value: (row) => row.status },
      { key: 'company', label: 'Companies', value: companyOf },
    ],
    sorts: [
      { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
      {
        key: 'recent',
        label: 'Recently active',
        compare: (a, b) => (b.lastLoginAt ?? '').localeCompare(a.lastLoginAt ?? ''),
      },
    ],
    defaultSortKey: 'name',
  })

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.name}</p>
          <p className="text-xs text-ink-500">{row.title}</p>
        </div>
      ),
    },
    { key: 'email', header: 'Email', hideBelow: 'md', render: (row) => row.email },
    { key: 'company', header: 'Company', render: (row) => companyOf(row) },
    { key: 'role', header: 'Role', hideBelow: 'sm', render: (row) => row.role },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'lastLogin', header: 'Last Login', hideBelow: 'lg', render: (row) => formatRelative(row.lastLoginAt) },
  ]

  return (
    <PageContainer
      title="Users & roles"
      description="Everyone with access to the platform, across LynkBridge and its customers."
      actions={
        <LinkButton to="/admin/users/new" variant="primary" icon={<Plus className="size-4" />}>
          Add user
        </LinkButton>
      }
    >
      <CollectionTable
        collection={collection}
        columns={columns}
        rowKey={(row) => row.id}
        rowHref={(row) => `/admin/users/${row.id}`}
        filters={[
          { key: 'role', label: 'Roles' },
          { key: 'status', label: 'Statuses' },
          { key: 'company', label: 'Companies' },
        ]}
        sorts={[
          { key: 'name', label: 'Name (A–Z)' },
          { key: 'recent', label: 'Recently active' },
        ]}
        searchPlaceholder="Search people by name, email or company…"
        noun="users"
        emptyTitle="No users recorded"
      />

      <ProtoNote label="Only two roles exist here — deliberately">
        The discussion confirmed a LynkBridge administrator and a customer user, and nothing more. No permission
        matrix has been invented. Whether customers need multiple internal roles, and what each role may do, is an
        open question for discovery.
      </ProtoNote>
    </PageContainer>
  )
}

export function UserDetailPage() {
  const { id } = useParams()
  const { data } = usePortal()

  const user = getUser(data, id)

  if (!user) {
    return (
      <NotFoundRecord
        title="User not found"
        description="No user exists with that identifier."
        backTo="/admin/users"
        backLabel="Back to users"
      />
    )
  }

  const tenant = getTenant(data, user.tenantId)

  return (
    <PageContainer
      title={user.name}
      description={user.title}
      breadcrumbs={[
        { label: 'Admin', to: '/admin/dashboard' },
        { label: 'Users & roles', to: '/admin/users' },
        { label: user.name },
      ]}
      meta={
        <>
          <StatusBadge status={user.status} />
          <span className="text-xs text-ink-500">{user.role}</span>
        </>
      }
    >
      <DetailCard title="User details">
        <FieldGrid
          fields={[
            { label: 'Name', value: user.name },
            { label: 'Email', value: user.email },
            { label: 'Job title', value: user.title },
            { label: 'Role', value: user.role },
            {
              label: 'Company',
              value: tenant?.name ?? 'LynkBridge',
              to: tenant ? `/admin/customers/${tenant.id}` : undefined,
            },
            { label: 'Status', value: <StatusBadge status={user.status} /> },
            { label: 'Last sign-in', value: formatRelative(user.lastLoginAt) },
          ]}
        />
      </DetailCard>

      <Alert tone="info" title="Editing a user is not implemented">
        A user can be added from the list screen, but editing, disabling and permission assignment are out of scope for
        this prototype. Nor is any invitation actually sent. What a LynkBridge administrator may change about a
        customer user has not been defined.
      </Alert>
    </PageContainer>
  )
}
