import { baseApi } from './baseApi';
import type {
  BookingDto,
  CancelBookingRequest,
  CorrectReadingRequest,
  GenerateInvoiceBatchCommand,
  GenerateInvoiceBatchResultDto,
  InspectBookingRequest,
  InvoiceDto,
  LedgerEntryDto,
  PaymentDto,
  ReadingDto,
  RecordOpeningBalanceCommand,
  RecordPaymentCommand,
  ReversePaymentRequest,
  VoidInvoiceRequest,
} from './generated/mycondoApi';

const IDEMPOTENCY_HEADER = 'X-Idempotency-Key';

/**
 * Hand-authored siblings for the 11 backend endpoints that require `X-Idempotency-Key`
 * (RecordPayment, ReversePayment, GenerateInvoiceBatch, VoidInvoice, RecordOpeningBalance,
 * BillReading, CorrectReading — see ADR/UX-3 plan "Idempotency Design"; plus ConfirmBookingPayment,
 * InspectBooking, CancelBooking, MarkBookingNoShow — added in UX-4 after auditing every
 * Facilities/Operations mutation endpoint for `.RequireIdempotencyKey()` and finding these 4 were the
 * only ones requiring it, none of which the Web was sending — see UX-4 discovery report). `@rtk-query/codegen-openapi`
 * has no per-call mechanism for a header value supplied outside the typed command payload, and these
 * commands must never carry the key as an extra body field (that would corrupt the backend's own
 * request-hash check). Injected into the SAME `baseApi` the generated file itself uses
 * (`baseApi.injectEndpoints`) — this is the same first-class RTK Query extension mechanism codegen
 * uses to attach its own endpoints, not a workaround. Never edit the generated file to add these.
 *
 * Response types are the exact generated DTOs (imported, not redefined). `invalidatesTags` were set
 * by reading each backend command handler's actual transaction — not copied from the generated
 * sibling endpoint's tags, several of which under-invalidate relative to what the handler really
 * touches (e.g. the generated `postApiV1Payments` only invalidates `["Payments"]`, but
 * `RecordPaymentCommandHandler` also mutates outstanding invoices via FIFO allocation and posts a
 * ledger entry — see the per-endpoint comments below for the confirmed effect of each). Pair every
 * one of these with `useIdempotencyKey()` — never invent an ad hoc key per page.
 */
