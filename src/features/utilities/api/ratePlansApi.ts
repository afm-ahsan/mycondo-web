import {
  useGetApiV1RatePlansQuery,
  usePostApiV1RatePlansByIdDeactivateMutation,
  usePostApiV1RatePlansByIdEndEffectivePeriodMutation,
  usePostApiV1RatePlansMutation,
} from '@/api/generated/mycondoApi';

export const useCreateRatePlan = usePostApiV1RatePlansMutation;
export const useRatePlans = useGetApiV1RatePlansQuery;
export const useDeactivateRatePlan = usePostApiV1RatePlansByIdDeactivateMutation;
export const useEndRatePlanEffectivePeriod = usePostApiV1RatePlansByIdEndEffectivePeriodMutation;
