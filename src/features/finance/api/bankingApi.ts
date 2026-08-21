import {
  useGetApiV1FinanceFinancialAccountsQuery,
  usePostApiV1FinanceFinancialAccountsMutation,
  usePutApiV1FinanceFinancialAccountsByIdMutation,
  usePostApiV1FinanceFinancialAccountsByIdActivateMutation,
  usePostApiV1FinanceFinancialAccountsByIdDeactivateMutation,
  useGetApiV1FinanceFixedDepositsQuery,
  usePostApiV1FinanceFixedDepositsMutation,
  useGetApiV1FinanceFixedDepositsByIdQuery,
  usePostApiV1FinanceFixedDepositsByIdRenewMutation,
  usePostApiV1FinanceFixedDepositsByIdWithdrawMutation,
  usePostApiV1FinanceFixedDepositsByIdVoidMutation,
  usePostApiV1FinanceFixedDepositsByIdInterestAccrualsMutation,
  usePostApiV1FinanceFixedDepositsByIdInterestReceiptsMutation,
  useGetApiV1FinanceFundsQuery,
} from '@/api/generated/mycondoApi';

/**
 * Thin re-exports of the generated Template 4 (Banking, Fixed Deposits & Interest) Finance hooks —
 * same "one stable import surface" pattern as governanceApi.ts/reportsApi.ts, so a future OpenAPI
 * regen only needs updating here if a hook name changes.
 */

// Financial Accounts
export const useFinancialAccounts = useGetApiV1FinanceFinancialAccountsQuery;
export const useCreateFinancialAccount = usePostApiV1FinanceFinancialAccountsMutation;
export const useUpdateFinancialAccount = usePutApiV1FinanceFinancialAccountsByIdMutation;
export const useActivateFinancialAccount = usePostApiV1FinanceFinancialAccountsByIdActivateMutation;
export const useDeactivateFinancialAccount = usePostApiV1FinanceFinancialAccountsByIdDeactivateMutation;

// Fixed Deposits
export const useFixedDeposits = useGetApiV1FinanceFixedDepositsQuery;
export const usePlaceFixedDeposit = usePostApiV1FinanceFixedDepositsMutation;
export const useFixedDeposit = useGetApiV1FinanceFixedDepositsByIdQuery;
export const useRenewFixedDeposit = usePostApiV1FinanceFixedDepositsByIdRenewMutation;
export const useWithdrawFixedDeposit = usePostApiV1FinanceFixedDepositsByIdWithdrawMutation;
export const useVoidFixedDeposit = usePostApiV1FinanceFixedDepositsByIdVoidMutation;
export const useRecordFixedDepositInterestAccrual = usePostApiV1FinanceFixedDepositsByIdInterestAccrualsMutation;
export const useRecordFixedDepositInterestReceipt = usePostApiV1FinanceFixedDepositsByIdInterestReceiptsMutation;

// Funds — shared reference data for the account/placement forms below.
export const useFundsForBanking = useGetApiV1FinanceFundsQuery;
