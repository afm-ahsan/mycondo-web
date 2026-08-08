import {
  AlertCircle,
  Award,
  Badge,
  BarChart3,
  Bell,
  Bitcoin,
  Book,
  BookOpen,
  Briefcase,
  Building,
  CalendarCheck,
  Captions,
  Car,
  CheckCircle,
  Clock,
  Code,
  Coffee,
  File as DocumentIcon,
  Euro,
  Eye,
  File,
  FileQuestion,
  FileText,
  Flag,
  Flame,
  Fuel,
  Gauge,
  Ghost,
  Gift,
  GraduationCap,
  Grid,
  HardHat,
  Heart,
  HelpCircle,
  Kanban,
  Key,
  Landmark,
  Layout,
  LayoutGrid,
  Lightbulb,
  LifeBuoy,
  MessageSquare,
  Monitor,
  Network,
  Package,
  PartyPopper,
  Users as PeopleIcon,
  Plug,
  Receipt,
  Settings,
  Wallet,
  Share2,
  Shield,
  ShieldOff,
  ShieldUser,
  ShoppingCart,
  SquareMousePointer,
  Star,
  ThumbsUp,
  TrendingUp,
  UserCheck,
  UserCircle,
  Users,
  Waves,
  Briefcase as WorkIcon,
  Zap,
} from 'lucide-react';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { type MenuConfig } from './types';

