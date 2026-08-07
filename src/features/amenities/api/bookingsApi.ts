import {
  useGetApiV1FacilityBookingsByIdQuery,
  useGetApiV1FacilityBookingsQuery,
  useGetApiV1FacilityBookingsUpcomingQuery,
  usePostApiV1FacilityBookingsByIdApproveMutation,
  usePostApiV1FacilityBookingsByIdCancelMutation,
  usePostApiV1FacilityBookingsByIdCheckInMutation,
  usePostApiV1FacilityBookingsByIdCompleteMutation,
  usePostApiV1FacilityBookingsByIdConfirmPaymentMutation,
  usePostApiV1FacilityBookingsByIdInspectMutation,
  usePostApiV1FacilityBookingsByIdMarkNoShowMutation,
  usePostApiV1FacilityBookingsByIdRejectMutation,
  usePostApiV1FacilityBookingsByIdSubmitMutation,
  usePostApiV1FacilityBookingsMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005) — see guestsApi.ts for the pattern.
export const useBookings = useGetApiV1FacilityBookingsQuery;
export const useBooking = useGetApiV1FacilityBookingsByIdQuery;
export const useUpcomingBookings = useGetApiV1FacilityBookingsUpcomingQuery;
export const useRequestBooking = usePostApiV1FacilityBookingsMutation;
export const useSubmitBooking = usePostApiV1FacilityBookingsByIdSubmitMutation;
export const useApproveBooking = usePostApiV1FacilityBookingsByIdApproveMutation;
export const useRejectBooking = usePostApiV1FacilityBookingsByIdRejectMutation;
export const useConfirmBookingPayment = usePostApiV1FacilityBookingsByIdConfirmPaymentMutation;
export const useCheckInBooking = usePostApiV1FacilityBookingsByIdCheckInMutation;
export const useCompleteBooking = usePostApiV1FacilityBookingsByIdCompleteMutation;
export const useInspectBooking = usePostApiV1FacilityBookingsByIdInspectMutation;
export const useCancelBooking = usePostApiV1FacilityBookingsByIdCancelMutation;
export const useMarkBookingNoShow = usePostApiV1FacilityBookingsByIdMarkNoShowMutation;
