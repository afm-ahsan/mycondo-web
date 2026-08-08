import {
  useGetApiV1PaymentsByIdQuery,
  useGetApiV1PaymentsQuery,
  useGetApiV1ResidentAccountsByFlatIdBalanceQuery,
  useGetApiV1ResidentAccountsByFlatIdLedgerEntriesQuery,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated read hooks (ADR-005). RecordPayment/ReversePayment
// require X-Idempotency-Key — use useRecordPaymentIdempotentMutation/useReversePaymentIdempotentMutation
// from src/api/idempotentEndpoints.ts instead, never the plain generated mutation hooks.
export const usePayments = useGetApiV1PaymentsQuery;
export const usePaymentDetail = useGetApiV1PaymentsByIdQuery;
export const useAccountBalance = useGetApiV1ResidentAccountsByFlatIdBalanceQuery;
export const useLedgerEntries = useGetApiV1ResidentAccountsByFlatIdLedgerEntriesQuery;
