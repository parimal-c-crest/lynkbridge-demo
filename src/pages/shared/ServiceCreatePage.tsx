import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard } from '@/components/ui/DetailCard'
import { Button, LinkButton } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { Toggle } from '@/components/forms/Toggle'
import { DatePicker, Select, TextInput } from '@/components/forms/Fields'
import { usePortal } from '@/lib/usePortal'
import { useData } from '@/state/DataContext'
import { useToast } from '@/state/ToastContext'
import { getCarrier, getContract, getLocation, getTenant } from '@/data/selectors'
import { PROTOTYPE_TODAY } from '@/data/dataset'
import { BANDWIDTH_BY_TYPE, CIRCUIT_BEARING_TYPES, DEMARCATIONS } from '@/data/catalog'
import { SERVICE_TYPES, type CircuitStatus, type RecordStatus, type ServiceType } from '@/data/types'

const STATUSES: RecordStatus[] = ['Active', 'Pending', 'Inactive']
const CIRCUIT_STATUSES: CircuitStatus[] = ['Active', 'Provisioning', 'Degraded', 'Disconnected']
const today = PROTOTYPE_TODAY.toISOString().slice(0, 10)

/**
 * Create Service.
 *
 * The location drives the tenant, and the contract list narrows to that same
 * tenant — service, location and contract must share one customer, which the
 * data harness asserts.
 *
 * A circuit-bearing service can be given its circuit here rather than as a
 * second trip, so a Fiber or DIA service is never left without the physical
 * delivery every other screen expects it to have.
 *
 * Accepts ?location= and ?contract= so "Add a service" from a location or
 * contract screen arrives with the context already filled in.
 */
