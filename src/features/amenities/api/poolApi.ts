import {
  useGetApiV1SwimmingPoolIncidentsQuery,
  useGetApiV1SwimmingPoolSessionsByIdQuery,
  useGetApiV1SwimmingPoolSessionsQuery,
  usePostApiV1SwimmingPoolIncidentsMutation,
  usePostApiV1SwimmingPoolSessionsByIdCheckOutMutation,
  usePostApiV1SwimmingPoolSessionsMutation,
} from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005) — see guestsApi.ts for the pattern.
export const usePoolSessions = useGetApiV1SwimmingPoolSessionsQuery;
export const usePoolSession = useGetApiV1SwimmingPoolSessionsByIdQuery;
export const useCheckInPoolSession = usePostApiV1SwimmingPoolSessionsMutation;
export const useCheckOutPoolSession = usePostApiV1SwimmingPoolSessionsByIdCheckOutMutation;
export const usePoolIncidents = useGetApiV1SwimmingPoolIncidentsQuery;
export const useReportPoolIncident = usePostApiV1SwimmingPoolIncidentsMutation;
