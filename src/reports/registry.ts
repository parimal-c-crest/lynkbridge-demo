import {
  circuitHealth,
  contractMrc,
  daysUntil,
  getCarrier,
  getContract,
  getLocation,
  getService,
  getTenant,
  mrcByCarrier,
  mrcByCustomer,
  mrcByLocation,
  mrcByServiceType,
  renewalExposure,
  renewalRunway,
  renewalStatus,
  ticketsByMonth,
  ticketsByPriority,
  totalMrc,
} from '@/data/selectors'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Dataset } from '@/data/types'

/**
 * The report catalogue.
 *
 * Every report is a pure function over the already-scoped dataset, so a customer
 * running a report sees only their own records without any report needing to
 * know that tenancy exists. Each returns table rows — which is what makes CSV
 * export trivial — plus an optional chart spec the viewer renders above them.
 *
 * The catalogue itself is a prototype proposal. Which reports LynkBridge and its
 * customers actually need has not been defined.
 */

export type ReportCategory = 'Cost' | 'Inventory' | 'Contracts' | 'Support'

export interface ReportColumn {
  key: string
  header: string
  align?: 'right'
}

export type ReportChart =
  | { kind: 'bar'; rows: Array<{ label: string; value: number }>; money: boolean; ariaLabel: string }
  | {
      kind: 'column'
      rows: Array<{ label: string; longLabel?: string; value: number; emphasis?: boolean }>
      money: boolean
      valueLabel: string
      ariaLabel: string
    }
  | {
      kind: 'strip'
      slices: ReturnType<typeof circuitHealth>
      money: boolean
      ariaLabel: string
    }

export interface ReportResult {
  columns: ReportColumn[]
  rows: Array<Record<string, string | number>>
  /** Rendered as a footer row — the number the reader is usually after. */
  summary?: { label: string; value: string }
  chart?: ReportChart
}

export interface ReportDefinition {
  id: string
  name: string
  description: string
  category: ReportCategory
  /** Reports that only make sense across tenants. */
  adminOnly?: boolean
  run: (data: Dataset, options: { renewalWindowDays: number }) => ReportResult
}

const money = (value: number) => formatCurrency(value)