export function ServiceCreatePage() {
  const { data, path, isAdmin } = usePortal()
  const { createService } = useData()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const presetContract = getContract(data, searchParams.get('contract'))
  const presetLocationId = searchParams.get('location') ?? ''

  const [locationId, setLocationId] = useState(presetLocationId)
  const [contractId, setContractId] = useState(presetContract?.id ?? '')
  const [carrierId, setCarrierId] = useState(presetContract?.carrierId ?? '')
  const [name, setName] = useState('')
  const [type, setType] = useState<ServiceType>('Internet')
  const [bandwidth, setBandwidth] = useState(BANDWIDTH_BY_TYPE.Internet[0])
  const [mrc, setMrc] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [status, setStatus] = useState<RecordStatus>('Active')
  const [installedAt, setInstalledAt] = useState(today)

  const [withCircuit, setWithCircuit] = useState(true)
  const [circuitId, setCircuitId] = useState('')
  const [circuitAccount, setCircuitAccount] = useState('')
  const [circuitStatus, setCircuitStatus] = useState<CircuitStatus>('Active')
  const [demarcation, setDemarcation] = useState(DEMARCATIONS[0])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const location = getLocation(data, locationId)
  const tenantId = location?.tenantId ?? ''
  const tenant = getTenant(data, tenantId)
  const bearsCircuit = CIRCUIT_BEARING_TYPES.includes(type)

  // Only contracts belonging to the same customer as the chosen site can hold
  // this service — the alternative is a service whose contract sits in another
  // tenant, which the modelling rules forbid.
  const tenantContracts = useMemo(
    () => (tenantId ? data.contracts.filter((contract) => contract.tenantId === tenantId) : []),
    [data.contracts, tenantId],
  )

  // Bandwidth options are per service type, so a type change has to reset it.
  useEffect(() => {
    setBandwidth(BANDWIDTH_BY_TYPE[type][0])
  }, [type])

  const suggestedAccount = tenant ? `${tenant.code}-${String(data.services.length + 1).padStart(6, '0')}` : ''
  const suggestedCircuitId = tenant
    ? `LB/${tenant.code}/${type.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase()}/${String(
        data.circuits.length + 1,
      ).padStart(4, '0')}`
    : ''

  const submit = (event: FormEvent) => {
    event.preventDefault()

    const amount = Number(mrc)

    const nextErrors: Record<string, string> = {}
    if (!locationId) nextErrors.location = 'Select the site this service is delivered to.'
    if (!contractId) nextErrors.contract = 'Select the contract this service sits on.'
    if (!carrierId) nextErrors.carrier = 'Select the carrier delivering the service.'
    if (!name.trim()) nextErrors.name = 'Give the service a name people will recognise.'
    if (!mrc.trim() || Number.isNaN(amount) || amount < 0) {
      nextErrors.mrc = 'Enter the monthly cost as a number.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    if (!tenantId) return

    setSubmitting(true)

    window.setTimeout(() => {
      const service = createService({
        tenantId,
        locationId,
        contractId,
        carrierId,
        name: name.trim(),
        type,
        bandwidth,
        mrc: amount,
        accountNumber: (accountNumber || suggestedAccount).trim(),
        status,
        installedAt,
        circuit:
          bearsCircuit && withCircuit
            ? {
                circuitId: (circuitId || suggestedCircuitId).trim(),
                accountNumber: (circuitAccount || accountNumber || suggestedAccount).trim(),
                bandwidth,
                status: circuitStatus,
                demarcation,
                activatedAt: installedAt,
              }
            : undefined,
      })

      setSubmitting(false)
      notify({
        tone: 'success',
        title: `${service.name} added`,
        description: 'Stored in this browser session only — a refresh restores the seed data.',
      })
      navigate(path(`/services/${service.id}`), { state: { justCreated: true } })
    }, 400)
  }

  // A service cannot exist without a site and a contract to hang off.
  if (!data.locations.length || !data.contracts.length) {
    return (
      <PageContainer
        title="Add a service"
        breadcrumbs={[
          { label: isAdmin ? 'Admin' : 'Portal', to: path('/dashboard') },
          { label: 'Services', to: path('/services') },
          { label: 'New service' },
        ]}
      >
        <EmptyState
          title="A location and a contract are needed first"
          description="A service is delivered to a site and sits on a commercial agreement, so both have to exist before one can be recorded."
          action={
            <LinkButton to={path(data.locations.length ? '/contracts/new' : '/locations/new')} variant="primary">
              {data.locations.length ? 'Add a contract' : 'Add a location'}
            </LinkButton>
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Add a service"
      description="Record a connectivity or managed service, the site it serves and the contract it sits on."
      breadcrumbs={[
        { label: isAdmin ? 'Admin' : 'Portal', to: path('/dashboard') },
        { label: 'Services', to: path('/services') },
        { label: 'New service' },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={submit} className="space-y-5 lg:col-span-2" noValidate>
          <DetailCard title="Service details">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Location"
                  required
                  value={locationId}
                  onChange={(event) => {
                    setLocationId(event.target.value)
                    setContractId('')
                  }}
                  options={data.locations.map((option) => ({
                    value: option.id,
                    label: `${option.name} — ${option.city}, ${option.state}`,
                  }))}
                  placeholder="Select a location"
                  error={errors.location}
                  hint={isAdmin && tenant ? `Customer: ${tenant.name}` : undefined}
                />

                <Select
                  label="Contract"
                  required
                  value={contractId}
                  onChange={(event) => {
                    setContractId(event.target.value)
                    const carrier = getContract(data, event.target.value)?.carrierId
                    if (carrier) setCarrierId(carrier)
                  }}
                  options={tenantContracts.map((contract) => ({
                    value: contract.id,
                    label: `${contract.contractNumber} — ${getCarrier(data, contract.carrierId)?.name ?? 'Unknown carrier'}`,
                  }))}
                  placeholder={
                    !locationId
                      ? 'Select a location first'
                      : tenantContracts.length
                        ? 'Select a contract'
                        : 'No contracts for this customer yet'
                  }
                  disabled={!locationId || !tenantContracts.length}
                  error={errors.contract}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Service name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Denver DIA Primary"
                  error={errors.name}
                />

                <Select
                  label="Carrier"
                  required
                  value={carrierId}
                  onChange={(event) => setCarrierId(event.target.value)}
                  options={data.carriers.map((carrier) => ({ value: carrier.id, label: carrier.name }))}
                  placeholder="Select a carrier"
                  hint="Defaults to the contract's carrier. The carrier is held on the service and nowhere else."
                  error={errors.carrier}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Select
                  label="Service type"
                  value={type}
                  onChange={(event) => setType(event.target.value as ServiceType)}
                  options={SERVICE_TYPES.map((value) => ({ value, label: value }))}
                />
                <Select
                  label="Bandwidth"
                  value={bandwidth}
                  onChange={(event) => setBandwidth(event.target.value)}
                  options={BANDWIDTH_BY_TYPE[type].map((value) => ({ value, label: value }))}
                />
                <TextInput
                  label="Monthly cost (USD)"
                  required
                  inputMode="decimal"
                  value={mrc}
                  onChange={(event) => setMrc(event.target.value)}
                  placeholder="1250"
                  hint="The only stored cost — contract and dashboard totals roll up from it."
                  error={errors.mrc}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <TextInput
                  label="Account number"
                  value={accountNumber}
                  onChange={(event) => setAccountNumber(event.target.value)}
                  placeholder={suggestedAccount || 'Select a location first'}
                  hint={suggestedAccount ? `Leave blank to use ${suggestedAccount}.` : undefined}
                />
                <Select
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as RecordStatus)}
                  options={STATUSES.map((value) => ({ value, label: value }))}
                />
                <DatePicker
                  label="Installed"
                  value={installedAt}
                  onChange={(event) => setInstalledAt(event.target.value)}
                />
              </div>
            </div>
          </DetailCard>

          {bearsCircuit ? (
            <DetailCard title="Circuit">
              <div className="space-y-4">
                <Toggle
                  label="This service is delivered over a circuit"
                  description="A service has at most one circuit, and only service types with physical delivery get one. Recording it here keeps the pair together."
                  checked={withCircuit}
                  onChange={setWithCircuit}
                />

                {withCircuit ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextInput
                        label="Circuit ID"
                        value={circuitId}
                        onChange={(event) => setCircuitId(event.target.value)}
                        placeholder={suggestedCircuitId || 'Select a location first'}
                        hint={suggestedCircuitId ? `Leave blank to use ${suggestedCircuitId}.` : undefined}
                      />
                      <TextInput
                        label="Carrier account number"
                        value={circuitAccount}
                        onChange={(event) => setCircuitAccount(event.target.value)}
                        placeholder="Defaults to the service account number"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Select
                        label="Circuit status"
                        value={circuitStatus}
                        onChange={(event) => setCircuitStatus(event.target.value as CircuitStatus)}
                        options={CIRCUIT_STATUSES.map((value) => ({ value, label: value }))}
                        hint="Prototype vocabulary — no monitoring system is connected."
                      />
                      <Select
                        label="Demarcation"
                        value={demarcation}
                        onChange={(event) => setDemarcation(event.target.value)}
                        options={DEMARCATIONS.map((value) => ({ value, label: value }))}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </DetailCard>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={submitting} icon={submitting ? undefined : <Plus className="size-4" />}>
              {submitting ? 'Saving…' : 'Add service'}
            </Button>
            <LinkButton to={path('/services')} variant="secondary">
              Cancel
            </LinkButton>
          </div>
        </form>

        <div className="space-y-4">
          <Alert tone="info" title="What happens on save">
            <p className="leading-relaxed">
              The service — and its circuit, if it has one — is added to this browser session and opens immediately.
              Nothing is sent anywhere, and a page refresh clears it.
            </p>
          </Alert>

          <ProtoNote label="Undefined in the requirements" defaultOpen>
            Which fields each service type actually needs is an open question; Voice and SD-WAN in particular are likely
            to need type-specific attributes this form does not ask for. Bandwidth options per type are prototype
            values.
          </ProtoNote>
        </div>
      </div>
    </PageContainer>
  )
}
