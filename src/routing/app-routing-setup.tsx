import { Suspense } from 'react';
import { ClassicLayout } from '@/auth/layouts/classic';
import { AccessDeniedNotice } from '@/components/shared/AccessDeniedNotice';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { RequirePlatformAuth } from '@/lib/auth/RequirePlatformAuth';
import { ErrorRouting } from '@/errors/error-routing';
import { Demo1Layout } from '@/layouts/demo1/layout';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { lazyPage } from './lazyPage';

// Dashboard
const DashboardPage = lazyPage(() => import('@/features/dashboard'), 'DashboardPage');

// Me (self-service, Phase 3 — mycondo-docs ADR-021) — no RequirePermission wrapper: each backend
// query enforces its own per-relationship permission check internally, so any authenticated user may
// load the page (it may simply render empty for a user with no ownership/occupancy relationship).
const MyFlatsPage = lazyPage(() => import('@/features/me'), 'MyFlatsPage');
const MyInvoicesPage = lazyPage(() => import('@/features/me'), 'MyInvoicesPage');

// Auth
const LoginPage = lazyPage(() => import('@/features/auth/pages/LoginPage'), 'LoginPage');
const RegisterPage = lazyPage(() => import('@/features/auth/pages/RegisterPage'), 'RegisterPage');
const AuthWelcomeMessagePage = lazyPage(() => import('@/pages/auth'), 'AuthWelcomeMessagePage');
const AuthAccountDeactivatedPage = lazyPage(() => import('@/pages/auth'), 'AuthAccountDeactivatedPage');

// Platform (see mycondo-docs ADR-019) — deliberately not linked from the tenant /login page; an
// internal-only route for MyCondo's own operations staff, structurally separate from every tenant
// route above and below it.
const PlatformLoginPage = lazyPage(
  () => import('@/features/platform/pages/PlatformLoginPage'),
  'PlatformLoginPage',
);
const PlatformDashboardPage = lazyPage(
  () => import('@/features/platform/pages/PlatformDashboardPage'),
  'PlatformDashboardPage',
);
const NewOrganizationWizardPage = lazyPage(
  () => import('@/features/platform/pages/NewOrganizationWizardPage'),
  'NewOrganizationWizardPage',
);
const PlatformOrganizationDetailPage = lazyPage(
  () => import('@/features/platform/pages/PlatformOrganizationDetailPage'),
  'PlatformOrganizationDetailPage',
);

// Security
const security = () => import('@/features/security');
const GuestDirectoryPage = lazyPage(security, 'GuestDirectoryPage');
const GuestProfileFormPage = lazyPage(security, 'GuestProfileFormPage');
const GuestCheckInOutPage = lazyPage(security, 'GuestCheckInOutPage');
const CurrentlyInsideGuestsPage = lazyPage(security, 'CurrentlyInsideGuestsPage');
const VehicleDirectoryPage = lazyPage(security, 'VehicleDirectoryPage');
const VehicleFormPage = lazyPage(security, 'VehicleFormPage');
const VehicleCheckInOutPage = lazyPage(security, 'VehicleCheckInOutPage');
const CurrentlyInsideVehiclesPage = lazyPage(security, 'CurrentlyInsideVehiclesPage');
const DomesticWorkerDirectoryPage = lazyPage(security, 'DomesticWorkerDirectoryPage');
const DomesticWorkerFormPage = lazyPage(security, 'DomesticWorkerFormPage');
const DomesticWorkerCheckInOutPage = lazyPage(security, 'DomesticWorkerCheckInOutPage');
const CurrentlyInsideDomesticWorkersPage = lazyPage(security, 'CurrentlyInsideDomesticWorkersPage');
const ServiceProviderDirectoryPage = lazyPage(security, 'ServiceProviderDirectoryPage');
const ServiceProviderFormPage = lazyPage(security, 'ServiceProviderFormPage');
const ServiceProviderCheckInOutPage = lazyPage(security, 'ServiceProviderCheckInOutPage');
const CurrentlyInsideServiceProvidersPage = lazyPage(security, 'CurrentlyInsideServiceProvidersPage');
const ParcelRegisterPage = lazyPage(security, 'ParcelRegisterPage');
const ReceiveParcelPage = lazyPage(security, 'ReceiveParcelPage');
const ParcelDetailPage = lazyPage(security, 'ParcelDetailPage');

// Leasing
const leasing = () => import('@/features/leasing');
const TenantRegistrationListPage = lazyPage(leasing, 'TenantRegistrationListPage');
const TenantRegistrationWizardPage = lazyPage(leasing, 'TenantRegistrationWizardPage');
const TenantRegistrationDetailPage = lazyPage(leasing, 'TenantRegistrationDetailPage');
const TenantRegistrationPrintPage = lazyPage(leasing, 'TenantRegistrationPrintPage');
const SecurityDirectoryPage = lazyPage(leasing, 'SecurityDirectoryPage');