export const REPORTS: ReportDefinition[] = [
  {
    id: 'cost-by-service-type',
    name: 'Cost by service type',
    description: 'Monthly recurring cost grouped by the type of service delivered.',
    category: 'Cost',
    run: (data) => {
      const slices = mrcByServiceType(data)
      const total = totalMrc(data.services)

      return {
        columns: [
          { key: 'type', header: 'Service type' },
          { key: 'services', header: 'Services', align: 'right' },
          { key: 'mrc', header: 'Monthly cost', align: 'right' },
          { key: 'share', header: 'Share', align: 'right' },
        ],
        rows: slices.map((slice) => ({
          type: slice.label,
          services: data.services.filter((s) => s.status === 'Active' && s.type === slice.label).length,
          mrc: money(slice.value),
          share: total ? `${Math.round((slice.value / total) * 100)}%` : '0%',
        })),
        summary: { label: 'Total monthly cost', value: money(total) },
        chart: {
          kind: 'bar',
          money: true,
          rows: slices.map((slice) => ({ label: slice.label, value: slice.value })),
          ariaLabel: 'Monthly cost by service type',
        },
      }
    },
  },
  {
    id: 'cost-by-carrier',
    name: 'Cost by carrier',
    description: 'Spend distribution across providers — the vendor concentration view.',
    category: 'Cost',
    run: (data) => {
      const slices = mrcByCarrier(data)
      const total = totalMrc(data.services)

      return {
        columns: [
          { key: 'carrier', header: 'Carrier' },
          { key: 'services', header: 'Services', align: 'right' },
          { key: 'mrc', header: 'Monthly cost', align: 'right' },
          { key: 'share', header: 'Share', align: 'right' },
        ],
        rows: slices.map((slice) => {
          const carrier = data.carriers.find((c) => c.name === slice.label)
          return {
            carrier: slice.label,
            services: carrier
              ? data.services.filter((s) => s.status === 'Active' && s.carrierId === carrier.id).length
              : 0,
            mrc: money(slice.value),
            share: total ? `${Math.round((slice.value / total) * 100)}%` : '0%',
          }
        }),
        summary: { label: 'Total monthly cost', value: money(total) },
        chart: {
          kind: 'bar',
          money: true,
          rows: slices.map((slice) => ({ label: slice.label, value: slice.value })),
          ariaLabel: 'Monthly cost by carrier',
        },
      }
    },
  },
  {
    id: 'cost-by-location',
    name: 'Cost by location',
    description: 'Where monthly spend is concentrated, site by site.',
    category: 'Cost',
    run: (data) => {
      const slices = mrcByLocation(data)

      return {
        columns: [
          { key: 'location', header: 'Location' },
          { key: 'city', header: 'City' },
          { key: 'services', header: 'Services', align: 'right' },
          { key: 'mrc', header: 'Monthly cost', align: 'right' },
        ],
        rows: slices.map((slice) => {
          const locationId = slice.suffix?.split('/').pop()
          const location = getLocation(data, locationId)
          return {
            location: slice.label,
            city: location ? `${location.city}, ${location.state}` : '—',
            services: location
              ? data.services.filter((s) => s.status === 'Active' && s.locationId === location.id).length
              : 0,
            mrc: money(slice.value),
          }
        }),
        summary: { label: 'Total monthly cost', value: money(totalMrc(data.services)) },
        chart: {
          kind: 'bar',
          money: true,
          rows: slices.slice(0, 10).map((slice) => ({ label: slice.label, value: slice.value })),
          ariaLabel: 'Monthly cost by location',
        },
      }
    },
  },
  {
    id: 'cost-by-customer',
    name: 'Cost by customer',
    description: 'Monthly cost under management for each customer on the platform.',
    category: 'Cost',
    adminOnly: true,
    run: (data) => {
      const slices = mrcByCustomer(data)

      return {
        columns: [
          { key: 'customer', header: 'Customer' },
          { key: 'locations', header: 'Locations', align: 'right' },
          { key: 'services', header: 'Services', align: 'right' },
          { key: 'mrc', header: 'Monthly cost', align: 'right' },
        ],
        rows: slices.map((slice) => {
          const tenant = data.tenants.find((t) => t.name === slice.label)
          return {
            customer: slice.label,
            locations: tenant ? data.locations.filter((l) => l.tenantId === tenant.id).length : 0,
            services: tenant ? data.services.filter((s) => s.tenantId === tenant.id).length : 0,
            mrc: money(slice.value),
          }
        }),
        summary: { label: 'Total under management', value: money(totalMrc(data.services)) },
        chart: {
          kind: 'bar',
          money: true,
          rows: slices.map((slice) => ({ label: slice.label, value: slice.value })),
          ariaLabel: 'Monthly cost by customer',
        },
      }
    },
  },
  {
    id: 'renewal-schedule',
    name: 'Contract renewal schedule',
    description: 'Every contract by end date, with days remaining and the cost at stake.',
    category: 'Contracts',
    run: (data, { renewalWindowDays }) => {
      const contracts = [...data.contracts].sort((a, b) => a.endDate.localeCompare(b.endDate))
      const runway = renewalRunway(data, 12, renewalWindowDays)

      return {
        columns: [
          { key: 'contract', header: 'Contract' },
          { key: 'customer', header: 'Customer' },
          { key: 'provider', header: 'Provider' },
          { key: 'start', header: 'Start date' },
          { key: 'end', header: 'End date' },
          { key: 'days', header: 'Days remaining', align: 'right' },
          { key: 'mrc', header: 'Monthly cost', align: 'right' },
          { key: 'status', header: 'Renewal status' },
        ],
        rows: contracts.map((contract) => ({
          contract: contract.contractNumber,
          customer: getTenant(data, contract.tenantId)?.name ?? '—',
          provider: getCarrier(data, contract.carrierId)?.name ?? '—',
          start: formatDate(contract.startDate),
          end: formatDate(contract.endDate),
          days: daysUntil(contract.endDate),
          mrc: money(contractMrc(data, contract.id)),
          status: renewalStatus(contract, renewalWindowDays),
        })),
        summary: {
          label: `Contracts inside the ${renewalWindowDays}-day window`,
          value: String(
            contracts.filter((c) => renewalStatus(c, renewalWindowDays) === 'Expiring Soon').length,
          ),
        },
        chart: {
          kind: 'column',
          money: true,
          valueLabel: 'Monthly cost',
          rows: runway.map((month) => ({
            label: month.label,
            longLabel: month.longLabel,
            value: month.mrc,
            emphasis: month.urgent,
          })),
          ariaLabel: 'Monthly cost reaching contract end date over the next twelve months',
        },
      }
    },
  },
  {
    id: 'renewal-exposure',
    name: 'Renewal exposure',
    description: 'Monthly cost banded by how close each contract is to its end date.',
    category: 'Contracts',
    run: (data) => {
      const bands = renewalExposure(data)
      const total = bands.reduce((sum, band) => sum + band.value, 0)

      return {
        columns: [
          { key: 'band', header: 'Band' },
          { key: 'mrc', header: 'Monthly cost', align: 'right' },
          { key: 'share', header: 'Share', align: 'right' },
        ],
        rows: bands.map((band) => ({
          band: band.label,
          mrc: money(band.value),
          share: total ? `${Math.round((band.value / total) * 100)}%` : '0%',
        })),
        summary: { label: 'Total contracted monthly cost', value: money(total) },
        chart: { kind: 'strip', money: true, slices: bands, ariaLabel: 'Monthly cost by renewal proximity' },
      }
    },
  },
  {
    id: 'service-inventory',
    name: 'Service inventory',
    description: 'The full service estate with location, carrier, circuit, bandwidth and cost.',
    category: 'Inventory',
    run: (data) => ({
      columns: [
        { key: 'service', header: 'Service' },
        { key: 'type', header: 'Type' },
        { key: 'customer', header: 'Customer' },
        { key: 'location', header: 'Location' },
        { key: 'carrier', header: 'Carrier' },
        { key: 'bandwidth', header: 'Bandwidth' },
        { key: 'account', header: 'Account number' },
        { key: 'status', header: 'Status' },
        { key: 'mrc', header: 'Monthly cost', align: 'right' },
      ],
      rows: data.services.map((service) => ({
        service: service.name,
        type: service.type,
        customer: getTenant(data, service.tenantId)?.name ?? '—',
        location: getLocation(data, service.locationId)?.name ?? '—',
        carrier: getCarrier(data, service.carrierId)?.name ?? '—',
        bandwidth: service.bandwidth,
        account: service.accountNumber,
        status: service.status,
        mrc: money(service.mrc),
      })),
      summary: { label: 'Active monthly cost', value: money(totalMrc(data.services)) },
    }),
  },
  {
    id: 'circuit-inventory',
    name: 'Circuit inventory',
    description: 'Every circuit with its carrier account, bandwidth and current state.',
    category: 'Inventory',
    run: (data) => ({
      columns: [
        { key: 'circuit', header: 'Circuit ID' },
        { key: 'service', header: 'Service' },
        { key: 'customer', header: 'Customer' },
        { key: 'location', header: 'Location' },
        { key: 'carrier', header: 'Carrier' },
        { key: 'account', header: 'Carrier account' },
        { key: 'bandwidth', header: 'Bandwidth' },
        { key: 'status', header: 'Status' },
      ],
      rows: data.circuits.map((circuit) => {
        const service = getService(data, circuit.serviceId)
        return {
          circuit: circuit.circuitId,
          service: service?.name ?? '—',
          customer: service ? (getTenant(data, service.tenantId)?.name ?? '—') : '—',
          location: service ? (getLocation(data, service.locationId)?.name ?? '—') : '—',
          carrier: service ? (getCarrier(data, service.carrierId)?.name ?? '—') : '—',
          account: circuit.accountNumber,
          bandwidth: circuit.bandwidth,
          status: circuit.status,
        }
      }),
      summary: { label: 'Circuits', value: String(data.circuits.length) },
      chart: {
        kind: 'strip',
        money: false,
        slices: circuitHealth(data),
        ariaLabel: 'Circuits by current state',
      },
    }),
  },
  {
    id: 'ticket-volume',
    name: 'Ticket volume',
    description: 'Support tickets raised per month over the last twelve months.',
    category: 'Support',
    run: (data) => {
      const months = ticketsByMonth(data, 12)

      return {
        columns: [
          { key: 'month', header: 'Month' },
          { key: 'raised', header: 'Tickets raised', align: 'right' },
        ],
        rows: months.map((month) => ({ month: month.longLabel, raised: month.value })),
        summary: {
          label: 'Tickets in the period',
          value: String(months.reduce((sum, month) => sum + month.value, 0)),
        },
        chart: {
          kind: 'column',
          money: false,
          valueLabel: 'Tickets',
          rows: months.map((month) => ({ label: month.label, longLabel: month.longLabel, value: month.value })),
          ariaLabel: 'Tickets raised per month over the last twelve months',
        },
      }
    },
  },
  {
    id: 'ticket-register',
    name: 'Ticket register',
    description: 'Every ticket with its location, service, priority and current status.',
    category: 'Support',
    run: (data) => ({
      columns: [
        { key: 'number', header: 'Ticket' },
        { key: 'subject', header: 'Subject' },
        { key: 'customer', header: 'Customer' },
        { key: 'location', header: 'Location' },
        { key: 'service', header: 'Service' },
        { key: 'priority', header: 'Priority' },
        { key: 'status', header: 'Status' },
        { key: 'created', header: 'Created' },
        { key: 'updated', header: 'Updated' },
      ],
      rows: [...data.tickets]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((ticket) => ({
          number: ticket.number,
          subject: ticket.subject,
          customer: getTenant(data, ticket.tenantId)?.name ?? '—',
          location: getLocation(data, ticket.locationId)?.name ?? '—',
          service: getService(data, ticket.serviceId)?.name ?? '—',
          priority: ticket.priority,
          status: ticket.status,
          created: formatDate(ticket.createdAt),
          updated: formatDate(ticket.updatedAt),
        })),
      summary: {
        label: 'Open tickets',
        value: String(data.tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length),
      },
      chart: {
        kind: 'strip',
        money: false,
        slices: ticketsByPriority(data),
        ariaLabel: 'Tickets by priority',
      },
    }),
  },
  {
    id: 'contract-inventory',
    name: 'Contracts and cost',
    description: 'All contracts with term, dates and the services each one covers.',
    category: 'Contracts',
    run: (data, { renewalWindowDays }) => ({
      columns: [
        { key: 'contract', header: 'Contract' },
        { key: 'customer', header: 'Customer' },
        { key: 'provider', header: 'Provider' },
        { key: 'term', header: 'Term (months)', align: 'right' },
        { key: 'start', header: 'Start date' },
        { key: 'end', header: 'End date' },
        { key: 'services', header: 'Services', align: 'right' },
        { key: 'mrc', header: 'Monthly cost', align: 'right' },
        { key: 'status', header: 'Renewal status' },
      ],
      rows: data.contracts.map((contract) => ({
        contract: contract.contractNumber,
        customer: getTenant(data, contract.tenantId)?.name ?? '—',
        provider: getCarrier(data, contract.carrierId)?.name ?? '—',
        term: contract.termMonths,
        start: formatDate(contract.startDate),
        end: formatDate(contract.endDate),
        services: data.services.filter((s) => s.contractId === contract.id).length,
        mrc: money(contractMrc(data, contract.id)),
        status: renewalStatus(contract, renewalWindowDays),
      })),
      summary: { label: 'Contracts', value: String(data.contracts.length) },
    }),
  },
  {
    id: 'location-register',
    name: 'Location register',
    description: 'Every site with its address, service and circuit counts.',
    category: 'Inventory',
    run: (data) => ({
      columns: [
        { key: 'location', header: 'Location' },
        { key: 'customer', header: 'Customer' },
        { key: 'address', header: 'Address' },
        { key: 'city', header: 'City' },
        { key: 'state', header: 'State' },
        { key: 'type', header: 'Site type' },
        { key: 'services', header: 'Services', align: 'right' },
        { key: 'status', header: 'Status' },
      ],
      rows: data.locations.map((location) => ({
        location: location.name,
        customer: getTenant(data, location.tenantId)?.name ?? '—',
        address: location.addressLine,
        city: location.city,
        state: location.state,
        type: location.siteType,
        services: data.services.filter((s) => s.locationId === location.id).length,
        status: location.status,
      })),
      summary: { label: 'Locations', value: String(data.locations.length) },
    }),
  },
]

export const reportsForRole = (isAdmin: boolean): ReportDefinition[] =>
  REPORTS.filter((report) => isAdmin || !report.adminOnly)

export const getReport = (id: string | undefined) => REPORTS.find((report) => report.id === id)

export const REPORT_CATEGORIES: ReportCategory[] = ['Cost', 'Contracts', 'Inventory', 'Support']

/** Kept for the contract-detail report links; unused elsewhere. */
export const contractReportLabel = (data: Dataset, contractId: string) =>
  getContract(data, contractId)?.contractNumber ?? contractId
