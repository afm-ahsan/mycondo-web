import {
  useGetApiV1MetersByIdAssignmentHistoryQuery,
  useGetApiV1MetersByIdConsumptionHistoryQuery,
  useGetApiV1MetersQuery,
  usePostApiV1MetersByIdAssignMutation,
  usePostApiV1MetersByIdMarkFaultyMutation,
  usePostApiV1MetersByIdReactivateMutation,
  usePostApiV1MetersByIdReplaceMutation,
  usePostApiV1MetersMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005). Shared across Electricity and Gas —
// the caller passes utilityType, there is no separate hook set per utility.
export const useInstallMeter = usePostApiV1MetersMutation;
export const useMeters = useGetApiV1MetersQuery;
export const useMarkMeterFaulty = usePostApiV1MetersByIdMarkFaultyMutation;
export const useReactivateMeter = usePostApiV1MetersByIdReactivateMutation;
export const useReplaceMeter = usePostApiV1MetersByIdReplaceMutation;
export const useAssignMeter = usePostApiV1MetersByIdAssignMutation;
export const useMeterAssignmentHistory = useGetApiV1MetersByIdAssignmentHistoryQuery;
export const useMeterConsumptionHistory = useGetApiV1MetersByIdConsumptionHistoryQuery;
