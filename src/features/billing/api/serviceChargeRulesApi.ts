import {
  useGetApiV1ServiceChargeRulesFlatsMissingAreaQuery,
  useGetApiV1ServiceChargeRulesQuery,
  usePostApiV1ServiceChargeRulesByIdDeactivateMutation,
  usePostApiV1ServiceChargeRulesByIdEndEffectivePeriodMutation,
  usePostApiV1ServiceChargeRulesMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005), mirroring the pattern used
// throughout UX-2 (e.g. parcelsApi.ts).
export const useCreateServiceChargeRule = usePostApiV1ServiceChargeRulesMutation;
export const useServiceChargeRules = useGetApiV1ServiceChargeRulesQuery;
export const useFlatsMissingArea = useGetApiV1ServiceChargeRulesFlatsMissingAreaQuery;
export const useDeactivateServiceChargeRule = usePostApiV1ServiceChargeRulesByIdDeactivateMutation;
export const useEndServiceChargeRuleEffectivePeriod = usePostApiV1ServiceChargeRulesByIdEndEffectivePeriodMutation;
