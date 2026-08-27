import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard } from '@/components/ui/DetailCard'
import { Button, LinkButton } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { FileUpload, Select, Textarea, TextInput } from '@/components/forms/Fields'
import { usePortal } from '@/lib/usePortal'
import { getLocation, getService, servicesAtLocation } from '@/data/selectors'
import { useData } from '@/state/DataContext'
import { useToast } from '@/state/ToastContext'
import type { TicketPriority } from '@/data/types'

const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical']

/**
 * Create Ticket.
 *
 * Accepts ?location= and ?service= so "Raise a ticket" from a location, service
 * or circuit screen arrives with the context already filled in.
 */
export function TicketCreatePage() {
  const { data, path, session, isAdmin } = usePortal()
  const { createTicket } = useData()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const presetService = getService(data, searchParams.get('service'))
  const presetLocationId = presetService?.locationId ?? searchParams.get('location') ?? ''

  const [subject, setSubject] = useState('')
  const [locationId, setLocationId] = useState(presetLocationId)
  const [serviceId, setServiceId] = useState(presetService?.id ?? '')
  const [priority, setPriority] = useState<TicketPriority>('Medium')
  const [description, setDescription] = useState('')
  const [attachment, setAttachment] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const locationServices = useMemo(
    () => (locationId ? servicesAtLocation(data, locationId) : data.services),
    [data, locationId],
  )

  // Admins can raise a ticket on behalf of a customer; the tenant follows the
  // chosen location so the ticket lands in the right place.
  const tenantId = getLocation(data, locationId)?.tenantId ?? session.tenantId ?? data.tenants[0]?.id

  const submit = (event: FormEvent) => {
    event.preventDefault()

    const nextErrors: Record<string, string> = {}
    if (!subject.trim()) nextErrors.subject = 'Enter a short summary of the issue.'
    if (!locationId) nextErrors.location = 'Select the location this affects.'
    if (!description.trim()) nextErrors.description = 'Describe what is happening so support can act on it.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    if (!tenantId) return

    setSubmitting(true)

    // Short delay so the submit reads as a real action rather than an instant jump.
    window.setTimeout(() => {
      const ticket = createTicket({
        subject: subject.trim(),
        description: description.trim(),
        locationId,
        serviceId: serviceId || null,
        priority,
        attachmentName: attachment,
        tenantId,
        requestedBy: session.name,
      })

      setSubmitting(false)
      notify({
        tone: 'success',
        title: `Ticket ${ticket.number} created`,
        description: 'Stored in this browser session only — no ticketing system was contacted.',
      })
      navigate(path(`/tickets/${ticket.id}`), { state: { justCreated: true } })
    }, 400)
  }

  return (
    <PageContainer
      title="Create a support ticket"
      description="Tell LynkBridge what is happening and which site or service is affected."
      breadcrumbs={[
        { label: isAdmin ? 'Admin' : 'Portal', to: path('/dashboard') },
        { label: 'Tickets', to: path('/tickets') },
        { label: 'New ticket' },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={submit} className="lg:col-span-2" noValidate>
          <DetailCard title="Ticket details">
            <div className="space-y-4">
              <TextInput
                label="Subject"
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Short summary, e.g. Primary circuit down at the Denver branch"
                error={errors.subject}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Location"
                  required
                  value={locationId}
                  onChange={(event) => {
                    setLocationId(event.target.value)
                    setServiceId('')
                  }}
                  options={data.locations.map((location) => ({
                    value: location.id,
                    label: `${location.name} — ${location.city}, ${location.state}`,
                  }))}
                  placeholder="Select a location"
                  error={errors.location}
                />

                <Select
                  label="Service"
                  value={serviceId}
                  onChange={(event) => setServiceId(event.target.value)}
                  options={locationServices.map((service) => ({
                    value: service.id,
                    label: `${service.name} (${service.type})`,
                  }))}
                  placeholder={locationId ? 'Not service-specific' : 'Select a location first'}
                  disabled={!locationId}
                  hint="Optional — leave blank if the whole site is affected."
                />
              </div>

              <Select
                label="Priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as TicketPriority)}
                options={PRIORITIES.map((value) => ({ value, label: value }))}
                hint="Prototype priorities — no response target is implied by this selection."
              />

              <Textarea
                label="Description"
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is happening, when it started, and what has already been checked."
                error={errors.description}
              />

              <FileUpload
                label="Attachment"
                value={attachment}
                onChange={setAttachment}
                hint="Optional. The file name is captured for the demonstration; nothing is uploaded."
              />

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="submit" disabled={submitting} icon={submitting ? undefined : <Send className="size-4" />}>
                  {submitting ? 'Submitting…' : 'Submit ticket'}
                </Button>
                <LinkButton to={path('/tickets')} variant="secondary">
                  Cancel
                </LinkButton>
              </div>
            </div>
          </DetailCard>
        </form>

        <div className="space-y-4">
          <Alert tone="info" title="What happens on submit">
            <p className="leading-relaxed">
              The ticket is added to this browser session and opens immediately, so the full journey can be walked
              through. Nothing is sent anywhere, and a page refresh clears it.
            </p>
          </Alert>

          <ProtoNote label="Undefined in the requirements" defaultOpen>
            Who a ticket is assigned to, how it escalates, what response times apply and which fields are mandatory
            have not been defined. This form asks for the minimum needed to demonstrate the workflow.
          </ProtoNote>
        </div>
      </div>
    </PageContainer>
  )
}