export const MENU_SIDEBAR: MenuConfig = [
  { title: 'Dashboard', icon: LayoutGrid, path: '/' },
  { heading: 'Administration' },
  {
    title: 'Administration',
    icon: Building,
    children: [
      { title: 'Users', path: '/admin/users', permission: 'user.view' },
      { title: 'Roles & Permissions', path: '/admin/roles', permission: 'role.view' },
      { title: 'Create Tenant', path: '/admin/tenants/new', permission: 'tenant.manage' },
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
  { heading: 'Tenant Registration' },
  {
    title: 'Tenant Registration',
    icon: UserCheck,
    children: [
      {
        title: 'Registrations',
        path: '/leasing/tenant-registrations',
        permission: PERMISSIONS.occupancyRegistration.view,
      },
      {
        title: 'New Registration',
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
  { heading: 'Billing & Collections' },
  {
    title: 'Billing & Collections',
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

export const MENU_SIDEBAR_CUSTOM: MenuConfig = [
  {
    title: 'Store - Client',
    icon: Users,
    children: [
      { title: 'Home', path: '/store-client/home' },
      {
        title: 'Search Results',
        children: [
          {
            title: 'Search Results - Grid',
            path: '/store-client/search-results-grid',
          },
          {
            title: 'Search Results - List',
            path: '/store-client/search-results-list',
          },
        ],
      },
      {
        title: 'Overlays',
        children: [
          { title: 'Product Details', path: '/store-client/product-details' },
          { title: 'Wishlist', path: '/store-client/wishlist' },
        ],
      },
      {
        title: 'Checkout',
        children: [
          {
            title: 'Order Summary',
            path: '/store-client/checkout/order-summary',
          },
          {
            title: 'Shipping Info',
            path: '/store-client/checkout/shipping-info',
          },
          {
            title: 'Payment Method',
            path: '/store-client/checkout/payment-method',
          },
          {
            title: 'Order Placed',
            path: '/store-client/checkout/order-placed',
          },
        ],
      },
      { title: 'My Orders', path: '/store-client/my-orders' },
      { title: 'Order Receipt', path: '/store-client/order-receipt' },
    ],
  },
];

export const MENU_SIDEBAR_COMPACT: MenuConfig = [
  {
    title: 'Dashboards',
    icon: LayoutGrid,
    path: '/',
  },
  {
    title: 'Public Profile',
    icon: UserCircle,
    children: [
      {
        title: 'Profiles',
        children: [
          { title: 'Default', path: '/public-profile/profiles/default' },
          { title: 'Creator', path: '/public-profile/profiles/creator' },
          { title: 'Company', path: '/public-profile/profiles/company' },
          { title: 'NFT', path: '/public-profile/profiles/nft' },
          { title: 'Blogger', path: '/public-profile/profiles/blogger' },
          { title: 'CRM', path: '/public-profile/profiles/crm' },
          {
            title: 'More',
            collapse: true,
            collapseTitle: 'Show less',
            expandTitle: 'Show 4 more',
            children: [
              { title: 'Gamer', path: '/public-profile/profiles/gamer' },
              { title: 'Feeds', path: '/public-profile/profiles/feeds' },
              { title: 'Plain', path: '/public-profile/profiles/plain' },
              { title: 'Modal', path: '/public-profile/profiles/modal' },
            ],
          },
        ],
      },
      {
        title: 'Projects',
        children: [
          { title: '3 Columns', path: '/public-profile/projects/3-columns' },
          { title: '2 Columns', path: '/public-profile/projects/2-columns' },
        ],
      },
      { title: 'Works', path: '/public-profile/works' },
      { title: 'Teams', path: '/public-profile/teams' },
      { title: 'Network', path: '/public-profile/network' },
      { title: 'Activity', path: '/public-profile/activity' },
      {
        title: 'More',
        collapse: true,
        collapseTitle: 'Show less',
        expandTitle: 'Show 3 more',
        children: [
          { title: 'Campaigns - Card', path: '/public-profile/campaigns/card' },
          { title: 'Campaigns - List', path: '/public-profile/campaigns/list' },
          { title: 'Empty', path: '/public-profile/empty' },
        ],
      },
    ],
  },
  {
    title: 'My Account',
    icon: Settings,
    children: [
      {
        title: 'Account',
        children: [
          { title: 'Get Started', path: '/account/home/get-started' },
          { title: 'User Profile', path: '/account/home/user-profile' },
          { title: 'Company Profile', path: '/account/home/company-profile' },
          {
            title: 'Settings - With Sidebar',
            path: '/account/home/settings-sidebar',
          },
          {
            title: 'Settings - Enterprise',
            path: '/account/home/settings-enterprise',
          },
          { title: 'Settings - Plain', path: '/account/home/settings-plain' },
          { title: 'Settings - Modal', path: '/account/home/settings-modal' },
        ],
      },
      {
        title: 'Billing',
        children: [
          { title: 'Billing - Basic', path: '/account/billing/basic' },
          {
            title: 'Billing - Enterprise',
            path: '/account/billing/enterprise',
          },
          { title: 'Plans', path: '/account/billing/plans' },
          { title: 'Billing History', path: '/account/billing/history' },
        ],
      },
      {
        title: 'Security',
        children: [
          { title: 'Get Started', path: '/account/security/get-started' },
          { title: 'Security Overview', path: '/account/security/overview' },
          {
            title: 'Allowed IP Addresses',
            path: '/account/security/allowed-ip-addresses',
          },
          {
            title: 'Privacy Settings',
            path: '/account/security/privacy-settings',
          },
          {
            title: 'Device Management',
            path: '/account/security/device-management',
          },
          {
            title: 'Backup & Recovery',
            path: '/account/security/backup-and-recovery',
          },
          {
            title: 'Current Sessions',
            path: '/account/security/current-sessions',
          },
          { title: 'Security Log', path: '/account/security/security-log' },
        ],
      },
      {
        title: 'Members & Roles',
        children: [
          { title: 'Teams Starter', path: '/account/members/team-starter' },
          { title: 'Teams', path: '/account/members/teams' },
          { title: 'Team Info', path: '/account/members/team-info' },
          {
            title: 'Members Starter',
            path: '/account/members/members-starter',
          },
          { title: 'Team Members', path: '/account/members/team-members' },
          { title: 'Import Members', path: '/account/members/import-members' },
          { title: 'Roles', path: '/account/members/roles' },
          {
            title: 'Permissions - Toggler',
            path: '/account/members/permissions-toggle',
          },
          {
            title: 'Permissions - Check',
            path: '/account/members/permissions-check',
          },
        ],
      },
      { title: 'Integrations', path: '/account/integrations' },
      { title: 'Notifications', path: '/account/notifications' },
      { title: 'API Keys', path: '/account/api-keys' },
      {
        title: 'More',
        collapse: true,
        collapseTitle: 'Show less',
        expandTitle: 'Show 3 more',
        children: [
          { title: 'Appearance', path: '/account/appearance' },
          { title: 'Invite a Friend', path: '/account/invite-a-friend' },
          { title: 'Activity', path: '/account/activity' },
        ],
      },
    ],
  },
  {
    title: 'Network',
    icon: Users,
    children: [
      { title: 'Get Started', path: '/network/get-started' },
      {
        title: 'User Cards',
        children: [
          { title: 'Mini Cards', path: '/network/user-cards/mini-cards' },
          { title: 'Team Crew', path: '/network/user-cards/team-crew' },
          { title: 'Author', path: '/network/user-cards/author' },
          { title: 'NFT', path: '/network/user-cards/nft' },
          { title: 'Social', path: '/network/user-cards/social' },
        ],
      },
      {
        title: 'User Table',
        children: [
          { title: 'Team Crew', path: '/network/user-table/team-crew' },
          { title: 'App Roster', path: '/network/user-table/app-roster' },
          {
            title: 'Market Authors',
            path: '/network/user-table/market-authors',
          },
          { title: 'SaaS Users', path: '/network/user-table/saas-users' },
          { title: 'Store Clients', path: '/network/user-table/store-clients' },
          { title: 'Visitors', path: '/network/user-table/visitors' },
        ],
      },
      { title: 'Cooperations', path: '/network/cooperations', disabled: true },
      { title: 'Leads', path: '/network/leads', disabled: true },
      { title: 'Donators', path: '/network/donators', disabled: true },
    ],
  },
  {
    title: 'Store - Client',
    icon: ShoppingCart,
    children: [
      { title: 'Home', path: '/store-client/home' },
      {
        title: 'Search Results - Grid',
        path: '/store-client/search-results-grid',
      },
      {
        title: 'Search Results - List',
        path: '/store-client/search-results-list',
      },
      { title: 'Product Details', path: '/store-client/product-details' },
      { title: 'Wishlist', path: '/store-client/wishlist' },
      {
        title: 'Checkout',
        children: [
          {
            title: 'Order Summary',
            path: '/store-client/checkout/order-summary',
          },
          {
            title: 'Shipping Info',
            path: '/store-client/checkout/shipping-info',
          },
          {
            title: 'Payment Method',
            path: '/store-client/checkout/payment-method',
          },
          {
            title: 'Order Placed',
            path: '/store-client/checkout/order-placed',
          },
        ],
      },
      { title: 'My Orders', path: '/store-client/my-orders' },
      { title: 'Order Receipt', path: '/store-client/order-receipt' },
    ],
  },
  {
    title: 'Authentication',
    icon: Shield,
    children: [
      {
        title: 'Classic',
        children: [
          { title: 'Sign In', path: '/auth/classic/signin' },
          { title: 'Sign Up', path: '/auth/classic/signup' },
          { title: '2FA', path: '/auth/classic/2fa' },
          { title: 'Check Email', path: '/auth/classic/check-email' },
          {
            title: 'Reset Password',
            children: [
              {
                title: 'Enter Email',
                path: '/auth/classic/request-reset',
              },
              {
                title: 'Check Email',
                path: '/auth/classic/reset-password/check-email',
              },
              {
                title: 'Password Changed',
                path: '/auth/classic/reset-password/changed',
              },
            ],
          },
        ],
      },
      {
        title: 'Branded',
        children: [
          { title: 'Sign In', path: '/auth/signin' },
          { title: 'Sign Up', path: '/auth/signup' },
          { title: '2FA', path: '/auth/2fa' },
          { title: 'Check Email', path: '/auth/check-email' },
          {
            title: 'Reset Password',
            children: [
              {
                title: 'Enter Email',
                path: '/auth/request-reset',
              },
              {
                title: 'Check Email',
                path: '/auth/reset-password/check-email',
              },
              {
                title: 'Password Changed',
                path: '/auth/reset-password/changed',
              },
            ],
          },
        ],
      },
      { title: 'Welcome Message', path: '/auth/welcome-message' },
      { title: 'Account Deactivated', path: '/auth/account-deactivated' },
      { title: 'Error 404', path: '/error/404' },
      { title: 'Error 500', path: '/error/500' },
    ],
  },
];

export const MENU_MEGA: MenuConfig = [
  { title: 'Home', path: '/' },
  {
    title: 'Profiles',
    children: [
      {
        title: 'Profiles',
        children: [
          {
            children: [
              {
                title: 'Default',
                icon: Badge,
                path: '/public-profile/profiles/default',
              },
              {
                title: 'Creator',
                icon: Coffee,
                path: '/public-profile/profiles/creator',
              },
              {
                title: 'Company',
                icon: Building,
                path: '/public-profile/profiles/company',
              },
              {
                title: 'NFT',
                icon: Bitcoin,
                path: '/public-profile/profiles/nft',
              },
              {
                title: 'Blogger',
                icon: MessageSquare,
                path: '/public-profile/profiles/blogger',
              },
              {
                title: 'CRM',
                icon: Monitor,
                path: '/public-profile/profiles/crm',
              },
              {
                title: 'Gamer',
                icon: Ghost,
                path: '/public-profile/profiles/gamer',
              },
            ],
          },
          {
            children: [
              {
                title: 'Feeds',
                icon: Book,
                path: '/public-profile/profiles/feeds',
              },
              {
                title: 'Plain',
                icon: File,
                path: '/public-profile/profiles/plain',
              },
              {
                title: 'Modal',
                icon: SquareMousePointer,
                path: '/public-profile/profiles/modal',
              },
              {
                title: 'Freelancer',
                icon: Briefcase,
                path: '#',
                disabled: true,
              },
              { title: 'Developer', icon: Code, path: '#', disabled: true },
              { title: 'Team', icon: Users, path: '#', disabled: true },
              {
                title: 'Events',
                icon: CalendarCheck,
                path: '#',
                disabled: true,
              },
            ],
          },
        ],
      },
      {
        title: 'Other Pages',
        children: [
          {
            children: [
              {
                title: 'Projects - 3 Cols',
                icon: Layout,
                path: '/public-profile/projects/3-columns',
              },
              {
                title: 'Projects - 2 Cols',
                icon: Grid,
                path: '/public-profile/projects/2-columns',
              },
              { title: 'Works', icon: WorkIcon, path: '/public-profile/works' },
              {
                title: 'Teams',
                icon: PeopleIcon,
                path: '/public-profile/teams',
              },
              {
                title: 'Network',
                icon: Network,
                path: '/public-profile/network',
              },
              {
                title: 'Activity',
                icon: TrendingUp,
                path: '/public-profile/activity',
              },
              {
                title: 'Campaigns - Card',
                icon: LayoutGrid,
                path: '/public-profile/campaigns/card',
              },
            ],
          },
          {
            children: [
              {
                title: 'Campaigns - List',
                icon: Kanban,
                path: '/public-profile/campaigns/list',
              },
              { title: 'Empty', icon: FileText, path: '/public-profile/empty' },
              {
                title: 'Documents',
                icon: DocumentIcon,
                path: '#',
                disabled: true,
              },
              { title: 'Badges', icon: Award, path: '#', disabled: true },
              { title: 'Awards', icon: Gift, path: '#', disabled: true },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'My Account',
    children: [
      {
        title: 'General Pages',
        children: [
          { title: 'Integrations', icon: Plug, path: '/account/integrations' },
          {
            title: 'Notifications',
            icon: Bell,
            path: '/account/notifications',
          },
          { title: 'API Keys', icon: Key, path: '/account/api-keys' },
          { title: 'Appearance', icon: Eye, path: '/account/appearance' },
          {
            title: 'Invite a Friend',
            icon: UserCheck,
            path: '/account/invite-a-friend',
          },
          { title: 'Activity', icon: LifeBuoy, path: '/account/activity' },
          { title: 'Brand', icon: CheckCircle, disabled: true },
          { title: 'Get Paid', icon: Euro, disabled: true },
        ],
      },
      {
        title: 'Other pages',
        children: [
          {
            title: 'Account Home',
            children: [
              { title: 'Get Started', path: '/account/home/get-started' },
              { title: 'User Profile', path: '/account/home/user-profile' },
              {
                title: 'Company Profile',
                path: '/account/home/company-profile',
              },
              { title: 'With Sidebar', path: '/account/home/settings-sidebar' },
              {
                title: 'Enterprise',
                path: '/account/home/settings-enterprise',
              },
              { title: 'Plain', path: '/account/home/settings-plain' },
              { title: 'Modal', path: '/account/home/settings-modal' },
            ],
          },
          {
            title: 'Billing',
            children: [
              { title: 'Basic Billing', path: '/account/billing/basic' },
              { title: 'Enterprise', path: '/account/billing/enterprise' },
              { title: 'Plans', path: '/account/billing/plans' },
              { title: 'Billing History', path: '/account/billing/history' },
              { title: 'Tax Info', disabled: true },
              { title: 'Invoices', disabled: true },
              { title: 'Gateaways', disabled: true },
            ],
          },
          {
            title: 'Security',
            children: [
              { title: 'Get Started', path: '/account/security/get-started' },
              {
                title: 'Security Overview',
                path: '/account/security/overview',
              },
              {
                title: 'IP Addresses',
                path: '/account/security/allowed-ip-addresses',
              },
              {
                title: 'Privacy Settings',
                path: '/account/security/privacy-settings',
              },
              {
                title: 'Device Management',
                path: '/account/security/device-management',
              },
              {
                title: 'Backup & Recovery',
                path: '/account/security/backup-and-recovery',
              },
              {
                title: 'Current Sessions',
                path: '/account/security/current-sessions',
              },
              { title: 'Security Log', path: '/account/security/security-log' },
            ],
          },
          {
            title: 'Members & Roles',
            children: [
              { title: 'Teams Starter', path: '/account/members/team-starter' },
              { title: 'Teams', path: '/account/members/teams' },
              { title: 'Team Info', path: '/account/members/team-info' },
              {
                title: 'Members Starter',
                path: '/account/members/members-starter',
              },
              { title: 'Team Members', path: '/account/members/team-members' },
              {
                title: 'Import Members',
                path: '/account/members/import-members',
              },
              { title: 'Roles', path: '/account/members/roles' },
              {
                title: 'Permissions - Toggler',
                path: '/account/members/permissions-toggle',
              },
              {
                title: 'Permissions - Check',
                path: '/account/members/permissions-check',
              },
            ],
          },
          {
            title: 'Other Pages',
            children: [
              { title: 'Integrations', path: '/account/integrations' },
              { title: 'Notifications', path: '/account/notifications' },
              { title: 'API Keys', path: '/account/api-keys' },
              { title: 'Appearance', path: '/account/appearance' },
              { title: 'Invite a Friend', path: '/account/invite-a-friend' },
              { title: 'Activity', path: '/account/activity' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Network',
    children: [
      {
        title: 'General Pages',
        children: [
          { title: 'Get Started', icon: Flag, path: '/network/get-started' },
          { title: 'Colleagues', icon: Users, path: '#', disabled: true },
          { title: 'Donators', icon: Heart, path: '#', disabled: true },
          { title: 'Leads', icon: Zap, path: '#', disabled: true },
        ],
      },
      {
        title: 'Other pages',
        children: [
          {
            title: 'User Cards',
            children: [
              { title: 'Mini Cards', path: '/network/user-cards/mini-cards' },
              { title: 'Team Members', path: '/network/user-cards/team-crew' },
              { title: 'Authors', path: '/network/user-cards/author' },
              { title: 'NFT Users', path: '/network/user-cards/nft' },
              { title: 'Social Users', path: '/network/user-cards/social' },
              { title: 'Gamers', path: '#', disabled: true },
            ],
          },
          {
            title: 'User Base',
            badge: 'Datatables',
            children: [
              { title: 'Team Crew', path: '/network/user-table/team-crew' },
              { title: 'App Roster', path: '/network/user-table/app-roster' },
              {
                title: 'Market Authors',
                path: '/network/user-table/market-authors',
              },
              { title: 'SaaS Users', path: '/network/user-table/saas-users' },
              {
                title: 'Store Clients',
                path: '/network/user-table/store-clients',
              },
              { title: 'Visitors', path: '/network/user-table/visitors' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Authentication',
    children: [
      {
        title: 'General pages',
        children: [
          {
            title: 'Classic Layout',
            children: [
              { title: 'Sign In', path: '/auth/classic/signin' },
              { title: 'Sign Up', path: '/auth/classic/signup' },
              { title: '2FA', path: '/auth/classic/2fa' },
              { title: 'Check Email', path: '/auth/classic/check-email' },
              {
                title: 'Reset Password',
                children: [
                  {
                    title: 'Enter Email',
                    path: '/auth/classic/reset-password',
                  },
                  {
                    title: 'Check Email',
                    path: '/auth/classic/reset-password/check-email',
                  },
                  {
                    title: 'Password is Changed',
                    path: '/auth/classic/reset-password/changed',
                  },
                ],
              },
            ],
          },
          {
            title: 'Branded Layout',
            children: [
              { title: 'Sign In', path: '/auth/signin' },
              { title: 'Sign Up', path: '/auth/signup' },
              { title: '2FA', path: '/auth/2fa' },
              { title: 'Check Email', path: '/auth/check-email' },
              {
                title: 'Reset Password',
                children: [
                  {
                    title: 'Enter Email',
                    path: '/auth/reset-password',
                  },
                  {
                    title: 'Check Email',
                    path: '/auth/reset-password/check-email',
                  },
                  {
                    title: 'Password is Changed',
                    path: '/auth/reset-password/changed',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Other Pages',
        children: [
          {
            title: 'Welcome Message',
            icon: ThumbsUp,
            path: '/auth/welcome-message',
          },
          {
            title: 'Account Deactivated',
            icon: ShieldOff,
            path: '/auth/account-deactivated',
          },
          { title: 'Error 404', icon: HelpCircle, path: '/error/404' },
          { title: 'Error 500', icon: AlertCircle, path: '/error/500' },
        ],
      },
    ],
  },
  {
    title: 'Store ',
    children: [
      {
        title: 'Store - Client',
        children: [
          {
            children: [
              { title: 'Home', path: '/store-client/home' },
              {
                title: 'Search Results - Grid',
                path: '/store-client/search-results-grid',
              },
              {
                title: 'Search Results - List',
                path: '/store-client/search-results-list',
              },
              {
                title: 'Product Details',
                path: '/store-client/product-details',
              },
              { title: 'Wishlist', path: '/store-client/wishlist' },
              { title: 'My Orders', path: '/store-client/my-orders' },
            ],
          },
          {
            children: [
              {
                title: 'Checkout - Order Summary',
                path: '/store-client/checkout/order-summary',
              },
              {
                title: 'Checkout - Shipping Info',
                path: '/store-client/checkout/shipping-info',
              },
              {
                title: 'Checkout - Payment Method',
                path: '/store-client/checkout/payment-method',
              },
              {
                title: 'Checkout - Order Placed',
                path: '/store-client/checkout/order-placed',
              },
              { title: 'Order Receipt', path: '/store-client/order-receipt' },
            ],
          },
        ],
      },
    ],
  },
];

export const MENU_MEGA_MOBILE: MenuConfig = [
  { title: 'Home', path: '/' },
  {
    title: 'Profiles',
    children: [
      {
        title: 'Profiles',
        children: [
          {
            title: 'Default',
            icon: Badge,
            path: '/public-profile/profiles/default',
          },
          {
            title: 'Creator',
            icon: Coffee,
            path: '/public-profile/profiles/creator',
          },
          {
            title: 'Company',
            icon: Building,
            path: '/public-profile/profiles/company',
          },
          { title: 'NFT', icon: Bitcoin, path: '/public-profile/profiles/nft' },
          {
            title: 'Blogger',
            icon: MessageSquare,
            path: '/public-profile/profiles/blogger',
          },
          { title: 'CRM', icon: Monitor, path: '/public-profile/profiles/crm' },
          {
            title: 'Gamer',
            icon: Ghost,
            path: '/public-profile/profiles/gamer',
          },
          {
            title: 'Feeds',
            icon: Book,
            path: '/public-profile/profiles/feeds',
          },
          {
            title: 'Plain',
            icon: File,
            path: '/public-profile/profiles/plain',
          },
          {
            title: 'Modal',
            icon: SquareMousePointer,
            path: '/public-profile/profiles/modal',
          },
          { title: 'Freelancer', icon: Briefcase, path: '#', disabled: true },
          { title: 'Developer', icon: Code, path: '#', disabled: true },
          { title: 'Team', icon: Users, path: '#', disabled: true },
          { title: 'Events', icon: CalendarCheck, path: '#', disabled: true },
        ],
      },
      {
        title: 'Other Pages',
        children: [
          {
            title: 'Projects - 3 Cols',
            icon: Layout,
            path: '/public-profile/projects/3-columns',
          },
          {
            title: 'Projects - 2 Cols',
            icon: Grid,
            path: '/public-profile/projects/2-columns',
          },
          { title: 'Works', icon: WorkIcon, path: '/public-profile/works' },
          { title: 'Teams', icon: PeopleIcon, path: '/public-profile/teams' },
          { title: 'Network', icon: Network, path: '/public-profile/network' },
          {
            title: 'Activity',
            icon: TrendingUp,
            path: '/public-profile/activity',
          },
          {
            title: 'Campaigns - Card',
            icon: LayoutGrid,
            path: '/public-profile/campaigns/card',
          },
          {
            title: 'Campaigns - List',
            icon: Kanban,
            path: '/public-profile/campaigns/list',
          },
          { title: 'Empty', icon: FileText, path: '/public-profile/empty' },
          { title: 'Documents', icon: DocumentIcon, path: '#', disabled: true },
          { title: 'Badges', icon: Award, path: '#', disabled: true },
          { title: 'Awards', icon: Gift, path: '#', disabled: true },
        ],
      },
    ],
  },
  {
    title: 'My Account',
    children: [
      {
        title: 'General Pages',
        children: [
          { title: 'Integrations', icon: Plug, path: '/account/integrations' },
          {
            title: 'Notifications',
            icon: Bell,
            path: '/account/notifications',
          },
          { title: 'API Keys', icon: Key, path: '/account/api-keys' },
          { title: 'Appearance', icon: Eye, path: '/account/appearance' },
          {
            title: 'Invite a Friend',
            icon: UserCheck,
            path: '/account/invite-a-friend',
          },
          { title: 'Activity', icon: LifeBuoy, path: '/account/activity' },
          { title: 'Brand', icon: CheckCircle, disabled: true },
          { title: 'Get Paid', icon: Euro, disabled: true },
        ],
      },
      {
        title: 'Other pages',
        children: [
          {
            title: 'Account Home',
            children: [
              { title: 'Get Started', path: '/account/home/get-started' },
              { title: 'User Profile', path: '/account/home/user-profile' },
              {
                title: 'Company Profile',
                path: '/account/home/company-profile',
              },
              { title: 'With Sidebar', path: '/account/home/settings-sidebar' },
              {
                title: 'Enterprise',
                path: '/account/home/settings-enterprise',
              },
              { title: 'Plain', path: '/account/home/settings-plain' },
              { title: 'Modal', path: '/account/home/settings-modal' },
            ],
          },
          {
            title: 'Billing',
            children: [
              { title: 'Basic Billing', path: '/account/billing/basic' },
              { title: 'Enterprise', path: '/account/billing/enterprise' },
              { title: 'Plans', path: '/account/billing/plans' },
              { title: 'Billing History', path: '/account/billing/history' },
              { title: 'Tax Info', disabled: true },
              { title: 'Invoices', disabled: true },
              { title: 'Gateaways', disabled: true },
            ],
          },
          {
            title: 'Security',
            children: [
              { title: 'Get Started', path: '/account/security/get-started' },
              {
                title: 'Security Overview',
                path: '/account/security/overview',
              },
              {
                title: 'IP Addresses',
                path: '/account/security/allowed-ip-addresses',
              },
              {
                title: 'Privacy Settings',
                path: '/account/security/privacy-settings',
              },
              {
                title: 'Device Management',
                path: '/account/security/device-management',
              },
              {
                title: 'Backup & Recovery',
                path: '/account/security/backup-and-recovery',
              },
              {
                title: 'Current Sessions',
                path: '/account/security/current-sessions',
              },
              { title: 'Security Log', path: '/account/security/security-log' },
            ],
          },
          {
            title: 'Members & Roles',
            children: [
              { title: 'Teams Starter', path: '/account/members/team-starter' },
              { title: 'Teams', path: '/account/members/teams' },
              { title: 'Team Info', path: '/account/members/team-info' },
              {
                title: 'Members Starter',
                path: '/account/members/members-starter',
              },
              { title: 'Team Members', path: '/account/members/team-members' },
              {
                title: 'Import Members',
                path: '/account/members/import-members',
              },
              { title: 'Roles', path: '/account/members/roles' },
              {
                title: 'Permissions - Toggler',
                path: '/account/members/permissions-toggle',
              },
              {
                title: 'Permissions - Check',
                path: '/account/members/permissions-check',
              },
            ],
          },
          {
            title: 'Other Pages',
            children: [
              { title: 'Integrations', path: '/account/integrations' },
              { title: 'Notifications', path: '/account/notifications' },
              { title: 'API Keys', path: '/account/api-keys' },
              { title: 'Appearance', path: '/account/appearance' },
              { title: 'Invite a Friend', path: '/account/invite-a-friend' },
              { title: 'Activity', path: '/account/activity' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Network',
    children: [
      {
        title: 'General Pages',
        children: [
          { title: 'Get Started', icon: Flag, path: '/network/get-started' },
          { title: 'Colleagues', icon: Users, path: '#', disabled: true },
          { title: 'Donators', icon: Heart, path: '#', disabled: true },
          { title: 'Leads', icon: Zap, path: '#', disabled: true },
        ],
      },
      {
        title: 'Other pages',
        children: [
          {
            title: 'User Cards',
            children: [
              { title: 'Mini Cards', path: '/network/user-cards/mini-cards' },
              { title: 'Team Members', path: '/network/user-cards/team-crew' },
              { title: 'Authors', path: '/network/user-cards/author' },
              { title: 'NFT Users', path: '/network/user-cards/nft' },
              { title: 'Social Users', path: '/network/user-cards/social' },
              { title: 'Gamers', path: '#', disabled: true },
            ],
          },
          {
            title: 'User Base',
            badge: 'Datatables',
            children: [
              { title: 'Team Crew', path: '/network/user-table/team-crew' },
              { title: 'App Roster', path: '/network/user-table/app-roster' },
              {
                title: 'Market Authors',
                path: '/network/user-table/market-authors',
              },
              { title: 'SaaS Users', path: '/network/user-table/saas-users' },
              {
                title: 'Store Clients',
                path: '/network/user-table/store-clients',
              },
              { title: 'Visitors', path: '/network/user-table/visitors' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Store - Client',
    children: [
      { title: 'Home', path: '/store-client/home' },
      {
        title: 'Search Results - Grid',
        path: '/store-client/search-results-grid',
      },
      {
        title: 'Search Results - List',
        path: '/store-client/search-results-list',
      },
      { title: 'Product Details', path: '/store-client/product-details' },
      { title: 'Wishlist', path: '/store-client/wishlist' },
      {
        title: 'Checkout',
        children: [
          {
            title: 'Order Summary',
            path: '/store-client/checkout/order-summary',
          },
          {
            title: 'Shipping Info',
            path: '/store-client/checkout/shipping-info',
          },
          {
            title: 'Payment Method',
            path: '/store-client/checkout/payment-method',
          },
          {
            title: 'Order Placed',
            path: '/store-client/checkout/order-placed',
          },
        ],
      },
      { title: 'My Orders', path: '/store-client/my-orders' },
      { title: 'Order Receipt', path: '/store-client/order-receipt' },
    ],
  },
  {
    title: 'Authentication',
    children: [
      {
        title: 'General pages',
        children: [
          {
            title: 'Classic Layout',
            children: [
              { title: 'Sign In', path: '/auth/classic/signin' },
              { title: 'Sign Up', path: '/auth/classic/signup' },
              { title: '2FA', path: '/auth/classic/2fa' },
              { title: 'Check Email', path: '/auth/classic/check-email' },
              {
                title: 'Reset Password',
                children: [
                  {
                    title: 'Enter Email',
                    path: '/auth/classic/request-reset',
                  },
                  {
                    title: 'Check Email',
                    path: '/auth/classic/reset-password/check-email',
                  },
                  {
                    title: 'Password is Changed',
                    path: '/auth/classic/reset-password/changed',
                  },
                ],
              },
            ],
          },
          {
            title: 'Branded Layout',
            children: [
              { title: 'Sign In', path: '/auth/signin' },
              { title: 'Sign Up', path: '/auth/signup' },
              { title: '2FA', path: '/auth/2fa' },
              { title: 'Check Email', path: '/auth/check-email' },
              {
                title: 'Reset Password',
                children: [
                  {
                    title: 'Enter Email',
                    path: '/auth/request-reset',
                  },
                  {
                    title: 'Check Email',
                    path: '/auth/reset-password/check-email',
                  },
                  {
                    title: 'Password is Changed',
                    path: '/auth/reset-password/changed',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Other Pages',
        children: [
          {
            title: 'Welcome Message',
            icon: ThumbsUp,
            path: '/auth/welcome-message',
          },
          {
            title: 'Account Deactivated',
            icon: ShieldOff,
            path: '/auth/account-deactivated',
          },
          { title: 'Error 404', icon: HelpCircle, path: '/error/404' },
          { title: 'Error 500', icon: AlertCircle, path: '/error/500' },
        ],
      },
    ],
  },
  {
    title: 'Help',
    children: [
      {
        title: 'Getting Started',
        icon: Coffee,
        path: 'https://keenthemes.com/metronic/tailwind/docs/getting-started/installation',
      },
      {
        title: 'Support Forum',
        icon: AlertCircle,
        children: [
          {
            title: 'All Questions',
            icon: FileQuestion,
            path: 'https://devs.keenthemes.com',
          },
          {
            title: 'Popular Questions',
            icon: Star,
            path: 'https://devs.keenthemes.com/popular',
          },
          {
            title: 'Ask Question',
            icon: HelpCircle,
            path: 'https://devs.keenthemes.com/question/create',
          },
        ],
      },
      {
        title: 'Licenses & FAQ',
        icon: Captions,
        path: 'https://keenthemes.com/metronic/tailwind/docs/getting-started/license',
      },
      {
        title: 'Documentation',
        icon: FileQuestion,
        path: 'https://keenthemes.com/metronic/tailwind/docs',
      },
      { separator: true },
      {
        title: 'Contact Us',
        icon: Share2,
        path: 'https://keenthemes.com/contact',
      },
    ],
  },
];

export const MENU_HELP: MenuConfig = [
  {
    title: 'Getting Started',
    icon: Coffee,
    path: 'https://keenthemes.com/metronic/tailwind/docs/getting-started/installation',
  },
  {
    title: 'Support Forum',
    icon: AlertCircle,
    children: [
      {
        title: 'All Questions',
        icon: FileQuestion,
        path: 'https://devs.keenthemes.com',
      },
      {
        title: 'Popular Questions',
        icon: Star,
        path: 'https://devs.keenthemes.com/popular',
      },
      {
        title: 'Ask Question',
        icon: HelpCircle,
        path: 'https://devs.keenthemes.com/question/create',
      },
    ],
  },
  {
    title: 'Licenses & FAQ',
    icon: Captions,
    path: 'https://keenthemes.com/metronic/tailwind/docs/getting-started/license',
  },
  {
    title: 'Documentation',
    icon: FileQuestion,
    path: 'https://keenthemes.com/metronic/tailwind/docs',
  },
  { separator: true },
  { title: 'Contact Us', icon: Share2, path: 'https://keenthemes.com/contact' },
];

export const MENU_ROOT: MenuConfig = [
  {
    title: 'Public Profile',
    icon: UserCircle,
    rootPath: '/public-profile/',
    path: 'public-profile/profiles/default',
    childrenIndex: 2,
  },
  {
    title: 'Account',
    icon: Settings,
    rootPath: '/account/',
    path: '/',
    childrenIndex: 3,
  },
  {
    title: 'Network',
    icon: Users,
    rootPath: '/network/',
    path: 'network/get-started',
    childrenIndex: 4,
  },
  {
    title: 'Store - Client',
    icon: ShoppingCart,
    rootPath: '/store-client/',
    path: 'store-client/home',
    childrenIndex: 4,
  },
  {
    title: 'Authentication',
    icon: Shield,
    rootPath: '/authentication/',
    path: 'authentication/get-started',
    childrenIndex: 5,
  },
];
