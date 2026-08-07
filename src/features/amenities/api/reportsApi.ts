import {
  useGetApiV1ReportsFacilitiesBookingRevenueQuery,
  useGetApiV1ReportsFacilitiesPoolDailyUsageQuery,
  useGetApiV1ReportsFacilitiesUtilizationQuery,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005) — see guestsApi.ts for the pattern.
export const useFacilityUtilizationReport = useGetApiV1ReportsFacilitiesUtilizationQuery;
export const useBookingRevenueReport = useGetApiV1ReportsFacilitiesBookingRevenueQuery;
export const usePoolDailyUsageReport = useGetApiV1ReportsFacilitiesPoolDailyUsageQuery;
