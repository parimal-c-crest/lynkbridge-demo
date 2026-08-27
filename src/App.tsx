import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from '@/components/ui/Toaster'

import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RoadmapPage } from '@/pages/RoadmapPage'

import { CustomerDashboardPage } from '@/pages/customer/CustomerDashboardPage'
import { ProfilePage } from '@/pages/customer/ProfilePage'

import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { CustomersListPage } from '@/pages/admin/CustomersListPage'
import { CustomerDetailPage } from '@/pages/admin/CustomerDetailPage'
import { CarrierDetailPage, CarriersListPage } from '@/pages/admin/CarriersPages'
import { ImportsPage } from '@/pages/admin/ImportsPage'
import { UserDetailPage, UsersListPage } from '@/pages/admin/UsersPages'

import { LocationsListPage } from '@/pages/shared/LocationsListPage'
import { LocationCreatePage } from '@/pages/shared/LocationCreatePage'
import { LocationDetailPage } from '@/pages/shared/LocationDetailPage'
import { ServicesListPage } from '@/pages/shared/ServicesListPage'
import { ServiceCreatePage } from '@/pages/shared/ServiceCreatePage'
import { ServiceDetailPage } from '@/pages/shared/ServiceDetailPage'
import { CircuitsListPage } from '@/pages/shared/CircuitsListPage'
import { CircuitCreatePage } from '@/pages/shared/CircuitCreatePage'
import { CircuitDetailPage } from '@/pages/shared/CircuitDetailPage'
import { ContractsListPage } from '@/pages/shared/ContractsListPage'
import { ContractCreatePage } from '@/pages/shared/ContractCreatePage'
import { ContractDetailPage } from '@/pages/shared/ContractDetailPage'
import { DocumentsListPage } from '@/pages/shared/DocumentsListPage'
import { DocumentDetailPage } from '@/pages/shared/DocumentDetailPage'
import { TicketsListPage } from '@/pages/shared/TicketsListPage'
import { TicketCreatePage } from '@/pages/shared/TicketCreatePage'
import { TicketDetailPage } from '@/pages/shared/TicketDetailPage'
import { ReportsListPage } from '@/pages/shared/ReportsListPage'
import { ReportViewPage } from '@/pages/shared/ReportViewPage'
import { SettingsPage } from '@/pages/shared/SettingsPage'

/**
 * Route map.
 *
 * Customer and admin mount the same shared screens under different prefixes —
 * the screens read the signed-in role to decide their own links and whether a
 * Customer column applies. AppShell enforces which prefix each role may use.
 *
 * Note: every /new route is declared before its /:id sibling so "new" is never
 * parsed as a record identifier.
 */
export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />

        <Route element={<AppShell requiredRole="Customer User" />}>
          <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
          <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
          <Route path="/customer/locations" element={<LocationsListPage />} />
          <Route path="/customer/locations/new" element={<LocationCreatePage />} />
          <Route path="/customer/locations/:id" element={<LocationDetailPage />} />
          <Route path="/customer/services" element={<ServicesListPage />} />
          <Route path="/customer/services/new" element={<ServiceCreatePage />} />
          <Route path="/customer/services/:id" element={<ServiceDetailPage />} />
          <Route path="/customer/circuits" element={<CircuitsListPage />} />
          <Route path="/customer/circuits/new" element={<CircuitCreatePage />} />
          <Route path="/customer/circuits/:id" element={<CircuitDetailPage />} />
          <Route path="/customer/contracts" element={<ContractsListPage />} />
          <Route path="/customer/contracts/new" element={<ContractCreatePage />} />
          <Route path="/customer/contracts/:id" element={<ContractDetailPage />} />
          <Route path="/customer/documents" element={<DocumentsListPage />} />
          <Route path="/customer/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/customer/tickets" element={<TicketsListPage />} />
          <Route path="/customer/tickets/new" element={<TicketCreatePage />} />
          <Route path="/customer/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/customer/reports" element={<ReportsListPage />} />
          <Route path="/customer/reports/:id" element={<ReportViewPage />} />
          <Route path="/customer/profile" element={<ProfilePage />} />
          <Route path="/customer/settings" element={<SettingsPage />} />
        </Route>

        <Route element={<AppShell requiredRole="LynkBridge Admin" />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/customers" element={<CustomersListPage />} />
          <Route path="/admin/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/admin/locations" element={<LocationsListPage />} />
          <Route path="/admin/locations/new" element={<LocationCreatePage />} />
          <Route path="/admin/locations/:id" element={<LocationDetailPage />} />
          <Route path="/admin/services" element={<ServicesListPage />} />
          <Route path="/admin/services/new" element={<ServiceCreatePage />} />
          <Route path="/admin/services/:id" element={<ServiceDetailPage />} />
          <Route path="/admin/circuits" element={<CircuitsListPage />} />
          <Route path="/admin/circuits/new" element={<CircuitCreatePage />} />
          <Route path="/admin/circuits/:id" element={<CircuitDetailPage />} />
          <Route path="/admin/carriers" element={<CarriersListPage />} />
          <Route path="/admin/carriers/:id" element={<CarrierDetailPage />} />
          <Route path="/admin/contracts" element={<ContractsListPage />} />
          <Route path="/admin/contracts/new" element={<ContractCreatePage />} />
          <Route path="/admin/contracts/:id" element={<ContractDetailPage />} />
          <Route path="/admin/documents" element={<DocumentsListPage />} />
          <Route path="/admin/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/admin/tickets" element={<TicketsListPage />} />
          <Route path="/admin/tickets/new" element={<TicketCreatePage />} />
          <Route path="/admin/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/admin/imports" element={<ImportsPage />} />
          <Route path="/admin/users" element={<UsersListPage />} />
          <Route path="/admin/users/:id" element={<UserDetailPage />} />
          <Route path="/admin/reports" element={<ReportsListPage />} />
          <Route path="/admin/reports/:id" element={<ReportViewPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster />
    </>
  )
}