// Billing & Payments
const billing = () => import('@/features/billing');
const ServiceChargeRuleDirectoryPage = lazyPage(billing, 'ServiceChargeRuleDirectoryPage');
const ServiceChargeRuleFormPage = lazyPage(billing, 'ServiceChargeRuleFormPage');
const InvoiceListPage = lazyPage(billing, 'InvoiceListPage');
const InvoiceDetailPage = lazyPage(billing, 'InvoiceDetailPage');
const BatchBillingPage = lazyPage(billing, 'BatchBillingPage');
const OutstandingInvoicesPage = lazyPage(billing, 'OutstandingInvoicesPage');

const payments = () => import('@/features/payments');
const PaymentListPage = lazyPage(payments, 'PaymentListPage');
const RecordPaymentPage = lazyPage(payments, 'RecordPaymentPage');
const PaymentDetailPage = lazyPage(payments, 'PaymentDetailPage');
const ResidentLedgerPage = lazyPage(payments, 'ResidentLedgerPage');
const FinancialSummaryReportPage = lazyPage(payments, 'FinancialSummaryReportPage');
const ReceivablesAgeingReportPage = lazyPage(payments, 'ReceivablesAgeingReportPage');

// Utilities
const utilities = () => import('@/features/utilities');
const MeterDirectoryPage = lazyPage(utilities, 'MeterDirectoryPage');
const ReadingRegisterPage = lazyPage(utilities, 'ReadingRegisterPage');
const ReadingCapturePage = lazyPage(utilities, 'ReadingCapturePage');
const ReadingDetailPage = lazyPage(utilities, 'ReadingDetailPage');
const RatePlanDirectoryPage = lazyPage(utilities, 'RatePlanDirectoryPage');
const RatePlanFormPage = lazyPage(utilities, 'RatePlanFormPage');
const ReadingStatusReportPage = lazyPage(utilities, 'ReadingStatusReportPage');
const ConsumptionHistoryReportPage = lazyPage(utilities, 'ConsumptionHistoryReportPage');
const ConsumptionSummaryReportPage = lazyPage(utilities, 'ConsumptionSummaryReportPage');

// Facilities (amenities)
const amenities = () => import('@/features/amenities');
const BookingCalendarPage = lazyPage(amenities, 'BookingCalendarPage');
const BookingListPage = lazyPage(amenities, 'BookingListPage');
const BookingFormPage = lazyPage(amenities, 'BookingFormPage');
const BookingDetailsPage = lazyPage(amenities, 'BookingDetailsPage');
const PoolAccessPage = lazyPage(amenities, 'PoolAccessPage');
const CurrentOccupancyPage = lazyPage(amenities, 'CurrentOccupancyPage');
const UsageHistoryPage = lazyPage(amenities, 'UsageHistoryPage');
const FacilitySettingsPage = lazyPage(amenities, 'FacilitySettingsPage');
const FacilityUtilizationReportPage = lazyPage(amenities, 'FacilityUtilizationReportPage');
const BookingRevenueReportPage = lazyPage(amenities, 'BookingRevenueReportPage');
const PoolDailyUsageReportPage = lazyPage(amenities, 'PoolDailyUsageReportPage');

// Operations
const operations = () => import('@/features/operations');
const GeneratorLogPage = lazyPage(operations, 'GeneratorLogPage');
const GeneratorFuelLogPage = lazyPage(operations, 'GeneratorFuelLogPage');
const GeneratorMaintenancePage = lazyPage(operations, 'GeneratorMaintenancePage');
const GeneratorReportsPage = lazyPage(operations, 'GeneratorReportsPage');
const CylinderPurchaseListPage = lazyPage(operations, 'CylinderPurchaseListPage');
const CylinderStockPage = lazyPage(operations, 'CylinderStockPage');
const CylinderConsumptionPage = lazyPage(operations, 'CylinderConsumptionPage');
const SupplierComparisonPage = lazyPage(operations, 'SupplierComparisonPage');

// Payroll & Admin
const payroll = () => import('@/features/payroll');
const StaffRosterPage = lazyPage(payroll, 'StaffRosterPage');
const StaffMemberFormPage = lazyPage(payroll, 'StaffMemberFormPage');
const AttendanceRegisterPage = lazyPage(payroll, 'AttendanceRegisterPage');
const CurrentlyPresentStaffPage = lazyPage(payroll, 'CurrentlyPresentStaffPage');

const identity = () => import('@/features/identity');
const UsersPage = lazyPage(identity, 'UsersPage');
const RolePermissionMatrixPage = lazyPage(identity, 'RolePermissionMatrixPage');

const residents = () => import('@/features/residents');
const ResidentListPage = lazyPage(residents, 'ResidentListPage');
const FlatOwnerListPage = lazyPage(residents, 'FlatOwnerListPage');

const expenses = () => import('@/features/expenses');
const ExpenseTypeListPage = lazyPage(expenses, 'ExpenseTypeListPage');
const ExpenseListPage = lazyPage(expenses, 'ExpenseListPage');

const property = () => import('@/features/property');
const BuildingListPage = lazyPage(property, 'BuildingListPage');
const FlatListPage = lazyPage(property, 'FlatListPage');


