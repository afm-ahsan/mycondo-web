import { useGetApiV1InvoicesByIdQuery, useGetApiV1InvoicesQuery } from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated read hooks (ADR-005). Void/GenerateBatch require
// X-Idempotency-Key — use useVoidInvoiceIdempotentMutation/useGenerateInvoiceBatchIdempotentMutation
// from src/api/idempotentEndpoints.ts instead, never the plain generated mutation hooks.
export const useInvoices = useGetApiV1InvoicesQuery;
export const useInvoiceDetail = useGetApiV1InvoicesByIdQuery;
