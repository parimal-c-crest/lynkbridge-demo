import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard } from '@/components/ui/DetailCard'
import { Button, LinkButton } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { DatePicker, Select, TextInput } from '@/components/forms/Fields'
import { usePortal } from '@/lib/usePortal'
import { useData } from '@/state/DataContext'
import { useToast } from '@/state/ToastContext'
import { PROTOTYPE_TODAY } from '@/data/dataset'
import type { TenantStatus } from '@/data/types'

const STATUSES: TenantStatus[] = ['Active', 'Onboarding', 'Suspended']
const today = PROTOTYPE_TODAY.toISOString().slice(0, 10)

/** First three letters of the name, which is how the seeded codes read. */
function deriveCode(name: string) {
  return name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
}

/**
 * Create Customer — admin only.
 *
 * A tenant is the root of every other record, so this screen has no customer
 * picker: it is the thing being made. The short code is shown rather than
 * generated silently, because it appears inside circuit IDs and account
 * numbers that people read back to carriers.
 */
export function CustomerCreatePage() {
  const { data, path } = usePortal()
  const { createTenant } = useData()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeTouched, setCodeTouched] = useState(false)
  const [industry, setIndustry] = useState('')
  const [status, setStatus] = useState<TenantStatus>('Onboarding')
  const [onboardedAt, setOnboardedAt] = useState(today)
  const [primaryContact, setPrimaryContact] = useState('')
  const [primaryEmail, setPrimaryEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [hqCity, setHqCity] = useState('')
  const [hqState, setHqState] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Industries seen so far, offered as suggestions. Tenant.industry is free
  // text — no taxonomy has been confirmed, so this must not become a fixed list.
  const knownIndustries = Array.from(new Set(data.tenants.map((tenant) => tenant.industry))).sort()

  const changeName = (value: string) => {
    setName(value)
    if (!codeTouched) setCode(deriveCode(value))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()

    const nextErrors: Record<string, string> = {}
    if (!name.trim()) nextErrors.name = 'Enter the company name.'
    if (!code.trim()) nextErrors.code = 'A short code is required — it appears in circuit IDs.'
    else if (data.tenants.some((tenant) => tenant.code.toUpperCase() === code.trim().toUpperCase()))
      nextErrors.code = 'Another customer already uses that code.'
    if (!industry.trim()) nextErrors.industry = 'Enter the industry.'
    if (!primaryContact.trim()) nextErrors.primaryContact = 'Name the person LynkBridge deals with.'
    if (!primaryEmail.trim()) nextErrors.primaryEmail = 'Enter a contact email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryEmail.trim()))
      nextErrors.primaryEmail = 'That does not look like an email address.'
    if (!hqCity.trim()) nextErrors.hqCity = 'Enter the head office city.'
    if (!hqState.trim()) nextErrors.hqState = 'Enter the two-letter state code.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)

    // Short delay so the submit reads as a real action rather than an instant jump.
    window.setTimeout(() => {
      const tenant = createTenant({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        industry: industry.trim(),
        status,
        onboardedAt,
        primaryContact: primaryContact.trim(),
        primaryEmail: primaryEmail.trim(),
        phone: phone.trim(),
        hqCity: hqCity.trim(),
        hqState: hqState.trim().toUpperCase(),
      })

      setSubmitting(false)
      notify({
        tone: 'success',
        title: `${tenant.name} added`,
        description: 'Stored in this browser session only — a refresh restores the seed data.',
      })
      navigate(`/admin/customers/${tenant.id}`, { state: { justCreated: true } })
    }, 400)
  }

  return (
    <PageContainer
      title="Add a customer"
      description="Register a company so its locations, services and contracts can be recorded against it."
      breadcrumbs={[
        { label: 'Admin', to: path('/dashboard') },
        { label: 'Customers', to: '/admin/customers' },
        { label: 'New customer' },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={submit} className="lg:col-span-2" noValidate>
          <DetailCard title="Company">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <TextInput
                  label="Company name"
                  required
                  className="sm:col-span-2"
                  value={name}
                  onChange={(event) => changeName(event.target.value)}
                  placeholder="e.g. Northwind Manufacturing"
                  error={errors.name}
                />
                <TextInput
                  label="Short code"
                  required
                  value={code}
                  maxLength={4}
                  onChange={(event) => {
                    setCodeTouched(true)
                    setCode(event.target.value.toUpperCase())
                  }}
                  placeholder="NOR"
                  hint="Used inside circuit IDs and account numbers."
                  error={errors.code}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Industry"
                  required
                  list="known-industries"
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  placeholder="e.g. Logistics & Distribution"
                  hint="Free text — no industry taxonomy has been confirmed."
                  error={errors.industry}
                />
                <datalist id="known-industries">
                  {knownIndustries.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>

                <Select
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as TenantStatus)}
                  options={STATUSES.map((value) => ({ value, label: value }))}
                  hint="A new company usually starts as Onboarding."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <TextInput
                  label="Head office city"
                  required
                  className="sm:col-span-2"
                  value={hqCity}
                  onChange={(event) => setHqCity(event.target.value)}
                  placeholder="Denver"
                  error={errors.hqCity}
                />
                <TextInput
                  label="State"
                  required
                  value={hqState}
                  maxLength={2}
                  onChange={(event) => setHqState(event.target.value.toUpperCase())}
                  placeholder="CO"
                  error={errors.hqState}
                />
              </div>

              <DatePicker
                label="Customer since"
                value={onboardedAt}
                onChange={(event) => setOnboardedAt(event.target.value)}
                hint="When the relationship started."
              />
            </div>
          </DetailCard>

          <div className="mt-5">
            <DetailCard title="Primary contact">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput
                    label="Contact name"
                    required
                    value={primaryContact}
                    onChange={(event) => setPrimaryContact(event.target.value)}
                    placeholder="Dana Whitfield"
                    error={errors.primaryContact}
                  />
                  <TextInput
                    label="Contact email"
                    required
                    type="email"
                    value={primaryEmail}
                    onChange={(event) => setPrimaryEmail(event.target.value)}
                    placeholder="dana.whitfield@example.com"
                    error={errors.primaryEmail}
                  />
                </div>

                <TextInput
                  label="Phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(303) 555-0142"
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button type="submit" disabled={submitting} icon={submitting ? undefined : <Plus className="size-4" />}>
                    {submitting ? 'Saving…' : 'Add customer'}
                  </Button>
                  <LinkButton to="/admin/customers" variant="secondary">
                    Cancel
                  </LinkButton>
                </div>
              </div>
            </DetailCard>
          </div>
        </form>

        <div className="space-y-4">
          <Alert tone="info" title="What happens on save">
            <p className="leading-relaxed">
              The customer is added to this browser session and opens immediately. No account is provisioned, nothing is
              sent anywhere, and a page refresh clears it.
            </p>
          </Alert>

          <ProtoNote label="Creating a customer is a form, not an onboarding process" defaultOpen>
            The real thing almost certainly involves contracts, billing setup and account provisioning. None of that
            has been defined, so this screen records the company and stops there. The short code is derived from the
            name as a convenience and stays editable — whether codes are assigned by LynkBridge or agreed with the
            customer is an open question.
          </ProtoNote>
        </div>
      </div>
    </PageContainer>
  )
}
