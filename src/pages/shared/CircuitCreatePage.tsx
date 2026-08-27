import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard } from '@/components/ui/DetailCard'
import { Button, LinkButton } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { DatePicker, Select, TextInput } from '@/components/forms/Fields'
import { usePortal } from '@/lib/usePortal'
import { useData } from '@/state/DataContext'
import { useToast } from '@/state/ToastContext'
import { circuitForService, getCarrier, getLocation, getService, getTenant } from '@/data/selectors'
import { PROTOTYPE_TODAY } from '@/data/dataset'
import { BANDWIDTH_BY_TYPE, CIRCUIT_BEARING_TYPES, DEMARCATIONS } from '@/data/catalog'
import type { CircuitStatus } from '@/data/types'

const CIRCUIT_STATUSES: CircuitStatus[] = ['Active', 'Provisioning', 'Degraded', 'Disconnected']
const today = PROTOTYPE_TODAY.toISOString().slice(0, 10)

/**
 * Create Circuit.
 *
 * A circuit belongs to exactly one service, and a service has at most one
 * circuit, so the service list here is deliberately narrow: physically
 * delivered service types that do not already have a circuit. That constraint
 * is the form's whole shape — offering any other service would break the 1:1
 * rule the rest of the prototype relies on.
 *
 * Circuits carry no tenant of their own; they are scoped through their service.
 */
