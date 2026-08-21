import {
  useGetApiV1FinanceAccountingPeriodsQuery,
  usePostApiV1FinanceAccountingPeriodsMutation,
  usePostApiV1FinanceAccountingPeriodsByIdSoftCloseMutation,
  usePostApiV1FinanceAccountingPeriodsByIdCloseMutation,
  usePostApiV1FinanceAccountingPeriodsByIdReopenMutation,
  useGetApiV1FinanceFinancialYearsQuery,
  useGetApiV1FinanceAuditLogQuery,
  useGetApiV1FinanceIntegrityDashboardQuery,
  useGetApiV1FinanceFinancialAccountsQuery,
  useGetApiV1FinanceBankReconciliationsQuery,
  usePostApiV1FinanceBankReconciliationsMutation,
  useGetApiV1FinanceBankReconciliationsByIdQuery,
  usePostApiV1FinanceBankReconciliationsByIdCompleteMutation,
  usePostApiV1FinanceBankStatementLinesMutation,
  usePostApiV1FinanceBankStatementLinesByIdMatchMutation,
  usePostApiV1FinanceBankStatementLinesByIdExcludeMutation,
  usePostApiV1FinanceBankStatementLinesByIdAdjustMutation,
} from '@/api/generated/mycondoApi';

/**
 * Thin re-exports of the generated Template 6 (Governance, Reconciliation & Production Readiness)
 * Finance hooks — same "one stable import surface" pattern as `reportsApi.ts`, so a future OpenAPI
 * regen only needs updating here if a hook name changes.
 */

// Accounting Period governance
export const useAccountingPeriods = useGetApiV1FinanceAccountingPeriodsQuery;
export const useCreateAccountingPeriod = usePostApiV1FinanceAccountingPeriodsMutation;
export const useSoftCloseAccountingPeriod = usePostApiV1FinanceAccountingPeriodsByIdSoftCloseMutation;
export const useCloseAccountingPeriod = usePostApiV1FinanceAccountingPeriodsByIdCloseMutation;
export const useReopenAccountingPeriod = usePostApiV1FinanceAccountingPeriodsByIdReopenMutation;
export const useFinancialYears = useGetApiV1FinanceFinancialYearsQuery;

// Finance audit log
export const useFinanceAuditLog = useGetApiV1FinanceAuditLogQuery;

// Financial Integrity Dashboard
export const useFinancialIntegrityDashboard = useGetApiV1FinanceIntegrityDashboardQuery;

// Bank Reconciliation
export const useFinancialAccountsForReconciliation = useGetApiV1FinanceFinancialAccountsQuery;
export const useBankReconciliations = useGetApiV1FinanceBankReconciliationsQuery;
export const useStartBankReconciliation = usePostApiV1FinanceBankReconciliationsMutation;
export const useBankReconciliation = useGetApiV1FinanceBankReconciliationsByIdQuery;
export const useCompleteBankReconciliation = usePostApiV1FinanceBankReconciliationsByIdCompleteMutation;
export const useAddBankStatementLine = usePostApiV1FinanceBankStatementLinesMutation;
export const useMatchStatementLine = usePostApiV1FinanceBankStatementLinesByIdMatchMutation;
export const useExcludeStatementLine = usePostApiV1FinanceBankStatementLinesByIdExcludeMutation;
export const useAddReconciliationAdjustment = usePostApiV1FinanceBankStatementLinesByIdAdjustMutation;
