import {
  useGetApiV1ReadingsByIdQuery,
  useGetApiV1ReadingsQuery,
  usePostApiV1ReadingsByIdFinalizeMutation,
  usePostApiV1ReadingsByIdReviewMutation,
  usePostApiV1ReadingsMutation,
} from '@/api/generated/mycondoApi';

// Finalize/Bill/Correct require X-Idempotency-Key — use useBillReadingIdempotentMutation /
// useCorrectReadingIdempotentMutation from src/api/idempotentEndpoints.ts. Finalize itself does NOT
// require idempotency (only Bill and Correct do, per the backend's own endpoint filters) but IS a
// high-consequence, non-reversible-without-Correct state transition — gated behind its own confirm
// dialog regardless.
export const useRecordReading = usePostApiV1ReadingsMutation;
export const useReadings = useGetApiV1ReadingsQuery;
export const useReadingDetail = useGetApiV1ReadingsByIdQuery;
export const useReviewReading = usePostApiV1ReadingsByIdReviewMutation;
export const useFinalizeReading = usePostApiV1ReadingsByIdFinalizeMutation;
