import { useState } from 'react'
import { Download, FileText, Upload } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { CollectionTable } from '@/components/data/CollectionTable'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { Select, TextInput, FileUpload } from '@/components/forms/Fields'
import { useCollection } from '@/lib/useCollection'
import { usePortal } from '@/lib/usePortal'
import { formatDate } from '@/lib/format'
import { describeRelatedEntity, getLocation, getTenant } from '@/data/selectors'
import { DOCUMENT_TYPES, type DocumentRecord, type DocumentType } from '@/data/types'
import { useData } from '@/state/DataContext'
import { useToast } from '@/state/ToastContext'
import type { Column } from '@/components/data/DataTable'

export function DocumentsListPage() {
  const { data, isAdmin, path, session } = usePortal()
  const { uploadDocument } = useData()
  const { notify } = useToast()

  const [uploadOpen, setUploadOpen] = useState(false)

  const collection = useCollection<DocumentRecord>({
    rows: data.documents,
    searchText: (row) =>
      [row.name, row.type, row.uploadedBy, getTenant(data, row.tenantId)?.name, describeRelatedEntity(data, row).label]
        .filter(Boolean)
        .join(' '),
    filters: [
      { key: 'type', label: 'Document types', options: [...DOCUMENT_TYPES], value: (row) => row.type },
      { key: 'related', label: 'Related record types', value: (row) => row.relatedEntityType },
      ...(isAdmin
        ? [
            {
              key: 'customer',
              label: 'Customers',
              value: (row: DocumentRecord) => getTenant(data, row.tenantId)?.name ?? '—',
            },
          ]
        : []),
    ],
    sorts: [
      { key: 'recent', label: 'Most recent', compare: (a, b) => b.uploadedAt.localeCompare(a.uploadedAt) },
      { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    ],
    defaultSortKey: 'recent',
  })

  const columns: Column<DocumentRecord>[] = [
    {
      key: 'name',
      header: 'Document Name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded bg-ink-100 text-[10px] font-semibold uppercase text-ink-500">
            {row.fileKind}
          </span>
          <span className="font-medium text-ink-900">{row.name}</span>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => row.type },
    ...(isAdmin
      ? [
          {
            key: 'customer',
            header: 'Customer',
            hideBelow: 'lg' as const,
            render: (row: DocumentRecord) => getTenant(data, row.tenantId)?.name ?? '—',
          },
        ]
      : []),
    {
      key: 'location',
      header: 'Location',
      hideBelow: 'xl',
      render: (row) => getLocation(data, row.locationId)?.name ?? <span className="text-ink-400">—</span>,
    },
    {
      key: 'related',
      header: 'Related Entity',
      hideBelow: 'md',
      render: (row) => {
        const related = describeRelatedEntity(data, row)
        return (
          <span>
            <span className="text-ink-800">{related.label}</span>
            <span className="ml-1.5 text-xs text-ink-400">{row.relatedEntityType}</span>
          </span>
        )
      },
    },
    { key: 'uploaded', header: 'Uploaded', hideBelow: 'sm', render: (row) => formatDate(row.uploadedAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: () => (
        <button
          onClick={(event) => {
            event.stopPropagation()
            notify({
              tone: 'info',
              title: 'Download simulated',
              description: `This is not a real file — document storage is out of scope for the prototype.`,
            })
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
        >
          <Download className="size-3.5" />
          Download
        </button>
      ),
    },
  ]

  return (
    <PageContainer
      title="Documents"
      description="Contracts, invoices, service orders and site documentation held against your records."
      actions={
        <Button icon={<Upload className="size-4" />} onClick={() => setUploadOpen(true)}>
          Upload document
        </Button>
      }
    >
      <CollectionTable
        collection={collection}
        columns={columns}
        rowKey={(row) => row.id}
        rowHref={(row) => path(`/documents/${row.id}`)}
        filters={[
          { key: 'type', label: 'Document types' },
          { key: 'related', label: 'Related record types' },
          ...(isAdmin ? [{ key: 'customer', label: 'Customers' }] : []),
        ]}
        sorts={[
          { key: 'recent', label: 'Most recent' },
          { key: 'name', label: 'Name (A–Z)' },
        ]}
        searchPlaceholder="Search documents by name, type or related record…"
        noun="documents"
        emptyTitle="No documents have been uploaded."
        emptyDescription="Contracts, invoices and site documentation will appear here."
        emptyAction={
          <Button icon={<Upload className="size-4" />} onClick={() => setUploadOpen(true)}>
            Upload document
          </Button>
        }
      />

      <ProtoNote label="What document management does and does not do here">
        Uploads capture the file name only — nothing is stored, transmitted or retrievable, and preview and download
        are simulated. The document categories shown are placeholders: the discussion confirmed that document storage
        is needed but no taxonomy, permission model or versioning rule has been defined.
      </ProtoNote>

      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={(input) => {
          const created = uploadDocument({
            tenantId: input.tenantId,
            name: input.name,
            type: input.type,
            relatedEntityType: input.locationId ? 'Location' : 'Customer',
            relatedEntityId: input.locationId ?? input.tenantId,
            locationId: input.locationId,
            uploadedBy: session.name,
            sizeKb: 480,
          })
          setUploadOpen(false)
          notify({
            tone: 'success',
            title: 'Document added to the prototype',
            description: `${created.name} was added to this session only — no file was stored.`,
          })
        }}
      />
    </PageContainer>
  )
}

interface UploadInput {
  name: string
  type: DocumentType
  tenantId: string
  locationId: string | null
}

function UploadDocumentModal({
  open,
  onClose,
  onUpload,
}: {
  open: boolean
  onClose: () => void
  onUpload: (input: UploadInput) => void
}) {
  const { data, isAdmin, session } = usePortal()

  const [fileName, setFileName] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [type, setType] = useState<DocumentType>('Contract')
  const [tenantId, setTenantId] = useState(session.tenantId ?? data.tenants[0]?.id ?? '')
  const [locationId, setLocationId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const locations = data.locations.filter((location) => location.tenantId === tenantId)

  const reset = () => {
    setFileName(null)
    setDisplayName('')
    setType('Contract')
    setLocationId('')
    setError(null)
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = () => {
    if (!fileName) {
      setError('Choose a file to continue.')
      return
    }
    if (isAdmin && !tenantId) {
      setError('Select which customer this document belongs to.')
      return
    }

    onUpload({
      name: displayName.trim() || fileName,
      type,
      tenantId,
      locationId: locationId || null,
    })
    reset()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Upload document"
      description="Attach a document to a customer record."
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} icon={<FileText className="size-4" />}>
            Add document
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="warning" title="Nothing is actually stored">
          The prototype records the file name so the workflow can be demonstrated. The file itself is never read or
          uploaded.
        </Alert>

        <FileUpload
          label="File"
          required
          value={fileName}
          onChange={setFileName}
          hint="PDF, Word, Excel or image — name captured only."
        />

        <TextInput
          label="Display name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={fileName ?? 'Defaults to the file name'}
        />

        <Select
          label="Document type"
          required
          value={type}
          onChange={(event) => setType(event.target.value as DocumentType)}
          options={DOCUMENT_TYPES.map((value) => ({ value, label: value }))}
          hint="Prototype categories — the real taxonomy is unconfirmed."
        />

        {isAdmin ? (
          <Select
            label="Customer"
            required
            value={tenantId}
            onChange={(event) => {
              setTenantId(event.target.value)
              setLocationId('')
            }}
            options={data.tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
          />
        ) : null}

        <Select
          label="Location"
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
          options={locations.map((location) => ({ value: location.id, label: location.name }))}
          placeholder="Not location-specific"
        />

        {error ? <Alert tone="error">{error}</Alert> : null}
      </div>
    </Modal>
  )
}
