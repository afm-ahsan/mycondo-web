import {
  useGetApiV1FacilitiesByIdBlackoutDatesQuery,
  useGetApiV1FacilitiesByIdQuery,
  useGetApiV1FacilitiesQuery,
  usePostApiV1FacilitiesBlackoutDatesByBlackoutDateIdDeactivateMutation,
  usePostApiV1FacilitiesByIdBlackoutDatesMutation,
  usePostApiV1FacilitiesByIdDeactivateMutation,
  usePostApiV1FacilitiesByIdReactivateMutation,
  usePostApiV1FacilitiesMutation,
  usePutApiV1FacilitiesByIdMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005) — see guestsApi.ts for the pattern.
export const useFacilities = useGetApiV1FacilitiesQuery;
export const useFacility = useGetApiV1FacilitiesByIdQuery;
export const useCreateFacility = usePostApiV1FacilitiesMutation;
export const useUpdateFacilityConfiguration = usePutApiV1FacilitiesByIdMutation;
export const useDeactivateFacility = usePostApiV1FacilitiesByIdDeactivateMutation;
export const useReactivateFacility = usePostApiV1FacilitiesByIdReactivateMutation;
export const useBlackoutDates = useGetApiV1FacilitiesByIdBlackoutDatesQuery;
export const useCreateBlackoutDate = usePostApiV1FacilitiesByIdBlackoutDatesMutation;
export const useDeactivateBlackoutDate = usePostApiV1FacilitiesBlackoutDatesByBlackoutDateIdDeactivateMutation;