// Metronic template demo/scaffold pages — reachable by direct URL only (no live menu link, see
// UX-6 cleanup discovery), kept per governance but not worth their weight in the main bundle.
const Demo1DarkSidebarPage = lazyPage(() => import('@/pages/dashboards'), 'Demo1DarkSidebarPage');

const account = () => import('@/pages/account');
const AccountGetStartedPage = lazyPage(account, 'AccountGetStartedPage');
const AccountUserProfilePage = lazyPage(account, 'AccountUserProfilePage');
const AccountCompanyProfilePage = lazyPage(account, 'AccountCompanyProfilePage');
const AccountSettingsSidebarPage = lazyPage(account, 'AccountSettingsSidebarPage');
const AccountSettingsEnterprisePage = lazyPage(account, 'AccountSettingsEnterprisePage');
const AccountSettingsPlainPage = lazyPage(account, 'AccountSettingsPlainPage');
const AccountSettingsModalPage = lazyPage(account, 'AccountSettingsModalPage');
const AccountBasicPage = lazyPage(account, 'AccountBasicPage');
const AccountEnterprisePage = lazyPage(account, 'AccountEnterprisePage');
const AccountPlansPage = lazyPage(account, 'AccountPlansPage');
const AccountHistoryPage = lazyPage(account, 'AccountHistoryPage');
const AccountSecurityGetStartedPage = lazyPage(account, 'AccountSecurityGetStartedPage');
const AccountOverviewPage = lazyPage(account, 'AccountOverviewPage');
const AccountAllowedIPAddressesPage = lazyPage(account, 'AccountAllowedIPAddressesPage');
const AccountPrivacySettingsPage = lazyPage(account, 'AccountPrivacySettingsPage');
const AccountDeviceManagementPage = lazyPage(account, 'AccountDeviceManagementPage');
const AccountBackupAndRecoveryPage = lazyPage(account, 'AccountBackupAndRecoveryPage');
const AccountCurrentSessionsPage = lazyPage(account, 'AccountCurrentSessionsPage');
const AccountSecurityLogPage = lazyPage(account, 'AccountSecurityLogPage');
const AccountTeamsStarterPage = lazyPage(account, 'AccountTeamsStarterPage');
const AccountTeamsPage = lazyPage(account, 'AccountTeamsPage');
const AccountTeamInfoPage = lazyPage(account, 'AccountTeamInfoPage');
const AccountMembersStarterPage = lazyPage(account, 'AccountMembersStarterPage');
const AccountTeamMembersPage = lazyPage(account, 'AccountTeamMembersPage');
const AccountImportMembersPage = lazyPage(account, 'AccountImportMembersPage');
const AccountRolesPage = lazyPage(account, 'AccountRolesPage');
const AccountPermissionsTogglePage = lazyPage(account, 'AccountPermissionsTogglePage');
const AccountPermissionsCheckPage = lazyPage(account, 'AccountPermissionsCheckPage');
const AccountIntegrationsPage = lazyPage(account, 'AccountIntegrationsPage');
const AccountNotificationsPage = lazyPage(account, 'AccountNotificationsPage');
const AccountApiKeysPage = lazyPage(account, 'AccountApiKeysPage');
const AccountAppearancePage = lazyPage(account, 'AccountAppearancePage');
const AccountInviteAFriendPage = lazyPage(account, 'AccountInviteAFriendPage');
const AccountActivityPage = lazyPage(account, 'AccountActivityPage');

