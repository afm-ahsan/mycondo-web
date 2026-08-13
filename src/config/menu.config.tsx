import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Building,
  Car,
  Clock,
  FileText,
  Flame,
  Fuel,
  Gauge,
  GraduationCap,
  HardHat,
  Home,
  Landmark,
  LayoutGrid,
  Lightbulb,
  Package,
  PartyPopper,
  Receipt,
  ShieldUser,
  Tag,
  Wallet,
  Users,
  Waves,
  Zap,
} from 'lucide-react';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { type MenuConfig } from './types';

export const MENU_SIDEBAR: MenuConfig = [
  { title: 'Dashboard', icon: LayoutGrid, path: '/' },
  // No `permission` on these two — mycondo-api's GET /api/v1/me/flats and /me/invoices are gated by
  // authentication only, with each backend query enforcing its own per-relationship permission check
  // internally (Phase 3, mycondo-docs ADR-021). A user with no ownership/occupancy relationship
  // simply sees an empty list, same as every other resident-facing self-service view.
  {
    title: 'My Flat',
    icon: Home,
    children: [
      { title: 'My Flat', path: '/me/flats' },
      { title: 'My Invoices', path: '/me/invoices' },
    ],
  },
  { heading: 'Resident Management' },
  {
    title: 'Resident Management',
    icon: Users,
    children: [
      { title: 'Residents', path: '/residents', permission: 'resident.view' },
      { title: 'Flat Owners', path: '/residents/flat-owners', permission: 'ownership.manage' },
      {
        title: 'Tenant Registrations',
        path: '/leasing/tenant-registrations',
        permission: PERMISSIONS.occupancyRegistration.view,
      },
      {
        title: 'New Tenant Registration',
        path: '/leasing/tenant-registrations/new',
        permission: PERMISSIONS.occupancyRegistration.create,
      },
      {
        title: 'Security Directory',
        path: '/leasing/security-directory',
        permission: PERMISSIONS.occupancyRegistration.securityView,
      },
    ],
  },
  { heading: 'Administration' },
  {
    title: 'Administration',
    icon: Building,
    children: [
      { title: 'Buildings', path: '/admin/buildings', permission: 'property.view' },
      { title: 'Flats', path: '/admin/flats', permission: 'property.view' },
      { title: 'Users', path: '/admin/users', permission: 'user.view' },
      { title: 'Roles & Permissions', path: '/admin/roles', permission: 'role.view' },
    ],
  },
  { heading: 'Security & Access' },
  {
    title: 'Security & Access',
    icon: ShieldUser,
    children: [
      {
        title: 'Visitor Management',
        children: [
          { title: 'Guest Register', path: '/security/guests', permission: PERMISSIONS.visitor.view },
          { title: 'New Guest', path: '/security/guests/new', permission: PERMISSIONS.visitor.create },
          {
            title: 'Check In / Out',
            path: '/security/guests/checkin-out',
            permission: PERMISSIONS.visitor.checkin,
          },
          {
            title: 'Current Visitors',
            path: '/security/guests/currently-inside',
            permission: PERMISSIONS.report.securityView,
          },
        ],
      },
      {
        title: 'Vehicle Access',
        icon: Car,
        children: [
          { title: 'Vehicle Directory', path: '/security/vehicles', permission: PERMISSIONS.vehicle.view },
          { title: 'Register Vehicle', path: '/security/vehicles/new', permission: PERMISSIONS.vehicle.create },
          {
            title: 'Check In / Out',
            path: '/security/vehicles/checkin-out',
            permission: PERMISSIONS.vehicle.checkin,
          },
          {
            title: 'Vehicles Currently Inside',
            path: '/security/vehicles/currently-inside',
            permission: PERMISSIONS.report.securityView,
          },
        ],
      },
      {
        title: 'Domestic Staff',
        icon: HardHat,
        children: [
          {
            title: 'Directory',
            path: '/security/domestic-workers',
            permission: PERMISSIONS.domesticWorker.view,
          },
          {
            title: 'Register Worker',
            path: '/security/domestic-workers/new',
            permission: PERMISSIONS.domesticWorker.manage,
          },
          {
            title: 'Check In / Out',
            path: '/security/domestic-workers/checkin-out',
            permission: PERMISSIONS.domesticWorker.checkin,
          },
          {
            title: 'Currently Inside',
            path: '/security/domestic-workers/currently-inside',
            permission: PERMISSIONS.report.securityView,
          },
        ],
      },
      {
        title: 'Service Providers',
        icon: GraduationCap,
        children: [
          {
            title: 'Directory',
            path: '/security/service-providers',
            permission: PERMISSIONS.serviceProvider.view,
          },
          {
            title: 'Register Provider',
            path: '/security/service-providers/new',
            permission: PERMISSIONS.serviceProvider.manage,
          },
          {
            title: 'Check In / Out',
            path: '/security/service-providers/checkin-out',
            permission: PERMISSIONS.serviceProvider.checkin,
          },
          {
            title: 'Currently Inside',
            path: '/security/service-providers/currently-inside',
            permission: PERMISSIONS.report.securityView,
          },
        ],
      },
      {
        title: 'Staff Attendance',
        icon: Clock,
        children: [
          {
            title: 'Roster',
            path: '/security/staff-attendance',
            permission: PERMISSIONS.staffAttendance.view,
          },
          {
            title: 'Register Staff Member',
            path: '/security/staff-attendance/new',
            permission: PERMISSIONS.staffAttendance.manage,
          },
          {
            title: 'Attendance Register',
            path: '/security/staff-attendance/records',
            permission: PERMISSIONS.staffAttendance.view,
          },
          {
            title: 'Currently Present',
            path: '/security/staff-attendance/currently-present',
            permission: PERMISSIONS.staffAttendance.view,
          },
        ],
      },
    ],
  },
  { heading: 'Front Desk' },
  {
    title: 'Front Desk',
    icon: Package,
    children: [
      {
        title: 'Parcels',
        icon: Package,
        children: [
          { title: 'Parcel Register', path: '/security/parcels', permission: PERMISSIONS.parcel.view },
          { title: 'Receive Parcel', path: '/security/parcels/new', permission: PERMISSIONS.parcel.receive },
        ],
      },
    ],
  },
  { heading: 'Finance' },
  {
    title: 'Finance',
    icon: Receipt,
    children: [
      {
        title: 'Service Charges',
        icon: FileText,
        children: [
          {
            title: 'Rules',
            path: '/billing/service-charge-rules',
            permission: PERMISSIONS.billing.ruleView,
          },
          {
            title: 'New Rule',
            path: '/billing/service-charge-rules/new',
            permission: PERMISSIONS.billing.ruleManage,
          },
          {
            title: 'Invoices',
            path: '/billing/invoices',
            permission: PERMISSIONS.billing.invoiceView,
          },
          {
            title: 'Generate Billing Run',
            path: '/billing/generate-batch',
            permission: PERMISSIONS.billing.invoiceGenerate,
          },
        ],
      },
      {
        title: 'Payments & Receipts',
        icon: Wallet,
        children: [
          { title: 'Payments', path: '/billing/payments', permission: PERMISSIONS.payment.view },
          { title: 'Record Payment', path: '/billing/payments/new', permission: PERMISSIONS.payment.record },
        ],
      },
      {
        title: 'Expense Types',
        icon: Tag,
        path: '/finance/expense-types',
        permission: 'expensetype.view',
      },
      {
        title: 'Expenses',
        icon: Receipt,
        path: '/finance/expenses',
        permission: 'expense.view',
      },
      {
        title: 'Resident Ledger',
        icon: BookOpen,
        path: '/billing/ledger',
        permission: PERMISSIONS.payment.view,
      },
      {
        title: 'Outstanding Invoices',
        icon: AlertCircle,
        path: '/billing/outstanding-invoices',
        permission: PERMISSIONS.billing.invoiceView,
      },
      {
        title: 'Reports',
        icon: BarChart3,
        children: [
          {
            title: 'Financial Summary',
            path: '/billing/reports/financial-summary',
            permission: PERMISSIONS.report.financialView,
          },
          {
            title: 'Receivables Ageing',
            path: '/billing/reports/receivables-ageing',
            permission: PERMISSIONS.report.financialView,
          },
        ],
      },
      {
        title: 'Electricity',
        icon: Lightbulb,
        children: [
          { title: 'Meters', path: '/utilities/electricity/meters', permission: PERMISSIONS.utility.meterView },
          {
            title: 'Readings',
            path: '/utilities/electricity/readings',
            permission: PERMISSIONS.utility.readingView,
          },
          {
            title: 'Record Reading',
            path: '/utilities/electricity/readings/new',
            permission: PERMISSIONS.utility.readingRecord,
          },
          {
            title: 'Rate Plans',
            path: '/utilities/electricity/rate-plans',
            permission: PERMISSIONS.utility.ratePlanView,
          },
          {
            title: 'Billed vs Unbilled',
            path: '/utilities/electricity/reports/billed-vs-unbilled',
            permission: PERMISSIONS.utility.readingView,
          },
          {
            title: 'Consumption History',
            path: '/utilities/electricity/reports/consumption-history',
            permission: PERMISSIONS.utility.readingView,
          },
        ],
      },
      {
        title: 'Gas',
        icon: Gauge,
        children: [
          { title: 'Meters', path: '/utilities/gas/meters', permission: PERMISSIONS.utility.meterView },
          { title: 'Readings', path: '/utilities/gas/readings', permission: PERMISSIONS.utility.readingView },
          {
            title: 'Record Reading',
            path: '/utilities/gas/readings/new',
            permission: PERMISSIONS.utility.readingRecord,
          },
          {
            title: 'Rate Plans',
            path: '/utilities/gas/rate-plans',
            permission: PERMISSIONS.utility.ratePlanView,
          },
          {
            title: 'Billed vs Unbilled',
            path: '/utilities/gas/reports/billed-vs-unbilled',
            permission: PERMISSIONS.utility.readingView,
          },
          {
            title: 'Consumption History',
            path: '/utilities/gas/reports/consumption-history',
            permission: PERMISSIONS.utility.readingView,
          },
        ],
      },
      {
        title: 'Utility Reports',
        icon: BarChart3,
        children: [
          {
            title: 'Consumption Summary',
            path: '/utilities/reports/consumption-summary',
            permission: PERMISSIONS.utility.report,
          },
        ],
      },
    ],
  },
  { heading: 'Facilities' },
  {
    title: 'Facilities',
    icon: Landmark,
    children: [
      {
        title: 'Community Hall',
        icon: PartyPopper,
        children: [
          {
            title: 'Booking Calendar',
            path: '/facilities/community-hall/calendar',
            permission: PERMISSIONS.facility.bookingView,
          },
          {
            title: 'Booking List',
            path: '/facilities/community-hall/bookings',
            permission: PERMISSIONS.facility.bookingView,
          },
          {
            title: 'New Booking',
            path: '/facilities/community-hall/bookings/new',
            permission: PERMISSIONS.facility.bookingCreate,
          },
          {
            title: 'Halls / Settings',
            path: '/facilities/swimming-pool/settings',
            permission: PERMISSIONS.facility.manage,
          },
        ],
      },
      {
        title: 'Swimming Pool',
        icon: Waves,
        children: [
          { title: 'Pool Access', path: '/facilities/swimming-pool/access', permission: PERMISSIONS.pool.checkin },
          {
            title: 'Current Users',
            path: '/facilities/swimming-pool/current',
            permission: PERMISSIONS.pool.view,
          },
          {
            title: 'Usage History',
            path: '/facilities/swimming-pool/history',
            permission: PERMISSIONS.pool.view,
          },
          {
            title: 'Closures / Settings',
            path: '/facilities/swimming-pool/settings',
            permission: PERMISSIONS.facility.manage,
          },
        ],
      },
      {
        title: 'Reports',
        icon: BarChart3,
        children: [
          {
            title: 'Utilization',
            path: '/facilities/reports/utilization',
            permission: PERMISSIONS.report.facility,
          },
          {
            title: 'Booking Revenue',
            path: '/facilities/reports/booking-revenue',
            permission: PERMISSIONS.report.facility,
          },
          {
            title: 'Pool Daily Usage',
            path: '/facilities/reports/pool-daily-usage',
            permission: PERMISSIONS.report.facility,
          },
        ],
      },
    ],
  },
  { heading: 'Operations' },
  {
    title: 'Operations',
    icon: Zap,
    children: [
      {
        title: 'Generator',
        icon: Fuel,
        children: [
          {
            title: 'Operation Log',
            path: '/operations/generator/log',
            permission: PERMISSIONS.generator.view,
          },
          {
            title: 'Fuel Log',
            path: '/operations/generator/fuel',
            permission: PERMISSIONS.generator.view,
          },
          {
            title: 'Maintenance',
            path: '/operations/generator/maintenance',
            permission: PERMISSIONS.generator.view,
          },
          {
            title: 'Reports',
            path: '/operations/generator/reports',
            permission: PERMISSIONS.generator.report,
          },
        ],
      },
      {
        title: 'Gas Cylinders',
        icon: Flame,
        children: [
          {
            title: 'Purchases',
            path: '/operations/gas-cylinders/purchases',
            permission: PERMISSIONS.gasCylinder.view,
          },
          {
            title: 'Stock',
            path: '/operations/gas-cylinders/stock',
            permission: PERMISSIONS.gasCylinder.view,
          },
          {
            title: 'Consumption',
            path: '/operations/gas-cylinders/consumption',
            permission: PERMISSIONS.gasCylinder.report,
          },
          {
            title: 'Supplier Comparison',
            path: '/operations/gas-cylinders/supplier-comparison',
            permission: PERMISSIONS.gasCylinder.report,
          },
        ],
      },
    ],
  },
];
