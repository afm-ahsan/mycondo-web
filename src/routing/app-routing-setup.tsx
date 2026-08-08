import { ClassicLayout } from '@/auth/layouts/classic';
import {
  BookingCalendarPage,
  BookingDetailsPage,
  BookingFormPage,
  BookingListPage,
  BookingRevenueReportPage,
  CurrentOccupancyPage,
  FacilitySettingsPage,
  FacilityUtilizationReportPage,
  PoolAccessPage,
  PoolDailyUsageReportPage,
  UsageHistoryPage,
} from '@/features/amenities';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import {
  BatchBillingPage,
  InvoiceDetailPage,
  InvoiceListPage,
  OutstandingInvoicesPage,
  ServiceChargeRuleDirectoryPage,
  ServiceChargeRuleFormPage,
} from '@/features/billing';
import {
  FinancialSummaryReportPage,
  PaymentDetailPage,
  PaymentListPage,
  ReceivablesAgeingReportPage,
  RecordPaymentPage,
  ResidentLedgerPage,
} from '@/features/payments';
import {
  ConsumptionHistoryReportPage,
  ConsumptionSummaryReportPage,
  MeterDirectoryPage,
  RatePlanDirectoryPage,
  RatePlanFormPage,
  ReadingCapturePage,
  ReadingDetailPage,
  ReadingRegisterPage,
  ReadingStatusReportPage,
} from '@/features/utilities';
import { RolePermissionMatrixPage, UsersPage } from '@/features/identity';
import {
  SecurityDirectoryPage,
  TenantRegistrationDetailPage,
  TenantRegistrationListPage,
  TenantRegistrationPrintPage,
  TenantRegistrationWizardPage,
} from '@/features/leasing';
import {
  CylinderConsumptionPage,
  CylinderPurchaseListPage,
  CylinderStockPage,
  GeneratorFuelLogPage,
  GeneratorLogPage,
  GeneratorMaintenancePage,
  GeneratorReportsPage,
  SupplierComparisonPage,
} from '@/features/operations';
import {
  AttendanceRegisterPage,
  CurrentlyPresentStaffPage,
  StaffMemberFormPage,
  StaffRosterPage,
} from '@/features/payroll';
import {
  CurrentlyInsideDomesticWorkersPage,
  CurrentlyInsideGuestsPage,
  CurrentlyInsideServiceProvidersPage,
  CurrentlyInsideVehiclesPage,
  DomesticWorkerCheckInOutPage,
  DomesticWorkerDirectoryPage,
  DomesticWorkerFormPage,
  GuestCheckInOutPage,
  GuestDirectoryPage,
  GuestProfileFormPage,
  ParcelDetailPage,
  ParcelRegisterPage,
  ReceiveParcelPage,
  ServiceProviderCheckInOutPage,
  ServiceProviderDirectoryPage,
  ServiceProviderFormPage,
  VehicleCheckInOutPage,
  VehicleDirectoryPage,
  VehicleFormPage,
} from '@/features/security';
import { CreateTenantPage } from '@/features/tenancy';
import { DashboardPage } from '@/features/dashboard';
import { AccessDeniedNotice } from '@/components/shared/AccessDeniedNotice';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { ErrorRouting } from '@/errors/error-routing';
import { Demo1Layout } from '@/layouts/demo1/layout';
import {
  AccountActivityPage,
  AccountAllowedIPAddressesPage,
  AccountApiKeysPage,
  AccountAppearancePage,
  AccountBackupAndRecoveryPage,
  AccountBasicPage,
  AccountCompanyProfilePage,
  AccountCurrentSessionsPage,
  AccountDeviceManagementPage,
  AccountEnterprisePage,
  AccountGetStartedPage,
  AccountHistoryPage,
  AccountImportMembersPage,
  AccountIntegrationsPage,
  AccountInviteAFriendPage,
  AccountMembersStarterPage,
  AccountNotificationsPage,
  AccountOverviewPage,
  AccountPermissionsCheckPage,
  AccountPermissionsTogglePage,
  AccountPlansPage,
  AccountPrivacySettingsPage,
  AccountRolesPage,
  AccountSecurityGetStartedPage,
  AccountSecurityLogPage,
  AccountSettingsEnterprisePage,
  AccountSettingsModalPage,
  AccountSettingsPlainPage,
  AccountSettingsSidebarPage,
  AccountTeamInfoPage,
  AccountTeamMembersPage,
  AccountTeamsPage,
  AccountTeamsStarterPage,
  AccountUserProfilePage,
} from '@/pages/account';
import {
  AuthAccountDeactivatedPage,
  AuthWelcomeMessagePage,
} from '@/pages/auth';
import { Demo1DarkSidebarPage } from '@/pages/dashboards';
import {
  NetworkAppRosterPage,
  NetworkAuthorPage,
  NetworkGetStartedPage,
  NetworkMarketAuthorsPage,
  NetworkMiniCardsPage,
  NetworkNFTPage,
  NetworkSaasUsersPage,
  NetworkSocialPage,
  NetworkStoreClientsPage,
  NetworkUserCardsTeamCrewPage,
  NetworkUserTableTeamCrewPage,
  NetworkVisitorsPage,
} from '@/pages/network';
import {
  CampaignsCardPage,
  CampaignsListPage,
  ProfileActivityPage,
  ProfileBloggerPage,
  ProfileCompanyPage,
  ProfileCreatorPage,
  ProfileCRMPage,
  ProfileDefaultPage,
  ProfileEmptyPage,
  ProfileFeedsPage,
  ProfileGamerPage,
  ProfileModalPage,
  ProfileNetworkPage,
  ProfileNFTPage,
  ProfilePlainPage,
  ProfileTeamsPage,
  ProfileWorksPage,
  ProjectColumn2Page,
  ProjectColumn3Page,
} from '@/pages/public-profile';
import { AllProductsPage, DashboardPage } from '@/pages/store-admin';
import {
  MyOrdersPage,
  OrderPlacedPage,
  OrderReceiptPage,
  OrderSummaryPage,
  PaymentMethodPage,
  ProductDetailsPage,
  SearchResultsGridPage,
  SearchResultsListPage,
  ShippingInfoPage,
  StoreClientPage,
  WishlistPage,
} from '@/pages/store-client';
import { Navigate, Outlet, Route, Routes } from 'react-router';

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route element={<RequireAuth><Outlet /></RequireAuth>}>
        <Route element={<Demo1Layout />}>
          <Route path="/" element={<DashboardPage />} />
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
            path="/network/get-started"
            element={<NetworkGetStartedPage />}
          />
          <Route
            path="/network/user-cards/mini-cards"
            element={<NetworkMiniCardsPage />}
          />
          <Route
            path="/network/user-cards/team-crew"
            element={<NetworkUserCardsTeamCrewPage />}
          />
          <Route
            path="/network/user-cards/author"
            element={<NetworkAuthorPage />}
          />
          <Route path="/network/user-cards/nft" element={<NetworkNFTPage />} />
          <Route
            path="/network/user-cards/social"
            element={<NetworkSocialPage />}
          />
          <Route
            path="/network/user-table/team-crew"
            element={<NetworkUserTableTeamCrewPage />}
          />
          <Route
            path="/network/user-table/app-roster"
            element={<NetworkAppRosterPage />}
          />
          <Route
            path="/network/user-table/market-authors"
            element={<NetworkMarketAuthorsPage />}
          />
          <Route
            path="/network/user-table/saas-users"
            element={<NetworkSaasUsersPage />}
          />
          <Route
            path="/network/user-table/store-clients"
            element={<NetworkStoreClientsPage />}
          />
          <Route
            path="/network/user-table/visitors"
            element={<NetworkVisitorsPage />}
          />
          <Route
            path="/auth/welcome-message"
            element={<AuthWelcomeMessagePage />}
          />
          <Route
            path="/auth/account-deactivated"
            element={<AuthAccountDeactivatedPage />}
          />
          <Route path="/store-client/home" element={<StoreClientPage />} />
          <Route
            path="/store-client/search-results-grid"
            element={<SearchResultsGridPage />}
          />
          <Route
            path="/store-client/search-results-list"
            element={<SearchResultsListPage />}
          />
          <Route
            path="/store-client/product-details"
            element={<ProductDetailsPage />}
          />
          <Route path="/store-client/wishlist" element={<WishlistPage />} />
          <Route
            path="/store-client/checkout/order-summary"
            element={<OrderSummaryPage />}
          />
          <Route
            path="/store-client/checkout/shipping-info"
            element={<ShippingInfoPage />}
          />
          <Route
            path="/store-client/checkout/payment-method"
            element={<PaymentMethodPage />}
          />
          <Route
            path="/store-client/checkout/order-placed"
            element={<OrderPlacedPage />}
          />
          <Route path="/store-client/my-orders" element={<MyOrdersPage />} />
          <Route
            path="/store-client/order-receipt"
            element={<OrderReceiptPage />}
          />
          <Route path="/store-admin/dashboard" element={<DashboardPage />} />
          <Route
            path="/store-admin/inventory/all-products"
            element={<AllProductsPage />}
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
            path="/admin/roles"
            element={
              <RequirePermission permission="role.view" fallback={<AccessDeniedNotice />}>
                <RolePermissionMatrixPage />
              </RequirePermission>
            }
          />
          <Route
            path="/admin/tenants/new"
            element={
              <RequirePermission permission="tenant.manage" fallback={<AccessDeniedNotice />}>
                <CreateTenantPage />
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
}
