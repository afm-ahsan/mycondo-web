import {
  BarChart3,
  Banknote,
  BookOpen,
  Building,
  Building2,
  CalendarClock,
  Car,
  Clock,
  DoorOpen,
  FileText,
  Flame,
  Fuel,
  Gauge,
  GraduationCap,
  HardHat,
  History,
  Home,
  Landmark,
  LayoutGrid,
  Lightbulb,
  Package,
  PartyPopper,
  PiggyBank,
  Plug,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  ShieldUser,
  UserCog,
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
    title: 'My Flats',
    icon: Home,
    children: [
      { title: 'My Flats', path: '/me/flats' },
      { title: 'My Invoices', path: '/me/invoices' },
    ],
  },
  { heading: 'Management' },
  {
    title: 'Residents',
    icon: Users,
    children: [
      { title: 'Flat Owners', path: '/residents/flat-owners', permission: 'ownership.manage' },
      {
        title: 'Tenant Registrations',
        path: '/leasing/tenant-registrations',
        permission: PERMISSIONS.occupancyRegistration.view,
      },
      { title: 'Resident Directory', path: '/residents', permission: 'resident.view' },
      {
        title: 'Security Directory',
        path: '/leasing/security-directory',
        permission: PERMISSIONS.occupancyRegistration.securityView,
      },
    ],
  },
  {
    title: 'Administration',
    icon: UserCog,
    children: [
      { title: 'Users', path: '/admin/users', permission: 'user.view' },
      { title: 'Roles & Permissions', path: '/admin/roles', permission: 'role.view' },
    ],
  },
  {
    title: 'Security & Access',
    icon: ShieldUser,
    children: [
      {
        title: 'Entry Gates',
        icon: DoorOpen,
        path: '/security/entry-gates',
        permission: PERMISSIONS.gate.manage,
      },
      {
        title: 'Visitor Management',
        children: [
          { title: 'Guest Register', path: '/security/guests', permission: PERMISSIONS.visitor.view },
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
  {
    title: 'Front Desk',
    icon: Package,
    children: [
      { title: 'Parcel Register', path: '/security/parcels', permission: PERMISSIONS.parcel.view },
    ],
  },
  { heading: 'Finance' },
  {
    title: 'Billing',
    icon: FileText,
    children: [
      {
        title: 'Service Charges',
        children: [
          {
            title: 'Rules',
            path: '/billing/service-charge-rules',
            permission: PERMISSIONS.billing.ruleView,
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
        title: 'Outstanding Invoices',
        path: '/billing/outstanding-invoices',
        permission: PERMISSIONS.billing.invoiceView,
      },
    ],
  },
  {
    title: 'Payments & Receipts',
    icon: Wallet,
    children: [
      { title: 'Payments', path: '/billing/payments', permission: PERMISSIONS.payment.view },
    ],
  },
  {
    title: 'Expenses',
    icon: Receipt,
    children: [
      { title: 'Expense Categories', path: '/finance/expense-categories', permission: 'expensecategory.view' },
      { title: 'Expense Types', path: '/finance/expense-types', permission: 'expensetype.view' },
      { title: 'Expenses', path: '/finance/expenses', permission: 'expense.view' },
    ],
  },
  {
    title: 'Resident Ledger',
    icon: BookOpen,
    path: '/billing/ledger',
    permission: PERMISSIONS.payment.view,
  },
  {
    title: 'Reports',
    icon: BarChart3,
    children: [
      {
        title: 'Billing & Collections',
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
          {
            title: 'Service Charge Collection',
            path: '/finance/reports/service-charge-collection',
            permission: PERMISSIONS.finance.reportView,
          },
          {
            title: 'Gas Collection',
            path: '/finance/reports/gas-collection',
            permission: PERMISSIONS.finance.reportView,
          },
          { title: 'Fines', path: '/finance/reports/fines', permission: PERMISSIONS.finance.reportView },
          {
            title: 'Outstanding Dues',
            path: '/finance/reports/outstanding-dues',
            permission: PERMISSIONS.finance.reportView,
          },
        ],
      },
      {
        title: 'Ledgers & Position',
        children: [
          {
            title: 'Trial Balance',
            path: '/finance/reports/trial-balance',
            permission: PERMISSIONS.finance.reportView,
          },
          {
            title: 'General Ledger',
            path: '/finance/reports/general-ledger',
            permission: PERMISSIONS.finance.journalView,
          },
          {
            title: 'Account Ledger',
            path: '/finance/reports/account-ledger',
            permission: PERMISSIONS.finance.journalView,
          },
          {
            title: 'Fund Position',
            path: '/finance/reports/fund-position',
            permission: PERMISSIONS.finance.reportView,
          },
          {
            title: 'Financial Position',
            path: '/finance/reports/financial-position',
            permission: PERMISSIONS.finance.reportView,
          },
          { title: 'Cash Flow', path: '/finance/reports/cash-flow', permission: PERMISSIONS.finance.reportView },
          {
            title: 'Financial Overview',
            path: '/finance/reports/overview',
            permission: PERMISSIONS.finance.reportView,
          },
          {
            title: 'Income & Expense',
            path: '/finance/reports/income-expense',
            permission: PERMISSIONS.finance.reportView,
          },
          {
            title: 'Cash & Bank Position',
            path: '/finance/reports/cash-bank-position',
            permission: PERMISSIONS.finance.reportView,
          },
        ],
      },
      {
        title: 'Expense Reports',
        children: [
          {
            title: 'Expense Summary',
            path: '/finance/reports/expense-summary',
            permission: PERMISSIONS.finance.reportView,
          },
          {
            title: 'Expense by Category',
            path: '/finance/reports/expense-by-category',
            permission: PERMISSIONS.finance.reportView,
          },
          {
            title: 'Expense by Type',
            path: '/finance/reports/expense-by-type',
            permission: PERMISSIONS.finance.reportView,
          },
          {
            title: 'Expense Trend',
            path: '/finance/reports/expense-trend',
            permission: PERMISSIONS.finance.reportView,
          },
        ],
      },
      {
        title: 'Fixed Deposit Reports',
        children: [
          {
            title: 'FD Portfolio',
            path: '/finance/reports/fixed-deposit-portfolio',
            permission: PERMISSIONS.finance.reportView,
          },
          {
            title: 'FD Interest',
            path: '/finance/reports/fixed-deposit-interest',
            permission: PERMISSIONS.finance.reportView,
          },
        ],
      },
      {
        title: 'Statements',
        children: [
          // Gated here on reportView (broader than the route's auth-only guard) so this admin-facing
          // Finance nav only surfaces the item for report-viewing roles; residents' own-statement
          // self-service access (reportStatementOwnView) has no menu entry point today and is
          // unaffected — see GetResidentFinancialStatementReportQueryHandler's two-tier check.
          {
            title: 'Resident Financial Statement',
            path: '/finance/reports/resident-statement',
            permission: PERMISSIONS.finance.reportView,
          },
          {
            title: 'Flat Financial Statement',
            path: '/finance/reports/flat-statement',
            permission: PERMISSIONS.finance.reportView,
          },
        ],
      },
    ],
  },
  {
    title: 'Banking',
    icon: Landmark,
    children: [
      {
        title: 'Financial Accounts',
        icon: Landmark,
        path: '/finance/financial-accounts',
        permission: PERMISSIONS.finance.bankAccountView,
      },
      {
        title: 'Fixed Deposits',
        icon: PiggyBank,
        path: '/finance/fixed-deposits',
        permission: PERMISSIONS.finance.fixedDepositView,
      },
    ],
  },
  {
    title: 'Governance',
    icon: ShieldCheck,
    children: [
      {
        title: 'Accounting Periods',
        icon: CalendarClock,
        path: '/finance/accounting-periods',
        permission: PERMISSIONS.finance.periodManage,
      },
      {
        title: 'Bank Reconciliation',
        icon: Banknote,
        path: '/finance/bank-reconciliation',
        permission: PERMISSIONS.finance.reconciliationView,
      },
      {
        title: 'Integrity Dashboard',
        icon: ShieldAlert,
        path: '/finance/integrity-dashboard',
        permission: PERMISSIONS.finance.reportView,
      },
      {
        title: 'Audit Log',
        icon: History,
        path: '/finance/audit-log',
        permission: PERMISSIONS.audit.view,
      },
    ],
  },
  { heading: 'Property' },
  {
    title: 'Buildings',
    icon: Building,
    path: '/admin/buildings',
    permission: 'property.view',
  },
  {
    title: 'Flats',
    icon: Building2,
    path: '/admin/flats',
    permission: 'property.view',
  },
  {
    title: 'Facilities',
    icon: Landmark,
    children: [
      {
        title: 'Community Hall',
        icon: PartyPopper,
        children: [
          {
            title: 'Halls / Settings',
            path: '/facilities/community-hall/settings',
            permission: PERMISSIONS.facility.manage,
          },
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
        ],
      },
      {
        title: 'Swimming Pool',
        icon: Waves,
        children: [
          {
            title: 'Closures / Settings',
            path: '/facilities/swimming-pool/settings',
            permission: PERMISSIONS.facility.manage,
          },
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
  {
    title: 'Utilities',
    icon: Plug,
    children: [
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
        title: 'Consumption Summary',
        icon: BarChart3,
        path: '/utilities/reports/consumption-summary',
        permission: PERMISSIONS.utility.report,
      },
    ],
  },
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
