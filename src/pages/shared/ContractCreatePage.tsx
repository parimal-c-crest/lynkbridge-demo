import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard } from '@/components/ui/DetailCard'
import { Button, LinkButton } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { Toggle } from '@/components/forms/Toggle'
import { DatePicker, Select, Textarea, TextInput } from '@/components/forms/Fields'
import { usePortal } from '@/lib/usePortal'
import { useData } from '@/state/DataContext'
import { useToast } from '@/state/ToastContext'
import { getCarrier, getTenant } from '@/data/selectors'
import { PROTOTYPE_TODAY } from '@/data/dataset'
import { formatDate } from '@/lib/format'

const TERMS = [12, 24, 36, 48, 60]
const today = PROTOTYPE_TODAY.toISOString().slice(0, 10)

/** End date is derived from start + term, so the two can never disagree. */
function addMonths(startIso: string, months: number): string {
  const start = new Date(`${startIso}T00:00:00Z`)
  if (Number.isNaN(start.getTime())) return ''
  const end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + months)
  return end.toISOString().slice(0, 10)
}

/**
 * Create Contract.
 *
 * A contract carries no cost of its own — its MRC is rolled up from the
 * services attached to it (see `contractMrc`), so this form deliberately has no
 * cost field. Attach services to the contract to give it a value.
 */
export function ContractCreatePage() {
  const { data, path, session, isAdmin } = usePortal()
  const { createContract } = useData()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [tenantId, setTenantId] = useState(isAdmin ? '' : (session.tenantId ?? ''))
  const [carrierId, setCarrierId] = useState('')
  const [contractNumber, setContractNumber] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [termMonths, setTermMonths] = useState(36)
  const [autoRenew, setAutoRenew] = useState(false)
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const endDate = useMemo(() => addMonths(startDate, termMonths), [startDate, termMonths])

  // Suggested only — the real numbering scheme is the carrier's, not ours.
  const suggestedNumber = useMemo(() => {
    const code = getTenant(data, tenantId)?.code
    const carrier = getCarrier(data, carrierId)?.name.slice(0, 3).toUpperCase()
    if (!code || !carrier) return ''
    return `${code}-${carrier}-${String(data.contracts.length + 1).padStart(4, '0')}`
  }, [data, tenantId, carrierId])

  const submit = (event: FormEvent) => {
    event.preventDefault()

    const number = (contractNumber || suggestedNumber).trim()

    const nextErrors: Record<string, string> = {}
    if (!tenantId) nextErrors.tenant = 'Select the customer this contract belongs to.'
    if (!carrierId) nextErrors.carrier = 'Select the carrier the agreement is with.'
    if (!number) nextErrors.contractNumber = 'Enter the contract number.'
    if (!startDate) nextErrors.startDate = 'Enter the start date.'
    if (!endDate) nextErrors.startDate = 'Enter a valid start date so the end date can be derived.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)

    window.setTimeout(() => {
      const contract = createContract({
        tenantId,
        carrierId,
        contractNumber: number,
        startDate,
        endDate,
        termMonths,
        autoRenew,
        notes: notes.trim(),
      })

      setSubmitting(false)
      notify({
        tone: 'success',
        title: `Contract ${contract.contractNumber} added`,
        description: 'Stored in this browser session only — a refresh restores the seed data.',
      })
      navigate(path(`/contracts/${contract.id}`), { state: { justCreated: true } })
    }, 400)
  }

  return (
    <PageContainer
      title="Add a contract"
      description="Record a commercial agreement so its services, cost and renewal position can be tracked."
      breadcrumbs={[
        { label: isAdmin ? 'Admin' : 'Portal', to: path('/dashboard') },
        { label: 'Contracts', to: path('/contracts') },
        { label: 'New contract' },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={submit} className="lg:col-span-2" noValidate>
          <DetailCard title="Agreement details">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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

                <Select
                  label="Carrier"
                  required
                  value={carrierId}
                  onChange={(event) => setCarrierId(event.target.value)}
                  options={data.carriers.map((carrier) => ({ value: carrier.id, label: carrier.name }))}
                  placeholder="Select a carrier"
                  error={errors.carrier}
                />
              </div>

              <TextInput
                label="Contract number"
                required
                value={contractNumber}
                onChange={(event) => setContractNumber(event.target.value)}
                placeholder={suggestedNumber || 'e.g. ACME-ATL-0042'}
                hint={
                  suggestedNumber
                    ? `Leave blank to use the suggested number ${suggestedNumber}.`
                    : 'Select a customer and carrier to see a suggested number.'
                }
                error={errors.contractNumber}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <DatePicker
                  label="Start date"
                  required
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  error={errors.startDate}
                />
                <Select
                  label="Term"
                  value={String(termMonths)}
                  onChange={(event) => setTermMonths(Number(event.target.value))}
                  options={TERMS.map((value) => ({ value: String(value), label: `${value} months` }))}
                  hint={endDate ? `Ends ${formatDate(endDate)}.` : undefined}
                />
              </div>

              <Toggle
                label="Auto-renew"
                description="Whether the agreement rolls over at the end of its term. No notice rule is implied — the real notice period per contract has not been supplied."
                checked={autoRenew}
                onChange={setAutoRenew}
              />

              <Textarea
                label="Notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Anything the account team should know about this agreement."
                hint="Optional."
              />

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="submit" disabled={submitting} icon={submitting ? undefined : <Plus className="size-4" />}>
                  {submitting ? 'Saving…' : 'Add contract'}
                </Button>
                <LinkButton to={path('/contracts')} variant="secondary">
                  Cancel
                </LinkButton>
              </div>
            </div>
          </DetailCard>
        </form>

        <div className="space-y-4">
          <Alert tone="info" title="Why there is no cost field">
            <p className="leading-relaxed">
              Monthly cost is stored on the service, and a contract's MRC is the sum of the services attached to it. A
              new contract therefore starts at zero until services are pointed at it — which is what keeps the contract
              screen and the service screens from ever disagreeing.
            </p>
          </Alert>

          <ProtoNote label="Undefined in the requirements" defaultOpen>
            Contract numbering, whether one agreement can cover several carriers or customers, and who is allowed to
            record a contract have not been defined. The end date is derived from the term here so the two cannot
            contradict each other.
          </ProtoNote>
        </div>
      </div>
    </PageContainer>
  )
}
