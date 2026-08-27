import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Upload } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard } from '@/components/ui/DetailCard'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Alert } from '@/components/ui/Alert'
import { Button, LinkButton } from '@/components/ui/Button'
import { DataTable } from '@/components/data/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { FileUpload, Select } from '@/components/forms/Fields'
import { usePortal } from '@/lib/usePortal'
import { formatDate, formatNumber } from '@/lib/format'
import { getTenant } from '@/data/selectors'
import { useData } from '@/state/DataContext'
import { useToast } from '@/state/ToastContext'
import type { ImportEntity } from '@/data/types'

const ENTITIES: ImportEntity[] = ['Customers', 'Locations', 'Services', 'Circuits', 'Contracts']

/** Columns each file type is expected to carry. PROTOTYPE — not confirmed. */
const EXPECTED_COLUMNS: Record<ImportEntity, string[]> = {
  Customers: ['company_name', 'account_code', 'industry', 'primary_contact', 'contact_email'],
  Locations: ['customer_code', 'location_name', 'address', 'city', 'state', 'zip'],
  Services: ['customer_code', 'location_name', 'service_type', 'carrier', 'bandwidth', 'mrc', 'account_number'],
  Circuits: ['circuit_id', 'service_account_number', 'carrier_account', 'bandwidth', 'status'],
  Contracts: ['customer_code', 'carrier', 'contract_number', 'start_date', 'end_date', 'term_months'],
}

type Step = 'select' | 'preview' | 'validate' | 'confirm' | 'success'

const STEP_ORDER: Step[] = ['select', 'preview', 'validate', 'confirm', 'success']

const STEP_LABELS: Record<Step, string> = {
  select: 'Data type & file',
  preview: 'Preview',
  validate: 'Validation',
  confirm: 'Confirmation',
  success: 'Complete',
}

interface PreviewRow {
  rowNumber: number
  values: string[]
  issue: { level: 'error' | 'warning'; message: string } | null
}

/**
 * Builds a deterministic simulated parse of the chosen file.
 *
 * No file is read. The row count and the issues are derived from the file name
 * so the same file always produces the same preview during a demo, and so the
 * error and warning paths can both be shown on demand.
 */
function simulateParse(entity: ImportEntity, fileName: string): PreviewRow[] {
  const columns = EXPECTED_COLUMNS[entity]
  const seed = [...fileName].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const rowCount = 8

  return Array.from({ length: rowCount }, (_, index) => {
    const rowNumber = index + 2 // row 1 is the header
    const values = columns.map((column, columnIndex) => {
      if (column.includes('email')) return `contact${rowNumber}@example.com`
      if (column.includes('date')) return `2026-0${((seed + index) % 9) + 1}-1${(index % 9) + 0}`
      if (column === 'mrc') return String(((seed + index * 37) % 2400) + 180)
      if (column === 'term_months') return String([12, 24, 36][(seed + index) % 3])
      if (column === 'bandwidth') return `${[100, 250, 500, 1000][(seed + index) % 4]} Mbps`
      if (column === 'state') return ['OH', 'NC', 'TX', 'CO'][(seed + index) % 4]
      if (column === 'zip') return String(10000 + ((seed * (index + 3)) % 89999))
      return `${column.replace(/_/g, ' ')} ${rowNumber}${columnIndex === 0 ? '' : ''}`
    })

    // Two rows carry issues so the validation step has something to report.
    let issue: PreviewRow['issue'] = null
    if (index === 3) {
      issue = { level: 'warning', message: 'Optional column is empty — the record will import without it.' }
      values[values.length - 1] = ''
    } else if (index === 6 && seed % 2 === 0) {
      issue = { level: 'error', message: 'Required value is missing — this row cannot be imported.' }
      values[1] = ''
    }

    return { rowNumber, values, issue }
  })
}

