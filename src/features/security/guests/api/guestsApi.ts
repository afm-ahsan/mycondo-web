import {
  useGetApiV1AccessSessionsCurrentlyInsideQuery,
  useGetApiV1GuestsByIdVisitsQuery,
  useGetApiV1GuestsByPhoneByPhoneQuery,
  useGetApiV1GuestsQuery,
  usePostApiV1AccessSessionsGuestsByIdCheckoutMutation,
  usePostApiV1AccessSessionsGuestsCheckinMutation,
  usePostApiV1GuestsByIdBlockMutation,
  usePostApiV1GuestsByIdUnblockMutation,
  usePostApiV1GuestsMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005).
export const useCreateGuestProfile = usePostApiV1GuestsMutation;
export const useGuests = useGetApiV1GuestsQuery;
export const useGuestByPhone = useGetApiV1GuestsByPhoneByPhoneQuery;
export const useBlockGuest = usePostApiV1GuestsByIdBlockMutation;
export const useUnblockGuest = usePostApiV1GuestsByIdUnblockMutation;
export const useGuestVisits = useGetApiV1GuestsByIdVisitsQuery;
export const useCheckInGuest = usePostApiV1AccessSessionsGuestsCheckinMutation;
export const useCheckOutGuest = usePostApiV1AccessSessionsGuestsByIdCheckoutMutation;
export const useCurrentlyInsideAccessSessions = useGetApiV1AccessSessionsCurrentlyInsideQuery;
