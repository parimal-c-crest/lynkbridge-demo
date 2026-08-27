import { useParams } from 'react-router-dom'
import { Download, Eye, FileText } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard, FieldGrid } from '@/components/ui/DetailCard'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { usePortal } from '@/lib/usePortal'
import { formatDate, formatFileSize } from '@/lib/format'
import { describeRelatedEntity, getDocument, getLocation, getTenant } from '@/data/selectors'
import { useToast } from '@/state/ToastContext'
import { NotFoundRecord } from './NotFoundRecord'

export function DocumentDetailPage() {
  const { id } = useParams()
  const { data, isAdmin, path } = usePortal()
  const { notify } = useToast()

  const document = getDocument(data, id)

  if (!document) {
    return (
      <NotFoundRecord
        title="Document not found"
        description="This document does not exist, or it belongs to another customer."
        backTo={path('/documents')}
        backLabel="Back to documents"
      />
    )
  }

  const tenant = getTenant(data, document.tenantId)
  const location = getLocation(data, document.locationId)
  const related = describeRelatedEntity(data, document)

  // Customer records live only under /admin, so a customer user sees the label
  // without a link rather than a route they cannot reach.
  const relatedHref =
    related.suffix && (!related.adminOnly || isAdmin) ? path(related.suffix) : null

  const simulate = (action: string) =>
    notify({
      tone: 'info',
      title: `${action} simulated`,
      description: 'No file exists behind this record — document storage is out of scope for the prototype.',
    })

  return (
    <PageContainer
      title={document.name}
      description={`${document.type} · uploaded ${formatDate(document.uploadedAt)} by ${document.uploadedBy}`}
      breadcrumbs={[
        { label: isAdmin ? 'Admin' : 'Portal', to: path('/dashboard') },
        { label: 'Documents', to: path('/documents') },
        { label: document.name },
      ]}
      actions={
        <>
          <Button variant="secondary" icon={<Eye className="size-4" />} onClick={() => simulate('Preview')}>
            Preview
          </Button>
          <Button icon={<Download className="size-4" />} onClick={() => simulate('Download')}>
            Download
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <DetailCard title="Document details" className="lg:col-span-2">
          <FieldGrid
            columns={2}
            fields={[
              { label: 'Document name', value: document.name },
              { label: 'Type', value: document.type },
              ...(isAdmin && tenant
                ? [{ label: 'Customer', value: tenant.name, to: `/admin/customers/${tenant.id}` }]
                : []),
              {
                label: 'Location',
                value: location?.name ?? 'Not location-specific',
                to: location ? path(`/locations/${location.id}`) : undefined,
              },
              {
                label: `Related ${document.relatedEntityType.toLowerCase()}`,
                value: related.label,
                to: relatedHref ?? undefined,
              },
              { label: 'Uploaded', value: formatDate(document.uploadedAt) },
              { label: 'Uploaded by', value: document.uploadedBy },
              { label: 'File size', value: formatFileSize(document.sizeKb) },
            ]}
          />
        </DetailCard>

        <DetailCard title="Preview">
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-ink-300 bg-ink-50 px-4 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-lg bg-white text-xs font-semibold uppercase text-ink-500 ring-1 ring-ink-200">
              {document.fileKind}
            </span>
            <p className="mt-3 text-sm font-medium text-ink-700">Preview placeholder</p>
            <p className="mt-1 text-xs text-ink-500">
              Document rendering is not implemented in this prototype.
            </p>
          </div>
        </DetailCard>
      </div>

      <Alert tone="warning" title="Simulated document management">
        <p className="leading-relaxed">
          This record describes a document, but no file is stored anywhere. Preview and download do nothing beyond
          confirming the action. Real storage, permissions, versioning and retention rules are undefined and out of
          scope for this prototype.
        </p>
      </Alert>

      <p className="flex items-center gap-1.5 text-xs text-ink-400">
        <FileText className="size-3.5" />
        Document taxonomy shown here is prototype data pending client confirmation.
      </p>
    </PageContainer>
  )
}
