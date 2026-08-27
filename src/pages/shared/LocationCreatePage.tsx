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
import { SITE_TYPES } from '@/data/catalog'
import type { RecordStatus } from '@/data/types'

const STATUSES: RecordStatus[] = ['Active', 'Pending', 'Inactive']
const today = PROTOTYPE_TODAY.toISOString().slice(0, 10)

/**
 * Create Location.
 *
 * Mounted for both roles like every other shared screen. A customer's site
 * lands in their own tenant; an admin picks the customer explicitly, because
 * there is no other way to say which estate the site belongs to.
 */
export function LocationCreatePage() {
  const { data, path, session, isAdmin } = usePortal()
  const { createLocation } = useData()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [tenantId, setTenantId] = useState(isAdmin ? '' : (session.tenantId ?? ''))
  const [name, setName] = useState('')
  const [siteType, setSiteType] = useState<string>(SITE_TYPES[1])
  const [addressLine, setAddressLine] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [status, setStatus] = useState<RecordStatus>('Active')
  const [openedAt, setOpenedAt] = useState(today)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()

    const nextErrors: Record<string, string> = {}
    if (!tenantId) nextErrors.tenant = 'Select the customer this site belongs to.'
    if (!name.trim()) nextErrors.name = 'Give the site a name people will recognise.'
    if (!addressLine.trim()) nextErrors.addressLine = 'Enter the street address.'
    if (!city.trim()) nextErrors.city = 'Enter the city.'
    if (!state.trim()) nextErrors.state = 'Enter the two-letter state code.'
    if (!zip.trim()) nextErrors.zip = 'Enter the ZIP code.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)

    // Short delay so the submit reads as a real action rather than an instant jump.
    window.setTimeout(() => {
      const location = createLocation({
        tenantId,
        name: name.trim(),
        siteType,
        addressLine: addressLine.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zip: zip.trim(),
        status,
        openedAt,
      })

      setSubmitting(false)
      notify({
        tone: 'success',
        title: `${location.name} added`,
        description: 'Stored in this browser session only — a refresh restores the seed data.',
      })
      navigate(path(`/locations/${location.id}`), { state: { justCreated: true } })
    }, 400)
  }

  return (
    <PageContainer
      title="Add a location"
      description="Register a site so services, circuits and tickets can be attached to it."
      breadcrumbs={[
        { label: isAdmin ? 'Admin' : 'Portal', to: path('/dashboard') },
        { label: 'Locations', to: path('/locations') },
        { label: 'New location' },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={submit} className="lg:col-span-2" noValidate>
          <DetailCard title="Site details">
            <div className="space-y-4">
              {isAdmin ? (
                <Select
                  label="Customer"
                  required
                  value={tenantId}
                  onChange={(event) => setTenantId(event.target.value)}
                  options={data.tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
                  placeholder="Select a customer"
                  error={errors.tenant}
                />
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Location name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Denver Distribution Center"
                  error={errors.name}
                />

                <Select
                  label="Site type"
                  value={siteType}
                  onChange={(event) => setSiteType(event.target.value)}
                  options={SITE_TYPES.map((value) => ({ value, label: value }))}
                  hint="Prototype vocabulary — no site taxonomy has been confirmed."
                />
              </div>

              <TextInput
                label="Street address"
                required
                value={addressLine}
                onChange={(event) => setAddressLine(event.target.value)}
                placeholder="1200 Commerce Park Dr"
                error={errors.addressLine}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <TextInput
                  label="City"
                  required
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  error={errors.city}
                />
                <TextInput
                  label="State"
                  required
                  value={state}
                  maxLength={2}
                  onChange={(event) => setState(event.target.value.toUpperCase())}
                  placeholder="CO"
                  error={errors.state}
                />
                <TextInput
                  label="ZIP"
                  required
                  value={zip}
                  onChange={(event) => setZip(event.target.value)}
                  placeholder="80216"
                  error={errors.zip}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as RecordStatus)}
                  options={STATUSES.map((value) => ({ value, label: value }))}
                />
                <DatePicker
                  label="Opened"
                  value={openedAt}
                  onChange={(event) => setOpenedAt(event.target.value)}
                  hint="When the site came into service."
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="submit" disabled={submitting} icon={submitting ? undefined : <Plus className="size-4" />}>
                  {submitting ? 'Saving…' : 'Add location'}
                </Button>
                <LinkButton to={path('/locations')} variant="secondary">
                  Cancel
                </LinkButton>
              </div>
            </div>
          </DetailCard>
        </form>

        <div className="space-y-4">
          <Alert tone="info" title="What happens on save">
            <p className="leading-relaxed">
              The location is added to this browser session and opens immediately. Nothing is sent anywhere, and a page
              refresh clears it.
            </p>
          </Alert>

          <ProtoNote label="Undefined in the requirements" defaultOpen>
            Who may add a site, which fields are mandatory, and whether a new site needs approval before it appears have
            not been defined. This form asks for the minimum the rest of the prototype needs.
          </ProtoNote>
        </div>
      </div>
    </PageContainer>
  )
}
