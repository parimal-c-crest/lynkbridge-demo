import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard, FieldGrid } from '@/components/ui/DetailCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatCard } from '@/components/ui/StatCard'
import { Tabs } from '@/components/ui/Tabs'
import { Alert } from '@/components/ui/Alert'
import { DataTable } from '@/components/data/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePortal } from '@/lib/usePortal'
import { formatCurrency, formatDate, formatDaysRemaining } from '@/lib/format'
import {
  contractMrc,
  daysUntil,
  documentsOnContract,
  getCarrier,
  getContract,
  getTenant,
  locationsOnContract,
  servicesOnContract,
} from '@/data/selectors'
import { ContractServicesTable, RelatedDocumentsTable } from './RelatedTables'
import { NotFoundRecord } from './NotFoundRecord'

export function ContractDetailPage() {
  const { id } = useParams()
  const { data, isAdmin, path, statusOf } = usePortal()
  const [tab, setTab] = useState('overview')

  const contract = getContract(data, id)

  if (!contract) {
    return (
      <NotFoundRecord
        title="Contract not found"
        description="This contract does not exist, or it belongs to another customer."
        backTo={path('/contracts')}
        backLabel="Back to contracts"
      />
    )
  }

  const carrier = getCarrier(data, contract.carrierId)
  const tenant = getTenant(data, contract.tenantId)
  const services = servicesOnContract(data, contract.id)
  const locations = locationsOnContract(data, contract.id)
  const documents = documentsOnContract(data, contract.id)
  const mrc = contractMrc(data, contract.id)
  const remaining = daysUntil(contract.endDate)
  const status = statusOf(contract)

  return (
    <PageContainer
      title={contract.contractNumber}
      description={`${carrier?.name ?? 'Provider'} agreement over a ${contract.termMonths}-month term`}
      breadcrumbs={[
        { label: isAdmin ? 'Admin' : 'Portal', to: path('/dashboard') },
        { label: 'Contracts', to: path('/contracts') },
        { label: contract.contractNumber },
      ]}
      meta={
        <>
          <StatusBadge status={status} />
          <span className="text-xs text-ink-500">{formatDaysRemaining(remaining)}</span>
          {isAdmin && tenant ? <span className="text-xs text-ink-500">· {tenant.name}</span> : null}
        </>
      }
    >
      {status !== 'Active' ? (
        <Alert
          tone={status === 'Expired' ? 'error' : 'warning'}
          title={status === 'Expired' ? 'This contract has passed its end date' : 'This contract is approaching renewal'}
        >
          {status === 'Expired'
            ? `The end date was ${formatDate(contract.endDate)}. Confirm whether the services below are still being billed.`
            : `The end date is ${formatDate(contract.endDate)} — ${formatDaysRemaining(remaining).toLowerCase()}. ${contract.notes}`}
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Monthly cost" value={formatCurrency(mrc)} hint="Rolled up from services" />
        <StatCard label="Services" value={services.length} />
        <StatCard label="Locations" value={locations.length} />
        <StatCard
          label="Renewal"
          value={status}
          tone={status === 'Expired' ? 'danger' : status === 'Expiring Soon' ? 'warn' : 'default'}
        />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          {
            key: 'overview',
            label: 'Overview',
            content: (
              <DetailCard title="Contract details">
                <FieldGrid
                  fields={[
                    { label: 'Contract ID', value: contract.contractNumber },
                    ...(isAdmin && tenant
                      ? [{ label: 'Customer', value: tenant.name, to: `/admin/customers/${tenant.id}` }]
                      : []),
                    {
                      label: 'Provider',
                      value: carrier?.name ?? '—',
                      to: isAdmin && carrier ? `/admin/carriers/${carrier.id}` : undefined,
                    },
                    { label: 'Start date', value: formatDate(contract.startDate) },
                    { label: 'End date', value: formatDate(contract.endDate) },
                    { label: 'Term', value: `${contract.termMonths} months` },
                    { label: 'Monthly cost (MRC)', value: formatCurrency(mrc) },
                    { label: 'Renewal status', value: <StatusBadge status={status} /> },
                    { label: 'Auto-renew flag', value: contract.autoRenew ? 'Yes' : 'No' },
                    { label: 'Notes', value: contract.notes, wide: true },
                  ]}
                />
              </DetailCard>
            ),
          },
          {
            key: 'services',
            label: 'Services',
            count: services.length,
            content: (
              <DetailCard
                title="Services on this contract"
                description="Monthly cost shown here is what the contract total is calculated from."
                flush
              >
                <ContractServicesTable services={services} />
              </DetailCard>
            ),
          },
          {
            key: 'locations',
            label: 'Locations',
            count: locations.length,
            content: (
              <DetailCard title="Locations covered" flush>
                <DataTable
                  rows={locations}
                  rowKey={(row) => row.id}
                  rowHref={(row) => path(`/locations/${row.id}`)}
                  empty={<EmptyState dense title="No locations" />}
                  columns={[
                    {
                      key: 'name',
                      header: 'Location',
                      render: (row) => <span className="font-medium text-ink-900">{row.name}</span>,
                    },
                    { key: 'city', header: 'City', render: (row) => `${row.city}, ${row.state}` },
                    { key: 'type', header: 'Site type', hideBelow: 'md', render: (row) => row.siteType },
                    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
                  ]}
                />
              </DetailCard>
            ),
          },
          {
            key: 'documents',
            label: 'Documents',
            count: documents.length,
            content: (
              <DetailCard
                title="Documents"
                description="Contract paperwork, plus documents held against the services it covers."
                flush
              >
                <RelatedDocumentsTable documents={documents} />
              </DetailCard>
            ),
          },
        ]}
      />
    </PageContainer>
  )
}
