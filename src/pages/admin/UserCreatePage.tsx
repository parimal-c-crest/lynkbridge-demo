import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard } from '@/components/ui/DetailCard'
import { Button, LinkButton } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { Select, TextInput } from '@/components/forms/Fields'
import { usePortal } from '@/lib/usePortal'
import { useData } from '@/state/DataContext'
import { useToast } from '@/state/ToastContext'
import { CUSTOMER_TITLES } from '@/data/catalog'
import type { UserRole, UserStatus } from '@/data/types'

const ROLES: UserRole[] = ['Customer User', 'LynkBridge Admin']
const STATUSES: UserStatus[] = ['Invited', 'Active', 'Disabled']

/**
 * Create User — admin only.
 *
 * The role decides the tenancy: LynkBridge staff are not scoped to a tenant,
 * so choosing that role removes the customer field entirely rather than
 * leaving a value that would contradict `User.tenantId`.
 */
export function UserCreatePage() {
  const { data, path } = usePortal()
  const { createUser } = useData()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [role, setRole] = useState<UserRole>('Customer User')
  const [tenantId, setTenantId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<UserStatus>('Invited')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const isStaff = role === 'LynkBridge Admin'

  const submit = (event: FormEvent) => {
    event.preventDefault()

    const nextErrors: Record<string, string> = {}
    if (!isStaff && !tenantId) nextErrors.tenant = 'Select the customer this person works for.'
    if (!name.trim()) nextErrors.name = 'Enter the person’s name.'
    if (!email.trim()) nextErrors.email = 'Enter a work email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      nextErrors.email = 'That does not look like an email address.'
    else if (data.users.some((user) => user.email.toLowerCase() === email.trim().toLowerCase()))
      nextErrors.email = 'Someone already has that email address.'
    if (!title.trim()) nextErrors.title = 'Enter a job title.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)

    // Short delay so the submit reads as a real action rather than an instant jump.
    window.setTimeout(() => {
      const user = createUser({
        tenantId: isStaff ? null : tenantId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        title: title.trim(),
        status,
      })

      setSubmitting(false)
      notify({
        tone: 'success',
        title: `${user.name} added`,
        description: 'Stored in this browser session only — no invitation is sent.',
      })
      navigate(`/admin/users/${user.id}`, { state: { justCreated: true } })
    }, 400)
  }

  return (
    <PageContainer
      title="Add a user"
      description="Give someone access to the portal, either as LynkBridge staff or on behalf of a customer."
      breadcrumbs={[
        { label: 'Admin', to: path('/dashboard') },
        { label: 'Users & roles', to: '/admin/users' },
        { label: 'New user' },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={submit} className="lg:col-span-2" noValidate>
          <DetailCard title="Access">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Role"
                  required
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  options={ROLES.map((value) => ({ value, label: value }))}
                  hint="Only these two roles exist — no permission matrix has been defined."
                />

                {isStaff ? (
                  <TextInput label="Customer" value="LynkBridge — platform staff" readOnly disabled hint="Staff are not scoped to a customer." />
                ) : (
                  <Select
                    label="Customer"
                    required
                    value={tenantId}
                    onChange={(event) => setTenantId(event.target.value)}
                    options={data.tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
                    placeholder="Select a customer"
                    error={errors.tenant}
                  />
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Full name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Dana Whitfield"
                  error={errors.name}
                />
                <TextInput
                  label="Work email"
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="dana.whitfield@example.com"
                  hint="Doubles as the sign-in identifier."
                  error={errors.email}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Job title"
                  required
                  list="known-titles"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="IT Director"
                  error={errors.title}
                />
                <datalist id="known-titles">
                  {CUSTOMER_TITLES.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>

                <Select
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as UserStatus)}
                  options={STATUSES.map((value) => ({ value, label: value }))}
                  hint="Invited until the person signs in for the first time."
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="submit" disabled={submitting} icon={submitting ? undefined : <Plus className="size-4" />}>
                  {submitting ? 'Saving…' : 'Add user'}
                </Button>
                <LinkButton to="/admin/users" variant="secondary">
                  Cancel
                </LinkButton>
              </div>
            </div>
          </DetailCard>
        </form>

        <div className="space-y-4">
          <Alert tone="info" title="No invitation is sent">
            <p className="leading-relaxed">
              The person is added to this browser session and opens immediately. No email goes out, no password is set,
              and a page refresh clears the record.
            </p>
          </Alert>

          <ProtoNote label="Invitation and permissions are undefined" defaultOpen>
            The form records who someone is and which company they belong to, because every other screen needs that.
            How access is actually granted — invitation email, SSO, temporary password — has not been discussed, and
            no permissions beyond the two roles are offered. A created user defaults to Invited and has never signed
            in.
          </ProtoNote>
        </div>
      </div>
    </PageContainer>
  )
}