export function ImportsPage() {
  const { data, session } = usePortal()
  const { recordImport } = useData()
  const { notify } = useToast()

  const [step, setStep] = useState<Step>('select')
  const [entity, setEntity] = useState<ImportEntity>('Locations')
  const [tenantId, setTenantId] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rows = useMemo(() => (fileName ? simulateParse(entity, fileName) : []), [entity, fileName])
  const errors = rows.filter((row) => row.issue?.level === 'error')
  const warnings = rows.filter((row) => row.issue?.level === 'warning')
  const validRows = rows.length - errors.length

  const columns = EXPECTED_COLUMNS[entity]
  const stepIndex = STEP_ORDER.indexOf(step)

  const restart = () => {
    setStep('select')
    setFileName(null)
    setError(null)
  }

  const advance = () => {
    setError(null)

    if (step === 'select') {
      if (!fileName) {
        setError('Choose a CSV or Excel file to continue.')
        return
      }
      if (entity !== 'Customers' && !tenantId) {
        setError('Select which customer this file belongs to.')
        return
      }
      setStep('preview')
      return
    }

    if (step === 'preview') {
      setStep('validate')
      return
    }

    if (step === 'validate') {
      setStep('confirm')
      return
    }

    if (step === 'confirm') {
      recordImport({
        entity,
        fileName: fileName ?? 'import.csv',
        tenantId: entity === 'Customers' ? null : tenantId,
        rowsDetected: rows.length,
        rowsValid: validRows,
        warnings: warnings.length,
        errors: errors.length,
        runBy: session.name,
      })
      setStep('success')
      notify({
        tone: 'success',
        title: 'Import completed successfully.',
        description: `${validRows} of ${rows.length} rows would have been imported. No records were actually created.`,
      })
    }
  }

  return (
    <PageContainer
      title="Imports"
      description="Load customer, location, service, circuit and contract data from CSV or Excel."
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-[--radius-card] border border-ink-200 bg-white px-4 py-3">
        {STEP_ORDER.map((value, index) => {
          const isDone = index < stepIndex
          const isCurrent = index === stepIndex

          return (
            <li key={value} className="flex items-center gap-2">
              <span
                className={`grid size-5 place-items-center rounded-full text-[11px] font-semibold ${
                  isCurrent
                    ? 'bg-brand-600 text-white'
                    : isDone
                      ? 'bg-ok-600 text-white'
                      : 'bg-ink-100 text-ink-500'
                }`}
              >
                {isDone ? '✓' : index + 1}
              </span>
              <span className={`text-xs ${isCurrent ? 'font-semibold text-ink-900' : 'text-ink-500'}`}>
                {STEP_LABELS[value]}
              </span>
              {index < STEP_ORDER.length - 1 ? <ArrowRight className="size-3 text-ink-300" aria-hidden /> : null}
            </li>
          )
        })}
      </ol>

      {step === 'select' ? (
        <DetailCard title="Select the data type and file">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Data type"
              required
              value={entity}
              onChange={(event) => {
                setEntity(event.target.value as ImportEntity)
                setFileName(null)
              }}
              options={ENTITIES.map((value) => ({ value, label: value }))}
            />

            <Select
              label="Customer"
              required={entity !== 'Customers'}
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              options={data.tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
              placeholder={entity === 'Customers' ? 'Not required for a customer file' : 'Select a customer'}
              disabled={entity === 'Customers'}
            />
          </div>

          <div className="mt-4">
            <FileUpload
              label="CSV or Excel file"
              required
              accept=".csv,.xlsx,.xls"
              value={fileName}
              onChange={setFileName}
              hint="The file is not read — the preview below is simulated from the file name."
            />
          </div>

          <div className="mt-4 rounded-md border border-ink-200 bg-ink-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Columns expected for {entity.toLowerCase()}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {columns.map((column) => (
                <code key={column} className="rounded bg-white px-1.5 py-0.5 text-[11px] text-ink-600 ring-1 ring-ink-200">
                  {column}
                </code>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-500">
              Prototype column set. The real required columns, and whether an import updates existing records or only
              inserts new ones, have not been defined.
            </p>
          </div>

          {error ? <Alert tone="error" className="mt-4">{error}</Alert> : null}

          <div className="mt-4">
            <Button onClick={advance} icon={<ArrowRight className="size-4" />}>
              Preview file
            </Button>
          </div>
        </DetailCard>
      ) : null}

      {step === 'preview' || step === 'validate' ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Rows detected" value={rows.length} />
            <StatCard label="Valid rows" value={validRows} />
            <StatCard label="Warnings" value={warnings.length} tone={warnings.length ? 'warn' : 'default'} />
            <StatCard label="Errors" value={errors.length} tone={errors.length ? 'danger' : 'default'} />
          </div>

          <DetailCard
            title={step === 'preview' ? 'Preview' : 'Validation results'}
            description={
              step === 'preview'
                ? `First ${rows.length} rows of ${fileName}.`
                : 'Rows that need attention before the import is confirmed.'
            }
            flush
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse">
                <thead className="border-y border-ink-200 bg-ink-50">
                  <tr>
                    <th className="cell-head">Row</th>
                    {columns.map((column) => (
                      <th key={column} className="cell-head">
                        {column}
                      </th>
                    ))}
                    <th className="cell-head">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {(step === 'validate' ? rows.filter((row) => row.issue) : rows).map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={
                        row.issue?.level === 'error'
                          ? 'bg-danger-50/40'
                          : row.issue?.level === 'warning'
                            ? 'bg-warn-50/40'
                            : 'bg-white'
                      }
                    >
                      <td className="cell text-ink-500">{row.rowNumber}</td>
                      {row.values.map((value, index) => (
                        <td key={index} className="cell">
                          {value || <span className="text-danger-600">empty</span>}
                        </td>
                      ))}
                      <td className="cell">
                        {row.issue ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              row.issue.level === 'error' ? 'text-danger-700' : 'text-warn-700'
                            }`}
                            title={row.issue.message}
                          >
                            <AlertTriangle className="size-3.5" />
                            {row.issue.level === 'error' ? 'Error' : 'Warning'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-ok-700">
                            <CheckCircle2 className="size-3.5" />
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DetailCard>

          {step === 'validate' ? (
            <>
              {errors.length ? (
                <Alert tone="error" title={`${errors.length} row(s) cannot be imported`}>
                  Rows with errors are skipped. Correct them in the source file and re-upload to include them.
                </Alert>
              ) : null}
              {warnings.length ? (
                <Alert tone="warning" title={`${warnings.length} row(s) will import with warnings`}>
                  Optional values are missing. These rows import, but the missing values will need filling in later.
                </Alert>
              ) : null}
              {!errors.length && !warnings.length ? (
                <Alert tone="success" title="All rows passed validation" />
              ) : null}
            </>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setStep(step === 'preview' ? 'select' : 'preview')}
              icon={<ArrowLeft className="size-4" />}
            >
              Back
            </Button>
            <Button onClick={advance} icon={<ArrowRight className="size-4" />}>
              {step === 'preview' ? 'Run validation' : 'Continue to confirmation'}
            </Button>
          </div>
        </>
      ) : null}

      {step === 'confirm' ? (
        <>
          <DetailCard title="Confirm the import">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Data type', value: entity },
                { label: 'File', value: fileName ?? '—' },
                {
                  label: 'Customer',
                  value: entity === 'Customers' ? 'Platform-wide' : (getTenant(data, tenantId)?.name ?? '—'),
                },
                { label: 'Rows to import', value: `${validRows} of ${rows.length}` },
              ].map((field) => (
                <div key={field.label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">{field.label}</dt>
                  <dd className="mt-1 text-sm text-ink-900">{field.value}</dd>
                </div>
              ))}
            </dl>

            <Alert tone="warning" className="mt-4" title="Nothing will actually be imported">
              Confirming records this run in the import history so the workflow can be reviewed. No customer, location,
              service, circuit or contract records are created.
            </Alert>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setStep('validate')} icon={<ArrowLeft className="size-4" />}>
                Back
              </Button>
              <Button onClick={advance} icon={<Upload className="size-4" />}>
                Confirm import
              </Button>
            </div>
          </DetailCard>
        </>
      ) : null}

      {step === 'success' ? (
        <DetailCard title="Import completed">
          <div className="flex flex-col items-center py-6 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-ok-50 text-ok-600">
              <CheckCircle2 className="size-6" />
            </span>
            <p className="mt-3 text-base font-semibold text-ink-900">Import completed successfully.</p>
            <p className="mt-1 max-w-md text-sm text-ink-500">
              {validRows} of {rows.length} rows from {fileName} passed validation
              {warnings.length ? `, ${warnings.length} with warnings` : ''}
              {errors.length ? `, and ${errors.length} were skipped` : ''}. The run has been added to the history
              below.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button onClick={restart} icon={<RotateCcw className="size-4" />}>
                Run another import
              </Button>
              <LinkButton to="/admin/dashboard" variant="secondary">
                Back to dashboard
              </LinkButton>
            </div>
          </div>
        </DetailCard>
      ) : null}

      <DetailCard title="Import history" description="Previous loads across the platform." flush>
        <DataTable
          rows={data.imports}
          rowKey={(row) => row.id}
          empty={<EmptyState dense icon={<Upload className="size-5" />} title="No imports have been run." />}
          columns={[
            {
              key: 'file',
              header: 'File',
              render: (row) => (
                <div>
                  <p className="font-medium text-ink-900">{row.fileName}</p>
                  <p className="text-xs text-ink-500">{row.entity}</p>
                </div>
              ),
            },
            {
              key: 'customer',
              header: 'Customer',
              hideBelow: 'md',
              render: (row) => getTenant(data, row.tenantId)?.name ?? 'Platform-wide',
            },
            { key: 'rows', header: 'Rows', align: 'right', render: (row) => formatNumber(row.rowsDetected) },
            { key: 'valid', header: 'Valid', align: 'right', hideBelow: 'sm', render: (row) => formatNumber(row.rowsValid) },
            {
              key: 'warnings',
              header: 'Warnings',
              align: 'right',
              hideBelow: 'lg',
              render: (row) => (row.warnings ? <span className="text-warn-700">{row.warnings}</span> : '—'),
            },
            {
              key: 'errors',
              header: 'Errors',
              align: 'right',
              hideBelow: 'lg',
              render: (row) => (row.errors ? <span className="text-danger-700">{row.errors}</span> : '—'),
            },
            { key: 'runAt', header: 'Run', hideBelow: 'md', render: (row) => formatDate(row.runAt) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </DetailCard>

      <ProtoNote label="Import rules are undefined">
        The column sets, the validation messages and the row counts here are all invented to make the workflow
        reviewable. Required columns, matching rules for existing records, update-versus-insert behaviour, partial-file
        handling and rollback were never defined and should be decided during discovery.
      </ProtoNote>
    </PageContainer>
  )
}