export function CircuitCreatePage() {
  const { data, path, isAdmin } = usePortal()
  const { createCircuit } = useData()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const available = useMemo(
    () =>
      data.services.filter(
        (service) => CIRCUIT_BEARING_TYPES.includes(service.type) && !circuitForService(data, service.id),
      ),
    [data],
  )

  const presetId = searchParams.get('service') ?? ''
  const preset = available.some((service) => service.id === presetId) ? presetId : ''

  const [serviceId, setServiceId] = useState(preset)
  const [circuitId, setCircuitId] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bandwidth, setBandwidth] = useState('')
  const [status, setStatus] = useState<CircuitStatus>('Active')
  const [demarcation, setDemarcation] = useState(DEMARCATIONS[0])
  const [activatedAt, setActivatedAt] = useState(today)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const service = getService(data, serviceId)
  const tenant = service ? getTenant(data, service.tenantId) : undefined

  // The circuit inherits the service's bandwidth by default — the two describe
  // the same delivery, and a mismatch would only ever be a typo.
  useEffect(() => {
    if (service) setBandwidth(service.bandwidth)
  }, [service])

  const suggestedCircuitId =
    service && tenant
      ? `LB/${tenant.code}/${service.type.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase()}/${String(
          data.circuits.length + 1,
        ).padStart(4, '0')}`
      : ''

  const submit = (event: FormEvent) => {
    event.preventDefault()

    const identifier = (circuitId || suggestedCircuitId).trim()

    const nextErrors: Record<string, string> = {}
    if (!serviceId) nextErrors.service = 'Select the service this circuit delivers.'
    if (!identifier) nextErrors.circuitId = 'Enter the circuit identifier.'
    if (!bandwidth.trim()) nextErrors.bandwidth = 'Enter the circuit bandwidth.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)

    window.setTimeout(() => {
      const circuit = createCircuit({
        serviceId,
        circuitId: identifier,
        accountNumber: (accountNumber || service?.accountNumber || '').trim(),
        bandwidth: bandwidth.trim(),
        status,
        demarcation,
        activatedAt,
      })

      setSubmitting(false)
      notify({
        tone: 'success',
        title: `Circuit ${circuit.circuitId} added`,
        description: 'Stored in this browser session only — a refresh restores the seed data.',
      })
      navigate(path(`/circuits/${circuit.id}`), { state: { justCreated: true } })
    }, 400)
  }

  const breadcrumbs = [
    { label: isAdmin ? 'Admin' : 'Portal', to: path('/dashboard') },
    { label: 'Circuits', to: path('/circuits') },
    { label: 'New circuit' },
  ]

  if (!available.length) {
    return (
      <PageContainer title="Add a circuit" breadcrumbs={breadcrumbs}>
        <EmptyState
          title="Every eligible service already has a circuit"
          description="A circuit belongs to exactly one service, and only service types with physical delivery get one. Add a service first, and its circuit can be recorded with it."
          action={
            <LinkButton to={path('/services/new')} variant="primary">
              Add a service
            </LinkButton>
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Add a circuit"
      description="Record the physical delivery behind a service, with its carrier account and demarcation."
      breadcrumbs={breadcrumbs}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={submit} className="lg:col-span-2" noValidate>
          <DetailCard title="Circuit details">
            <div className="space-y-4">
              <Select
                label="Service"
                required
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                options={available.map((option) => ({
                  value: option.id,
                  label: `${option.name} (${option.type}) — ${getLocation(data, option.locationId)?.name ?? 'Unknown site'}`,
                }))}
                placeholder="Select a service"
                hint="Only services with physical delivery that do not already have a circuit are listed."
                error={errors.service}
              />

              {service ? (
                <dl className="grid gap-3 rounded-md bg-ink-50 p-3 text-sm sm:grid-cols-3">
                  {isAdmin ? (
                    <div>
                      <dt className="text-xs text-ink-500">Customer</dt>
                      <dd className="text-ink-800">{tenant?.name ?? '—'}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-xs text-ink-500">Carrier</dt>
                    <dd className="text-ink-800">{getCarrier(data, service.carrierId)?.name ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-500">Location</dt>
                    <dd className="text-ink-800">{getLocation(data, service.locationId)?.name ?? '—'}</dd>
                  </div>
                </dl>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Circuit ID"
                  required
                  value={circuitId}
                  onChange={(event) => setCircuitId(event.target.value)}
                  placeholder={suggestedCircuitId || 'Select a service first'}
                  hint={suggestedCircuitId ? `Leave blank to use ${suggestedCircuitId}.` : undefined}
                  error={errors.circuitId}
                />
                <TextInput
                  label="Carrier account number"
                  value={accountNumber}
                  onChange={(event) => setAccountNumber(event.target.value)}
                  placeholder={service?.accountNumber ?? 'Select a service first'}
                  hint="Leave blank to reuse the service account number."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Select
                  label="Bandwidth"
                  value={bandwidth}
                  onChange={(event) => setBandwidth(event.target.value)}
                  options={(service ? BANDWIDTH_BY_TYPE[service.type] : [])
                    .concat(bandwidth && service && !BANDWIDTH_BY_TYPE[service.type].includes(bandwidth) ? [bandwidth] : [])
                    .map((value) => ({ value, label: value }))}
                  placeholder={service ? undefined : 'Select a service first'}
                  disabled={!service}
                  error={errors.bandwidth}
                />
                <Select
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as CircuitStatus)}
                  options={CIRCUIT_STATUSES.map((value) => ({ value, label: value }))}
                  hint="Prototype vocabulary — no monitoring system is connected."
                />
                <DatePicker
                  label="Activated"
                  value={activatedAt}
                  onChange={(event) => setActivatedAt(event.target.value)}
                />
              </div>

              <Select
                label="Demarcation"
                value={demarcation}
                onChange={(event) => setDemarcation(event.target.value)}
                options={DEMARCATIONS.map((value) => ({ value, label: value }))}
                hint="Where the carrier's responsibility ends and the site's begins."
              />

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="submit" disabled={submitting} icon={submitting ? undefined : <Plus className="size-4" />}>
                  {submitting ? 'Saving…' : 'Add circuit'}
                </Button>
                <LinkButton to={path('/circuits')} variant="secondary">
                  Cancel
                </LinkButton>
              </div>
            </div>
          </DetailCard>
        </form>

        <div className="space-y-4">
          <Alert tone="info" title="What happens on save">
            <p className="leading-relaxed">
              The circuit is added to this browser session and opens immediately. Nothing is sent anywhere, no carrier
              is contacted, and a page refresh clears it.
            </p>
          </Alert>

          <ProtoNote label="Undefined in the requirements" defaultOpen>
            Whether a service can have more than one circuit, and whether a circuit can be shared between services, is
            an open question. This prototype holds them one-to-one, which is what every screen currently assumes.
          </ProtoNote>
        </div>
      </div>
    </PageContainer>
  )
}
