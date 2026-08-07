import {
  useGetApiV1GeneratorsByIdQuery,
  useGetApiV1GeneratorSessionsOpenQuery,
  useGetApiV1GeneratorSessionsQuery,
  useGetApiV1GeneratorsQuery,
  usePostApiV1GeneratorSessionsByIdStopMutation,
  usePostApiV1GeneratorSessionsMutation,
  usePostApiV1GeneratorsByIdDeactivateMutation,
  usePostApiV1GeneratorsByIdReactivateMutation,
  usePostApiV1GeneratorsMutation,
  usePutApiV1GeneratorsByIdMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005) — see amenities/api/facilitiesApi.ts.
export const useGenerators = useGetApiV1GeneratorsQuery;
export const useGenerator = useGetApiV1GeneratorsByIdQuery;
export const useCreateGenerator = usePostApiV1GeneratorsMutation;
export const useUpdateGenerator = usePutApiV1GeneratorsByIdMutation;
export const useDeactivateGenerator = usePostApiV1GeneratorsByIdDeactivateMutation;
export const useReactivateGenerator = usePostApiV1GeneratorsByIdReactivateMutation;

export const useGeneratorSessions = useGetApiV1GeneratorSessionsQuery;
export const useOpenGeneratorSession = useGetApiV1GeneratorSessionsOpenQuery;
export const useStartGeneratorSession = usePostApiV1GeneratorSessionsMutation;
export const useStopGeneratorSession = usePostApiV1GeneratorSessionsByIdStopMutation;
