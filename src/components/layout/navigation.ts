import {
  BarChart3,
  Building2,
  Cable,
  FileSignature,
  FileText,
  Gauge,
  LifeBuoy,
  MapPin,
  Network,
  Radio,
  Settings,
  Upload,
  UserCircle,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { UserRole } from '@/data/types'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Optional grouping heading rendered above the item. */
  section?: string
}

/** Customer navigation — exactly the areas the specification lists. */
export const CUSTOMER_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/customer/dashboard', icon: Gauge },
  { label: 'Locations', to: '/customer/locations', icon: MapPin, section: 'Inventory' },
  { label: 'Services', to: '/customer/services', icon: Network },
  { label: 'Circuits', to: '/customer/circuits', icon: Cable },
  { label: 'Contracts', to: '/customer/contracts', icon: FileSignature, section: 'Commercial' },
  { label: 'Documents', to: '/customer/documents', icon: FileText },
  { label: 'Tickets', to: '/customer/tickets', icon: LifeBuoy, section: 'Support' },
  { label: 'Reports', to: '/customer/reports', icon: BarChart3, section: 'Insights' },
  { label: 'Profile', to: '/customer/profile', icon: UserCircle, section: 'Account' },
  { label: 'Settings', to: '/customer/settings', icon: Settings },
]

/** LynkBridge admin navigation — adds the platform-only areas. */
export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: Gauge },
  { label: 'Customers', to: '/admin/customers', icon: Building2, section: 'Customers' },
  { label: 'Locations', to: '/admin/locations', icon: MapPin },
  { label: 'Services', to: '/admin/services', icon: Network, section: 'Inventory' },
  { label: 'Circuits', to: '/admin/circuits', icon: Cable },
  { label: 'Carriers', to: '/admin/carriers', icon: Radio },
  { label: 'Contracts', to: '/admin/contracts', icon: FileSignature, section: 'Commercial' },
  { label: 'Documents', to: '/admin/documents', icon: FileText },
  { label: 'Tickets', to: '/admin/tickets', icon: LifeBuoy, section: 'Support' },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3, section: 'Insights' },
  { label: 'Imports', to: '/admin/imports', icon: Upload, section: 'Platform' },
  { label: 'Users & Roles', to: '/admin/users', icon: Users },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]

export const navForRole = (role: UserRole): NavItem[] =>
  role === 'LynkBridge Admin' ? ADMIN_NAV : CUSTOMER_NAV

/** Route prefix for the signed-in role — lets shared pages build correct links. */
export const basePathForRole = (role: UserRole): '/admin' | '/customer' =>
  role === 'LynkBridge Admin' ? '/admin' : '/customer'
