/**
 * Curated source values for generated mock data.
 *
 * All names, addresses, contacts and account numbers are fictional. No real
 * client or customer data appears anywhere in this prototype.
 */
import type { DocumentType, ServiceType, TicketPriority } from './types'

export const CARRIER_SEED = [
  { name: 'Atlas Telecom', accountManager: 'Dana Whitfield' },
  { name: 'Meridian Fiber', accountManager: 'Owen Brandt' },
  { name: 'Northgate Broadband', accountManager: 'Priya Raman' },
  { name: 'Sable Networks', accountManager: 'Marcus Ellery' },
  { name: 'Crosswind Communications', accountManager: 'Lena Alvarez' },
  { name: 'Ironwood Connect', accountManager: 'Theo Nakamura' },
  { name: 'Pinnacle Wireless', accountManager: 'Grace Okonjo' },
  { name: 'Beacon Voice Services', accountManager: 'Sam Rutherford' },
]

export const CITIES: Array<[string, string]> = [
  ['Columbus', 'OH'],
  ['Charlotte', 'NC'],
  ['Austin', 'TX'],
  ['Denver', 'CO'],
  ['Tampa', 'FL'],
  ['Nashville', 'TN'],
  ['Kansas City', 'MO'],
  ['Phoenix', 'AZ'],
  ['Indianapolis', 'IN'],
  ['Richmond', 'VA'],
  ['Boise', 'ID'],
  ['Omaha', 'NE'],
  ['Louisville', 'KY'],
  ['Greenville', 'SC'],
  ['Albany', 'NY'],
  ['Reno', 'NV'],
  ['Madison', 'WI'],
  ['Chattanooga', 'TN'],
  ['Fresno', 'CA'],
  ['Allentown', 'PA'],
]

export const STREETS = [
  'Commerce Park Dr',
  'Industrial Pkwy',
  'Meridian Blvd',
  'Harborview Rd',
  'Cedar Ridge Way',
  'Lakeside Ave',
  'Summit Trade Ct',
  'Foundry St',
  'Willow Creek Dr',
  'Northfield Rd',
  'Beacon Hill Rd',
  'Stonebridge Ln',
]

export const SITE_TYPES = [
  'Headquarters',
  'Regional Office',
  'Distribution Center',
  'Branch',
  'Warehouse',
  'Retail Site',
  'Data Center',
  'Clinic',
]

/** Bandwidth options that make sense for each service type. */
export const BANDWIDTH_BY_TYPE: Record<ServiceType, string[]> = {
  Internet: ['200 Mbps', '300 Mbps', '500 Mbps', '1 Gbps'],
  Fiber: ['500 Mbps', '1 Gbps', '2 Gbps', '10 Gbps'],
  DIA: ['100 Mbps', '250 Mbps', '500 Mbps', '1 Gbps'],
  Voice: ['24 channels', '48 channels', 'SIP 60 sessions', 'SIP 120 sessions'],
  'SD-WAN': ['Dual 500 Mbps', 'Dual 1 Gbps', 'Hybrid 1 Gbps'],
  'Wireless Backup': ['LTE 100 Mbps', '5G 200 Mbps', '5G 400 Mbps'],
  Security: ['Managed firewall', 'Managed UTM', 'DDoS mitigation'],
  Other: ['Not applicable'],
}

/** Rough monthly cost band per service type, in USD. */
export const MRC_BAND_BY_TYPE: Record<ServiceType, [number, number]> = {
  Internet: [280, 900],
  Fiber: [900, 3200],
  DIA: [650, 2400],
  Voice: [180, 780],
  'SD-WAN': [700, 2100],
  'Wireless Backup': [120, 460],
  Security: [240, 1400],
  Other: [90, 500],
}

export const SERVICE_TYPE_WEIGHTS: ServiceType[] = [
  'Internet',
  'Internet',
  'Fiber',
  'Fiber',
  'DIA',
  'DIA',
  'Voice',
  'Voice',
  'SD-WAN',
  'Wireless Backup',
  'Security',
  'Other',
]

/** Service types delivered over a physical circuit. */
export const CIRCUIT_BEARING_TYPES: ServiceType[] = [
  'Internet',
  'Fiber',
  'DIA',
  'SD-WAN',
  'Wireless Backup',
  'Voice',
]

