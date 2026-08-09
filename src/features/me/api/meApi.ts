import {
  useGetApiV1MeFlatsQuery,
  useGetApiV1MeInvoicesQuery,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005). Backed by mycondo-api's
// GET /api/v1/me/flats and GET /api/v1/me/invoices (Phase 3, mycondo-docs ADR-021) — self-service,
// relationship-scoped views derived entirely from the caller's own JWT identity. Neither endpoint
// accepts request parameters (no flatId/buildingId filter — the backend decides which flats/invoices
// are the caller's own), so there is nothing to thread through as query args here.
export const useMyFlats = useGetApiV1MeFlatsQuery;
export const useMyInvoices = useGetApiV1MeInvoicesQuery;