const publicProfile = () => import('@/pages/public-profile');
const ProfileDefaultPage = lazyPage(publicProfile, 'ProfileDefaultPage');
const ProfileCreatorPage = lazyPage(publicProfile, 'ProfileCreatorPage');
const ProfileCompanyPage = lazyPage(publicProfile, 'ProfileCompanyPage');
const ProfileNFTPage = lazyPage(publicProfile, 'ProfileNFTPage');
const ProfileBloggerPage = lazyPage(publicProfile, 'ProfileBloggerPage');
const ProfileCRMPage = lazyPage(publicProfile, 'ProfileCRMPage');
const ProfileGamerPage = lazyPage(publicProfile, 'ProfileGamerPage');
const ProfileFeedsPage = lazyPage(publicProfile, 'ProfileFeedsPage');
const ProfilePlainPage = lazyPage(publicProfile, 'ProfilePlainPage');
const ProfileModalPage = lazyPage(publicProfile, 'ProfileModalPage');
const ProjectColumn3Page = lazyPage(publicProfile, 'ProjectColumn3Page');
const ProjectColumn2Page = lazyPage(publicProfile, 'ProjectColumn2Page');
const ProfileWorksPage = lazyPage(publicProfile, 'ProfileWorksPage');
const ProfileTeamsPage = lazyPage(publicProfile, 'ProfileTeamsPage');
const ProfileNetworkPage = lazyPage(publicProfile, 'ProfileNetworkPage');
const ProfileActivityPage = lazyPage(publicProfile, 'ProfileActivityPage');
const CampaignsCardPage = lazyPage(publicProfile, 'CampaignsCardPage');
const CampaignsListPage = lazyPage(publicProfile, 'CampaignsListPage');
const ProfileEmptyPage = lazyPage(publicProfile, 'ProfileEmptyPage');

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route element={<RequireAuth><Outlet /></RequireAuth>}>
        <Route element={<Demo1Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/me/flats" element={<MyFlatsPage />} />
          <Route path="/me/invoices" element={<MyInvoicesPage />} />
          <Route path="/dark-sidebar" element={<Demo1DarkSidebarPage />} />
          <Route
            path="/public-profile/profiles/default/"
            element={<ProfileDefaultPage />}
          />
          <Route
            path="/public-profile/profiles/creator"
            element={<ProfileCreatorPage />}
          />
          <Route
            path="/public-profile/profiles/company"
            element={<ProfileCompanyPage />}
          />
          <Route
            path="/public-profile/profiles/nft"
            element={<ProfileNFTPage />}
          />
          <Route
            path="/public-profile/profiles/blogger"
            element={<ProfileBloggerPage />}
          />
          <Route
            path="/public-profile/profiles/crm"
            element={<ProfileCRMPage />}
          />
          <Route
            path="/public-profile/profiles/gamer"
            element={<ProfileGamerPage />}
          />
          <Route
            path="/public-profile/profiles/feeds"
            element={<ProfileFeedsPage />}
          />
          <Route
            path="/public-profile/profiles/plain"
            element={<ProfilePlainPage />}
          />
          <Route
            path="/public-profile/profiles/modal"
            element={<ProfileModalPage />}
          />
          <Route
            path="/public-profile/projects/3-columns"
            element={<ProjectColumn3Page />}
          />
          <Route
            path="/public-profile/projects/2-columns"
            element={<ProjectColumn2Page />}
          />
          <Route path="/public-profile/works" element={<ProfileWorksPage />} />
          <Route path="/public-profile/teams" element={<ProfileTeamsPage />} />
          <Route
            path="/public-profile/network"
            element={<ProfileNetworkPage />}
          />
          <Route
            path="/public-profile/activity"
            element={<ProfileActivityPage />}
          />
          <Route
            path="/public-profile/campaigns/card"
            element={<CampaignsCardPage />}
          />
          <Route
            path="/public-profile/campaigns/list"
            element={<CampaignsListPage />}
          />
          <Route path="/public-profile/empty" element={<ProfileEmptyPage />} />
          <Route
            path="/account/home/get-started"
            element={<AccountGetStartedPage />}
          />
          <Route
            path="/account/home/user-profile"
            element={<AccountUserProfilePage />}
          />
          <Route
            path="/account/home/company-profile"
            element={<AccountCompanyProfilePage />}
          />
          <Route
            path="/account/home/settings-sidebar"
            element={<AccountSettingsSidebarPage />}
          />
          <Route
            path="/account/home/settings-enterprise"
            element={<AccountSettingsEnterprisePage />}
          />
          <Route
            path="/account/home/settings-plain"
            element={<AccountSettingsPlainPage />}
          />
          <Route
            path="/account/home/settings-modal"
            element={<AccountSettingsModalPage />}
          />
          <Route path="/account/billing/basic" element={<AccountBasicPage />} />
          <Route
            path="/account/billing/enterprise"
            element={<AccountEnterprisePage />}
          />
          <Route path="/account/billing/plans" element={<AccountPlansPage />} />
          <Route
            path="/account/billing/history"
            element={<AccountHistoryPage />}
          />
          <Route
            path="/account/security/get-started"
            element={<AccountSecurityGetStartedPage />}
          />
          <Route
            path="/account/security/overview"
            element={<AccountOverviewPage />}
          />
          <Route
            path="/account/security/allowed-ip-addresses"
            element={<AccountAllowedIPAddressesPage />}
          />
          <Route
            path="/account/security/privacy-settings"
            element={<AccountPrivacySettingsPage />}
          />
          <Route
            path="/account/security/device-management"
            element={<AccountDeviceManagementPage />}
          />
          <Route
            path="/account/security/backup-and-recovery"
            element={<AccountBackupAndRecoveryPage />}
          />
          <Route
            path="/account/security/current-sessions"
            element={<AccountCurrentSessionsPage />}
          />
          <Route
            path="/account/security/security-log"
            element={<AccountSecurityLogPage />}
          />
          <Route
            path="/account/members/team-starter"
            element={<AccountTeamsStarterPage />}
          />
          <Route path="/account/members/teams" element={<AccountTeamsPage />} />
          <Route
            path="/account/members/team-info"
            element={<AccountTeamInfoPage />}
          />
          <Route
            path="/account/members/members-starter"
            element={<AccountMembersStarterPage />}
          />
          <Route
            path="/account/members/team-members"
            element={<AccountTeamMembersPage />}
          />
          <Route
            path="/account/members/import-members"
            element={<AccountImportMembersPage />}
          />
          <Route path="/account/members/roles" element={<AccountRolesPage />} />
          <Route
            path="/account/members/permissions-toggle"
            element={<AccountPermissionsTogglePage />}
          />
          <Route
            path="/account/members/permissions-check"
            element={<AccountPermissionsCheckPage />}
          />
          <Route
            path="/account/integrations"
            element={<AccountIntegrationsPage />}
          />
          <Route
            path="/account/notifications"
            element={<AccountNotificationsPage />}
          />
          <Route path="/account/api-keys" element={<AccountApiKeysPage />} />
          <Route
            path="/account/appearance"
            element={<AccountAppearancePage />}
          />
          <Route
            path="/account/invite-a-friend"
            element={<AccountInviteAFriendPage />}
          />
          <Route path="/account/activity" element={<AccountActivityPage />} />
          <Route
            path="/auth/welcome-message"
            element={<AuthWelcomeMessagePage />}
          />
          <Route
            path="/auth/account-deactivated"
            element={<AuthAccountDeactivatedPage />}
          />
          <Route path="/auth/get-started" element={<AccountGetStartedPage />} />
          <Route
            path="/admin/users"
            element={
              <RequirePermission permission="user.view" fallback={<AccessDeniedNotice />}>
                <UsersPage />
              </RequirePermission>
            }
          />
          <Route
            path="/residents"
            element={
              <RequirePermission permission="resident.view" fallback={<AccessDeniedNotice />}>
                <ResidentListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/residents/flat-owners"
            element={
              <RequirePermission permission="ownership.manage" fallback={<AccessDeniedNotice />}>
                <FlatOwnerListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/finance/expense-types"
            element={
              <RequirePermission permission="expensetype.view" fallback={<AccessDeniedNotice />}>
                <ExpenseTypeListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/finance/expenses"
            element={
              <RequirePermission permission="expense.view" fallback={<AccessDeniedNotice />}>
                <ExpenseListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <RequirePermission permission="role.view" fallback={<AccessDeniedNotice />}>
                <RolePermissionMatrixPage />
              </RequirePermission>
            }
          />
          <Route
            path="/admin/buildings"
            element={
              <RequirePermission permission="property.view" fallback={<AccessDeniedNotice />}>
                <BuildingListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/admin/buildings/:buildingId/flats"
            element={
              <RequirePermission permission="property.view" fallback={<AccessDeniedNotice />}>
                <FlatListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/guests"
            element={
              <RequirePermission permission={PERMISSIONS.visitor.view} fallback={<AccessDeniedNotice />}>
                <GuestDirectoryPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/guests/new"
            element={
              <RequirePermission permission={PERMISSIONS.visitor.create} fallback={<AccessDeniedNotice />}>
                <GuestProfileFormPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/guests/checkin-out"
            element={
              <RequirePermission permission={PERMISSIONS.visitor.checkin} fallback={<AccessDeniedNotice />}>
                <GuestCheckInOutPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/guests/currently-inside"
            element={
              <RequirePermission permission={PERMISSIONS.report.securityView} fallback={<AccessDeniedNotice />}>
                <CurrentlyInsideGuestsPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/vehicles"
            element={
              <RequirePermission permission={PERMISSIONS.vehicle.view} fallback={<AccessDeniedNotice />}>
                <VehicleDirectoryPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/vehicles/new"
            element={
              <RequirePermission permission={PERMISSIONS.vehicle.create} fallback={<AccessDeniedNotice />}>
                <VehicleFormPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/vehicles/checkin-out"
            element={
              <RequirePermission permission={PERMISSIONS.vehicle.checkin} fallback={<AccessDeniedNotice />}>
                <VehicleCheckInOutPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/vehicles/currently-inside"
            element={
              <RequirePermission permission={PERMISSIONS.report.securityView} fallback={<AccessDeniedNotice />}>
                <CurrentlyInsideVehiclesPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/domestic-workers"
            element={
              <RequirePermission permission={PERMISSIONS.domesticWorker.view} fallback={<AccessDeniedNotice />}>
                <DomesticWorkerDirectoryPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/domestic-workers/new"
            element={
              <RequirePermission permission={PERMISSIONS.domesticWorker.manage} fallback={<AccessDeniedNotice />}>
                <DomesticWorkerFormPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/domestic-workers/checkin-out"
            element={
              <RequirePermission permission={PERMISSIONS.domesticWorker.checkin} fallback={<AccessDeniedNotice />}>
                <DomesticWorkerCheckInOutPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/domestic-workers/currently-inside"
            element={
              <RequirePermission permission={PERMISSIONS.report.securityView} fallback={<AccessDeniedNotice />}>
                <CurrentlyInsideDomesticWorkersPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/service-providers"
            element={
              <RequirePermission permission={PERMISSIONS.serviceProvider.view} fallback={<AccessDeniedNotice />}>
                <ServiceProviderDirectoryPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/service-providers/new"
            element={
              <RequirePermission permission={PERMISSIONS.serviceProvider.manage} fallback={<AccessDeniedNotice />}>
                <ServiceProviderFormPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/service-providers/checkin-out"
            element={
              <RequirePermission permission={PERMISSIONS.serviceProvider.checkin} fallback={<AccessDeniedNotice />}>
                <ServiceProviderCheckInOutPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/service-providers/currently-inside"
            element={
              <RequirePermission permission={PERMISSIONS.report.securityView} fallback={<AccessDeniedNotice />}>
                <CurrentlyInsideServiceProvidersPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/staff-attendance"
            element={
              <RequirePermission permission={PERMISSIONS.staffAttendance.view} fallback={<AccessDeniedNotice />}>
                <StaffRosterPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/staff-attendance/new"
            element={
              <RequirePermission permission={PERMISSIONS.staffAttendance.manage} fallback={<AccessDeniedNotice />}>
                <StaffMemberFormPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/staff-attendance/records"
            element={
              <RequirePermission permission={PERMISSIONS.staffAttendance.view} fallback={<AccessDeniedNotice />}>
                <AttendanceRegisterPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/staff-attendance/currently-present"
            element={
              <RequirePermission permission={PERMISSIONS.staffAttendance.view} fallback={<AccessDeniedNotice />}>
                <CurrentlyPresentStaffPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/parcels"
            element={
              <RequirePermission permission={PERMISSIONS.parcel.view} fallback={<AccessDeniedNotice />}>
                <ParcelRegisterPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/parcels/new"
            element={
              <RequirePermission permission={PERMISSIONS.parcel.receive} fallback={<AccessDeniedNotice />}>
                <ReceiveParcelPage />
              </RequirePermission>
            }
          />
          <Route
            path="/security/parcels/:id"
            element={
              <RequirePermission permission={PERMISSIONS.parcel.view} fallback={<AccessDeniedNotice />}>
                <ParcelDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="/billing/service-charge-rules"
            element={
              <RequirePermission permission={PERMISSIONS.billing.ruleView} fallback={<AccessDeniedNotice />}>
                <ServiceChargeRuleDirectoryPage />
              </RequirePermission>
            }
          />
          <Route
            path="/billing/service-charge-rules/new"
            element={
              <RequirePermission permission={PERMISSIONS.billing.ruleManage} fallback={<AccessDeniedNotice />}>
                <ServiceChargeRuleFormPage />
              </RequirePermission>
            }
          />
          <Route
            path="/billing/invoices"
            element={
              <RequirePermission permission={PERMISSIONS.billing.invoiceView} fallback={<AccessDeniedNotice />}>
                <InvoiceListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/billing/invoices/:id"
            element={
              <RequirePermission permission={PERMISSIONS.billing.invoiceView} fallback={<AccessDeniedNotice />}>
                <InvoiceDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="/billing/generate-batch"
            element={
              <RequirePermission permission={PERMISSIONS.billing.invoiceGenerate} fallback={<AccessDeniedNotice />}>
                <BatchBillingPage />
              </RequirePermission>
            }
          />
          <Route
            path="/billing/payments"
            element={
              <RequirePermission permission={PERMISSIONS.payment.view} fallback={<AccessDeniedNotice />}>
                <PaymentListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/billing/payments/new"
            element={
              <RequirePermission permission={PERMISSIONS.payment.record} fallback={<AccessDeniedNotice />}>
                <RecordPaymentPage />
              </RequirePermission>
            }
          />
          <Route
            path="/billing/payments/:id"
            element={
              <RequirePermission permission={PERMISSIONS.payment.view} fallback={<AccessDeniedNotice />}>
                <PaymentDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="/billing/outstanding-invoices"
            element={
              <RequirePermission permission={PERMISSIONS.billing.invoiceView} fallback={<AccessDeniedNotice />}>
                <OutstandingInvoicesPage />
              </RequirePermission>
            }
          />
          <Route
            path="/billing/ledger"
            element={
              <RequirePermission permission={PERMISSIONS.payment.view} fallback={<AccessDeniedNotice />}>
                <ResidentLedgerPage />
              </RequirePermission>
            }
          />
          <Route
            path="/billing/reports/financial-summary"
            element={
              <RequirePermission permission={PERMISSIONS.report.financialView} fallback={<AccessDeniedNotice />}>
                <FinancialSummaryReportPage />
              </RequirePermission>
            }
          />
          <Route
            path="/billing/reports/receivables-ageing"
            element={
              <RequirePermission permission={PERMISSIONS.report.financialView} fallback={<AccessDeniedNotice />}>
                <ReceivablesAgeingReportPage />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/electricity/meters"
            element={
              <RequirePermission permission={PERMISSIONS.utility.meterView} fallback={<AccessDeniedNotice />}>
                <MeterDirectoryPage utilityType="Electricity" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/electricity/readings"
            element={
              <RequirePermission permission={PERMISSIONS.utility.readingView} fallback={<AccessDeniedNotice />}>
                <ReadingRegisterPage utilityType="Electricity" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/electricity/readings/new"
            element={
              <RequirePermission permission={PERMISSIONS.utility.readingRecord} fallback={<AccessDeniedNotice />}>
                <ReadingCapturePage utilityType="Electricity" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/electricity/readings/:id"
            element={
              <RequirePermission permission={PERMISSIONS.utility.readingView} fallback={<AccessDeniedNotice />}>
                <ReadingDetailPage utilityType="Electricity" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/electricity/rate-plans"
            element={
              <RequirePermission permission={PERMISSIONS.utility.ratePlanView} fallback={<AccessDeniedNotice />}>
                <RatePlanDirectoryPage utilityType="Electricity" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/electricity/rate-plans/new"
            element={
              <RequirePermission permission={PERMISSIONS.utility.ratePlanManage} fallback={<AccessDeniedNotice />}>
                <RatePlanFormPage utilityType="Electricity" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/electricity/reports/billed-vs-unbilled"
            element={
              <RequirePermission permission={PERMISSIONS.utility.readingView} fallback={<AccessDeniedNotice />}>
                <ReadingStatusReportPage utilityType="Electricity" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/electricity/reports/consumption-history"
            element={
              <RequirePermission permission={PERMISSIONS.utility.readingView} fallback={<AccessDeniedNotice />}>
                <ConsumptionHistoryReportPage utilityType="Electricity" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/gas/meters"
            element={
              <RequirePermission permission={PERMISSIONS.utility.meterView} fallback={<AccessDeniedNotice />}>
                <MeterDirectoryPage utilityType="Gas" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/gas/readings"
            element={
              <RequirePermission permission={PERMISSIONS.utility.readingView} fallback={<AccessDeniedNotice />}>
                <ReadingRegisterPage utilityType="Gas" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/gas/readings/new"
            element={
              <RequirePermission permission={PERMISSIONS.utility.readingRecord} fallback={<AccessDeniedNotice />}>
                <ReadingCapturePage utilityType="Gas" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/gas/readings/:id"
            element={
              <RequirePermission permission={PERMISSIONS.utility.readingView} fallback={<AccessDeniedNotice />}>
                <ReadingDetailPage utilityType="Gas" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/gas/rate-plans"
            element={
              <RequirePermission permission={PERMISSIONS.utility.ratePlanView} fallback={<AccessDeniedNotice />}>
                <RatePlanDirectoryPage utilityType="Gas" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/gas/rate-plans/new"
            element={
              <RequirePermission permission={PERMISSIONS.utility.ratePlanManage} fallback={<AccessDeniedNotice />}>
                <RatePlanFormPage utilityType="Gas" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/gas/reports/billed-vs-unbilled"
            element={
              <RequirePermission permission={PERMISSIONS.utility.readingView} fallback={<AccessDeniedNotice />}>
                <ReadingStatusReportPage utilityType="Gas" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/gas/reports/consumption-history"
            element={
              <RequirePermission permission={PERMISSIONS.utility.readingView} fallback={<AccessDeniedNotice />}>
                <ConsumptionHistoryReportPage utilityType="Gas" />
              </RequirePermission>
            }
          />
          <Route
            path="/utilities/reports/consumption-summary"
            element={
              <RequirePermission permission={PERMISSIONS.utility.report} fallback={<AccessDeniedNotice />}>
                <ConsumptionSummaryReportPage />
              </RequirePermission>
            }
          />
          <Route
            path="/facilities/community-hall/calendar"
            element={
              <RequirePermission permission={PERMISSIONS.facility.bookingView} fallback={<AccessDeniedNotice />}>
                <BookingCalendarPage />
              </RequirePermission>
            }
          />
          <Route
            path="/facilities/community-hall/bookings"
            element={
              <RequirePermission permission={PERMISSIONS.facility.bookingView} fallback={<AccessDeniedNotice />}>
                <BookingListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/facilities/community-hall/bookings/new"
            element={
              <RequirePermission permission={PERMISSIONS.facility.bookingCreate} fallback={<AccessDeniedNotice />}>
                <BookingFormPage />
              </RequirePermission>
            }
          />
          <Route
            path="/facilities/community-hall/bookings/:id"
            element={
              <RequirePermission permission={PERMISSIONS.facility.bookingView} fallback={<AccessDeniedNotice />}>
                <BookingDetailsPage />
              </RequirePermission>
            }
          />
          <Route
            path="/facilities/swimming-pool/access"
            element={
              <RequirePermission permission={PERMISSIONS.pool.checkin} fallback={<AccessDeniedNotice />}>
                <PoolAccessPage />
              </RequirePermission>
            }
          />
          <Route
            path="/facilities/swimming-pool/current"
            element={
              <RequirePermission permission={PERMISSIONS.pool.view} fallback={<AccessDeniedNotice />}>
                <CurrentOccupancyPage />
              </RequirePermission>
            }
          />
          <Route
            path="/facilities/swimming-pool/history"
            element={
              <RequirePermission permission={PERMISSIONS.pool.view} fallback={<AccessDeniedNotice />}>
                <UsageHistoryPage />
              </RequirePermission>
            }
          />
          <Route
            path="/facilities/swimming-pool/settings"
            element={
              <RequirePermission permission={PERMISSIONS.facility.manage} fallback={<AccessDeniedNotice />}>
                <FacilitySettingsPage />
              </RequirePermission>
            }
          />
          <Route
            path="/facilities/reports/utilization"
            element={
              <RequirePermission permission={PERMISSIONS.report.facility} fallback={<AccessDeniedNotice />}>
                <FacilityUtilizationReportPage />
              </RequirePermission>
            }
          />
          <Route
            path="/facilities/reports/booking-revenue"
            element={
              <RequirePermission permission={PERMISSIONS.report.facility} fallback={<AccessDeniedNotice />}>
                <BookingRevenueReportPage />
              </RequirePermission>
            }
          />
          <Route
            path="/facilities/reports/pool-daily-usage"
            element={
              <RequirePermission permission={PERMISSIONS.report.facility} fallback={<AccessDeniedNotice />}>
                <PoolDailyUsageReportPage />
              </RequirePermission>
            }
          />
          <Route
            path="/operations/generator/log"
            element={
              <RequirePermission permission={PERMISSIONS.generator.view} fallback={<AccessDeniedNotice />}>
                <GeneratorLogPage />
              </RequirePermission>
            }
          />
          <Route
            path="/operations/generator/fuel"
            element={
              <RequirePermission permission={PERMISSIONS.generator.view} fallback={<AccessDeniedNotice />}>
                <GeneratorFuelLogPage />
              </RequirePermission>
            }
          />
          <Route
            path="/operations/generator/maintenance"
            element={
              <RequirePermission permission={PERMISSIONS.generator.view} fallback={<AccessDeniedNotice />}>
                <GeneratorMaintenancePage />
              </RequirePermission>
            }
          />
          <Route
            path="/operations/generator/reports"
            element={
              <RequirePermission permission={PERMISSIONS.generator.report} fallback={<AccessDeniedNotice />}>
                <GeneratorReportsPage />
              </RequirePermission>
            }
          />
          <Route
            path="/operations/gas-cylinders/purchases"
            element={
              <RequirePermission permission={PERMISSIONS.gasCylinder.view} fallback={<AccessDeniedNotice />}>
                <CylinderPurchaseListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/operations/gas-cylinders/stock"
            element={
              <RequirePermission permission={PERMISSIONS.gasCylinder.view} fallback={<AccessDeniedNotice />}>
                <CylinderStockPage />
              </RequirePermission>
            }
          />
          <Route
            path="/operations/gas-cylinders/consumption"
            element={
              <RequirePermission permission={PERMISSIONS.gasCylinder.report} fallback={<AccessDeniedNotice />}>
                <CylinderConsumptionPage />
              </RequirePermission>
            }
          />
          <Route
            path="/operations/gas-cylinders/supplier-comparison"
            element={
              <RequirePermission permission={PERMISSIONS.gasCylinder.report} fallback={<AccessDeniedNotice />}>
                <SupplierComparisonPage />
              </RequirePermission>
            }
          />
          <Route
            path="/leasing/tenant-registrations"
            element={
              <RequirePermission permission={PERMISSIONS.occupancyRegistration.view} fallback={<AccessDeniedNotice />}>
                <TenantRegistrationListPage />
              </RequirePermission>
            }
          />
          <Route
            path="/leasing/tenant-registrations/new"
            element={
              <RequirePermission permission={PERMISSIONS.occupancyRegistration.create} fallback={<AccessDeniedNotice />}>
                <TenantRegistrationWizardPage />
              </RequirePermission>
            }
          />
          <Route
            path="/leasing/tenant-registrations/:id/edit"
            element={
              <RequirePermission permission={PERMISSIONS.occupancyRegistration.create} fallback={<AccessDeniedNotice />}>
                <TenantRegistrationWizardPage />
              </RequirePermission>
            }
          />
          <Route
            path="/leasing/tenant-registrations/:id"
            element={
              <RequirePermission permission={PERMISSIONS.occupancyRegistration.view} fallback={<AccessDeniedNotice />}>
                <TenantRegistrationDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="/leasing/tenant-registrations/:id/print"
            element={
              <RequirePermission permission={PERMISSIONS.occupancyRegistration.view} fallback={<AccessDeniedNotice />}>
                <TenantRegistrationPrintPage />
              </RequirePermission>
            }
          />
          <Route
            path="/leasing/security-directory"
            element={
              <RequirePermission permission={PERMISSIONS.occupancyRegistration.securityView} fallback={<AccessDeniedNotice />}>
                <SecurityDirectoryPage />
              </RequirePermission>
            }
          />
        </Route>
      </Route>
      <Route path="error/*" element={<ErrorRouting />} />
      <Route element={<ClassicLayout />}>
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <RegisterPage />
            </Suspense>
          }
        />
        <Route
          path="/platform/login"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <PlatformLoginPage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/platform/dashboard"
        element={
          <RequirePlatformAuth>
            <Suspense fallback={<PageSkeleton />}>
              <PlatformDashboardPage />
            </Suspense>
          </RequirePlatformAuth>
        }
      />
      <Route
        path="/platform/organizations/new"
        element={
          <RequirePlatformAuth>
            <Suspense fallback={<PageSkeleton />}>
              <NewOrganizationWizardPage />
            </Suspense>
          </RequirePlatformAuth>
        }
      />
      <Route
        path="/platform/organizations/:id"
        element={
          <RequirePlatformAuth>
            <Suspense fallback={<PageSkeleton />}>
              <PlatformOrganizationDetailPage />
            </Suspense>
          </RequirePlatformAuth>
        }
      />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
}