export const DEMARCATIONS = [
  'MPOE — Suite 100 telecom room',
  'Rack B4, patch panel 2',
  'Basement MDF, position 14',
  'IDF closet, 2nd floor east',
  'Roof-mounted antenna, NE corner',
  'Main telecom room, rack A1',
]

export const DOCUMENT_TEMPLATES: Array<{ type: DocumentType; label: string; kind: 'pdf' | 'xlsx' | 'docx' | 'png' }> = [
  { type: 'Contract', label: 'Master Service Agreement', kind: 'pdf' },
  { type: 'Contract', label: 'Service Renewal Addendum', kind: 'pdf' },
  { type: 'Invoice', label: 'Monthly Invoice', kind: 'pdf' },
  { type: 'Invoice', label: 'Billing Reconciliation', kind: 'xlsx' },
  { type: 'Service Order', label: 'Service Order Form', kind: 'pdf' },
  { type: 'Service Order', label: 'Install Work Order', kind: 'docx' },
  { type: 'Letter of Agency', label: 'Letter of Agency', kind: 'pdf' },
  { type: 'Network Diagram', label: 'Site Network Diagram', kind: 'png' },
  { type: 'SLA', label: 'Service Level Agreement', kind: 'pdf' },
  { type: 'Other', label: 'Site Survey Notes', kind: 'docx' },
]

export const TICKET_TEMPLATES: Array<{
  subject: string
  description: string
  priority: TicketPriority
}> = [
  {
    subject: 'Intermittent packet loss on primary circuit',
    description:
      'Users report dropped video calls throughout the afternoon. Local testing shows periodic packet loss on the primary connection. Requesting a carrier line test.',
    priority: 'High',
  },
  {
    subject: 'Request bandwidth upgrade evaluation',
    description:
      'Site is regularly saturating the current connection during business hours. Please provide upgrade options and pricing for the next contract term.',
    priority: 'Low',
  },
  {
    subject: 'Voice service — one-way audio on outbound calls',
    description:
      'Several outbound calls have one-way audio. Issue started after the weekend. Handsets have been rebooted with no change.',
    priority: 'High',
  },
  {
    subject: 'Confirm contract end date before renewal',
    description:
      'We need written confirmation of the contract end date and notice period before we begin internal renewal approval.',
    priority: 'Medium',
  },
  {
    subject: 'Wireless backup did not fail over during outage',
    description:
      'During the brief primary outage the wireless backup did not take over. Please review the failover configuration.',
    priority: 'Critical',
  },
  {
    subject: 'Add new user to the customer portal',
    description: 'Please add our new facilities coordinator so they can view location and service records.',
    priority: 'Low',
  },
  {
    subject: 'Billing discrepancy on latest invoice',
    description:
      'The most recent invoice shows a service we believe was disconnected last quarter. Requesting review and correction.',
    priority: 'Medium',
  },
  {
    subject: 'Schedule install for new location',
    description:
      'New site opens next quarter. We need connectivity scheduled ahead of the opening date and a survey booked.',
    priority: 'Medium',
  },
  {
    subject: 'Firewall rule change request',
    description: 'Requesting an additional inbound rule for the new vendor management system. Details attached.',
    priority: 'Low',
  },
  {
    subject: 'Circuit down — site offline',
    description: 'Site is completely offline. No link light on the carrier handoff. Requesting emergency dispatch.',
    priority: 'Critical',
  },
]

export const FIRST_NAMES = [
  'Alicia',
  'Marcus',
  'Priya',
  'Devon',
  'Rosa',
  'Ethan',
  'Naomi',
  'Curtis',
  'Bianca',
  'Hugo',
  'Simone',
  'Trevor',
  'Yara',
  'Colin',
  'Marisol',
  'Desmond',
]

export const LAST_NAMES = [
  'Fontaine',
  'Delgado',
  'Whitmore',
  'Okafor',
  'Lindqvist',
  'Barrera',
  'Castellano',
  'Ashford',
  'Nakamura',
  'Bright',
  'Vasquez',
  'Holloway',
  'Sarkis',
  'Mercer',
]

export const CUSTOMER_TITLES = [
  'IT Director',
  'Facilities Manager',
  'Network Administrator',
  'VP Operations',
  'Regional IT Lead',
  'Procurement Manager',
]
