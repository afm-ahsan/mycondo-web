import {
  useGetApiV1ReportsFinanceAccountLedgerByChartOfAccountIdQuery,
  useGetApiV1ReportsFinanceCashBankPositionQuery,
  useGetApiV1ReportsFinanceCashFlowQuery,
  useGetApiV1ReportsFinanceExpenseByCategoryQuery,
  useGetApiV1ReportsFinanceExpenseByTypeQuery,
  useGetApiV1ReportsFinanceExpenseSummaryQuery,
  useGetApiV1ReportsFinanceExpenseTrendQuery,
  useGetApiV1ReportsFinanceFinancialPositionQuery,
  useGetApiV1ReportsFinanceFinesQuery,
  useGetApiV1ReportsFinanceFixedDepositInterestQuery,
  useGetApiV1ReportsFinanceFixedDepositPortfolioQuery,
  useGetApiV1ReportsFinanceFlatStatementByFlatIdQuery,
  useGetApiV1ReportsFinanceFundPositionQuery,
  useGetApiV1ReportsFinanceGasCollectionQuery,
  useGetApiV1ReportsFinanceGeneralLedgerQuery,
  useGetApiV1ReportsFinanceIncomeExpenseQuery,
  useGetApiV1ReportsFinanceOutstandingDuesQuery,
  useGetApiV1ReportsFinanceOverviewQuery,
  useGetApiV1ReportsFinanceResidentStatementByFlatIdQuery,
  useGetApiV1ReportsFinanceServiceChargeCollectionQuery,
  useGetApiV1ReportsFinanceTrialBalanceQuery,
} from '@/api/generated/mycondoApi';

/**
 * Thin re-exports of the generated Template 5 Finance report hooks (same pattern as
 * `payments/api/reportsApi.ts`) — one stable import surface for every `finance/pages/*` report
 * page, so a future OpenAPI regen only needs updating here if a hook name changes.
 */

// Accounting group
export const useTrialBalanceReport = useGetApiV1ReportsFinanceTrialBalanceQuery;
export const useGeneralLedgerReport = useGetApiV1ReportsFinanceGeneralLedgerQuery;
export const useAccountLedgerReport = useGetApiV1ReportsFinanceAccountLedgerByChartOfAccountIdQuery;
export const useFundPositionReport = useGetApiV1ReportsFinanceFundPositionQuery;
export const useFinancialPositionReport = useGetApiV1ReportsFinanceFinancialPositionQuery;
export const useCashFlowReport = useGetApiV1ReportsFinanceCashFlowQuery;

// Core / Management group
export const useFinancialOverviewReport = useGetApiV1ReportsFinanceOverviewQuery;
export const useIncomeExpenseReport = useGetApiV1ReportsFinanceIncomeExpenseQuery;
export const useCashBankPositionReport = useGetApiV1ReportsFinanceCashBankPositionQuery;
export const useServiceChargeCollectionReport = useGetApiV1ReportsFinanceServiceChargeCollectionQuery;
export const useGasCollectionReport = useGetApiV1ReportsFinanceGasCollectionQuery;
export const useFineReport = useGetApiV1ReportsFinanceFinesQuery;
export const useOutstandingDuesReport = useGetApiV1ReportsFinanceOutstandingDuesQuery;
export const useResidentFinancialStatementReport = useGetApiV1ReportsFinanceResidentStatementByFlatIdQuery;
export const useFlatFinancialStatementReport = useGetApiV1ReportsFinanceFlatStatementByFlatIdQuery;
export const useExpenseSummaryReport = useGetApiV1ReportsFinanceExpenseSummaryQuery;
export const useExpenseByCategoryReport = useGetApiV1ReportsFinanceExpenseByCategoryQuery;
export const useExpenseByTypeReport = useGetApiV1ReportsFinanceExpenseByTypeQuery;
export const useExpenseTrendReport = useGetApiV1ReportsFinanceExpenseTrendQuery;
export const useFixedDepositPortfolioReport = useGetApiV1ReportsFinanceFixedDepositPortfolioQuery;
export const useFixedDepositInterestReport = useGetApiV1ReportsFinanceFixedDepositInterestQuery;
