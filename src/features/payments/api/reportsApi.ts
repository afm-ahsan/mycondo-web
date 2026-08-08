import {
  useGetApiV1ReportsFinancialReceivablesAgeingQuery,
  useGetApiV1ReportsFinancialSummaryQuery,
} from '@/api/generated/mycondoApi';

export const useFinancialSummaryReport = useGetApiV1ReportsFinancialSummaryQuery;
export const useReceivablesAgeingReport = useGetApiV1ReportsFinancialReceivablesAgeingQuery;