export const idempotentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    recordPaymentIdempotent: build.mutation<
      PaymentDto,
      { recordPaymentCommand: RecordPaymentCommand; idempotencyKey: string }
    >({
      query: ({ recordPaymentCommand, idempotencyKey }) => ({
        url: '/api/v1/payments',
        method: 'POST',
        body: recordPaymentCommand,
        headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
        // Creates a new payment — the HTTP-method fallback (POST → save) already gets this right, but
        // set explicitly since every idempotency-key endpoint below needs it (POST is forced by the
        // header requirement regardless of real intent — see the "update" ones for why that matters).
        operation: 'save',
      }),
      // RecordPaymentCommandHandler FIFO-allocates against outstanding invoices (Invoice.ApplyPayment)
      // and posts a CashOrBank/ResidentReceivable ledger entry in the same transaction — confirmed by
      // reading the handler directly, not assumed. Must invalidate all three, not just Payments.
      invalidatesTags: ['Payments', 'Invoices', 'ResidentAccounts'],
    }),

    reversePaymentIdempotent: build.mutation<
      PaymentDto,
      { id: string; reversePaymentRequest: ReversePaymentRequest; idempotencyKey: string }
    >({
      query: ({ id, reversePaymentRequest, idempotencyKey }) => ({
        url: `/api/v1/payments/${id}/reverse`,
        method: 'POST',
        body: reversePaymentRequest,
        headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
        // Corrects an existing payment — POST here is only the idempotency-key transport requirement,
        // not a create; the HTTP-method fallback would wrongly say "Saving…" for a reversal.
        operation: 'update',
      }),
      // A reversal changes the payment, every invoice its allocations touched, and the resident's
      // ledger/balance — invalidate all three, not just "Payments" (see UX-3 plan guardrail:
      // "Do not assume a single cache tag is enough unless verified in the generated client").
      invalidatesTags: ['Payments', 'Invoices', 'ResidentAccounts'],
    }),

    generateInvoiceBatchIdempotent: build.mutation<
      GenerateInvoiceBatchResultDto,
      { generateInvoiceBatchCommand: GenerateInvoiceBatchCommand; idempotencyKey: string }
    >({
      query: ({ generateInvoiceBatchCommand, idempotencyKey }) => ({
        url: '/api/v1/invoices/generate-batch',
        method: 'POST',
        body: generateInvoiceBatchCommand,
        headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
        operation: 'save', // creates a new batch of invoices
      }),
      // GenerateInvoiceBatchCommandHandler posts a ResidentReceivable/AssociationRevenue ledger entry
      // per generated invoice — confirmed by reading the handler directly. Affects resident balances,
      // not just the Invoices list.
      invalidatesTags: ['Invoices', 'ResidentAccounts'],
    }),

    voidInvoiceIdempotent: build.mutation<
      InvoiceDto,
      { id: string; voidInvoiceRequest: VoidInvoiceRequest; idempotencyKey: string }
    >({
      query: ({ id, voidInvoiceRequest, idempotencyKey }) => ({
        url: `/api/v1/invoices/${id}/void`,
        method: 'POST',
        body: voidInvoiceRequest,
        headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
        operation: 'update', // status transition on an existing invoice, not a create
      }),
      // VoidInvoiceCommandHandler posts a reversing AssociationRevenue/ResidentReceivable ledger
      // posting in the same call (confirmed by reading the handler directly) — affects the resident's
      // balance, not just the invoice's own status.
      invalidatesTags: ['Invoices', 'ResidentAccounts'],
    }),

    recordOpeningBalanceIdempotent: build.mutation<
      LedgerEntryDto[],
      { recordOpeningBalanceCommand: RecordOpeningBalanceCommand; idempotencyKey: string }
    >({
      query: ({ recordOpeningBalanceCommand, idempotencyKey }) => ({
        url: '/api/v1/resident-accounts/opening-balance',
        method: 'POST',
        body: recordOpeningBalanceCommand,
        headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
        operation: 'save', // creates new ledger entries
      }),
      // RecordOpeningBalanceCommandHandler only touches ResidentAccount + ledger (ResidentReceivable/
      // OpeningBalanceEquity) — no Invoice involved, confirmed by reading the handler directly.
      invalidatesTags: ['ResidentAccounts'],
    }),

    billReadingIdempotent: build.mutation<InvoiceDto, { id: string; idempotencyKey: string }>({
      query: ({ id, idempotencyKey }) => ({
        url: `/api/v1/readings/${id}/bill`,
        method: 'POST',
        headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
        operation: 'save', // issues a new invoice from the reading
      }),
      // BillReadingCommandHandler reuses the exact same Invoice-issuance + ResidentReceivable ledger
      // posting as service-charge billing — confirmed by reading the handler directly.
      invalidatesTags: ['Readings', 'Invoices', 'ResidentAccounts'],
    }),

    correctReadingIdempotent: build.mutation<
      ReadingDto,
      { id: string; correctReadingRequest: CorrectReadingRequest; idempotencyKey: string }
    >({
      query: ({ id, correctReadingRequest, idempotencyKey }) => ({
        url: `/api/v1/readings/${id}/correct`,
        method: 'POST',
        body: correctReadingRequest,
        headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
        operation: 'update', // corrects an existing reading
      }),
      // Correcting a reading that was Billed voids its invoice inline via a reversing
      // ResidentReceivable/AssociationRevenue ledger posting (confirmed by reading
      // CorrectReadingCommandHandler directly) — affects the resident's balance too. This is
      // unconditional (not gated on whether the corrected reading was actually Billed) because the
      // response (a fresh Draft ReadingDto) carries no field telling the client whether the original
      // was Billed; invalidating unconditionally is a harmless no-op refetch in the Finalized-only
      // case, never a wrong one — the safe default per "financial correctness over speed".
      invalidatesTags: ['Readings', 'Invoices', 'ResidentAccounts'],
    }),

    confirmBookingPaymentIdempotent: build.mutation<BookingDto, { id: string; idempotencyKey: string }>({
      query: ({ id, idempotencyKey }) => ({
        url: `/api/v1/facility-bookings/${id}/confirm-payment`,
        method: 'POST',
        headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
        operation: 'update', // state transition on an existing booking
      }),
      // ConfirmBookingPaymentCommandHandler bills the booking-charge invoice (ResidentReceivable) and
      // posts the deposit-collection ledger entry in the same transaction — confirmed by reading the
      // handler directly. Affects the resident's invoices/balance, not just the booking record.
      invalidatesTags: ['Facility Bookings', 'Invoices', 'ResidentAccounts'],
    }),

    inspectBookingIdempotent: build.mutation<
      BookingDto,
      { id: string; inspectBookingRequest: InspectBookingRequest; idempotencyKey: string }
    >({
      query: ({ id, inspectBookingRequest, idempotencyKey }) => ({
        url: `/api/v1/facility-bookings/${id}/inspect`,
        method: 'POST',
        body: inspectBookingRequest,
        headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
        operation: 'update', // state transition on an existing booking
      }),
      // InspectBookingCommandHandler settles the held deposit (RefundableDepositsHeld ->
      // CashOrBank/AssociationRevenue) — confirmed by reading the handler directly. None of those
      // account types are ResidentReceivable, so this never affects a resident's own ledger/balance
      // view; only the booking record itself changes.
      invalidatesTags: ['Facility Bookings'],
    }),

    cancelBookingIdempotent: build.mutation<
      BookingDto,
      { id: string; cancelBookingRequest: CancelBookingRequest; idempotencyKey: string }
    >({
      query: ({ id, cancelBookingRequest, idempotencyKey }) => ({
        url: `/api/v1/facility-bookings/${id}/cancel`,
        method: 'POST',
        body: cancelBookingRequest,
        headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
        operation: 'update', // status transition on an existing booking, not a delete
      }),
      // CancelBookingCommandHandler settles the held deposit the same way InspectBooking does
      // (RefundableDepositsHeld -> CashOrBank/AssociationRevenue only) — confirmed by reading the
      // handler directly. No ResidentReceivable line, so no ResidentAccounts effect.
      invalidatesTags: ['Facility Bookings'],
    }),

    markBookingNoShowIdempotent: build.mutation<BookingDto, { id: string; idempotencyKey: string }>({
      query: ({ id, idempotencyKey }) => ({
        url: `/api/v1/facility-bookings/${id}/mark-no-show`,
        method: 'POST',
        headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
        operation: 'update', // state transition on an existing booking
      }),
      // MarkBookingNoShowCommandHandler settles the held deposit identically to Cancel's
      // within-deadline path (RefundableDepositsHeld -> CashOrBank/AssociationRevenue only) —
      // confirmed by reading the handler directly. No ResidentAccounts effect.
      invalidatesTags: ['Facility Bookings'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useRecordPaymentIdempotentMutation,
  useReversePaymentIdempotentMutation,
  useGenerateInvoiceBatchIdempotentMutation,
  useVoidInvoiceIdempotentMutation,
  useRecordOpeningBalanceIdempotentMutation,
  useBillReadingIdempotentMutation,
  useCorrectReadingIdempotentMutation,
  useConfirmBookingPaymentIdempotentMutation,
  useInspectBookingIdempotentMutation,
  useCancelBookingIdempotentMutation,
  useMarkBookingNoShowIdempotentMutation,
} = idempotentApi;
