import { platformBaseApi } from '@/api/platformBaseApi';
import type {
  OrganizationDetailDto,
  OrganizationSummaryStatsDto,
  PagedResultOfOrganizationListItemDto,
  ProvisionOrganizationResult,
  ProvisionOrganizationWithAdminCommand,
  ReplaceOrganizationModulesRequest,
  UpdateOrganizationRequest,
} from '@/api/generated/mycondoApi';

// Hand-rolled for the same reason platformAuthApi.ts's endpoints are — see its doc comment. The
// generated hooks for these routes exist but must not be used: they'd route through baseApi's
// tenant token/refresh pipeline instead of platformBaseApi's.
export type {
  OrganizationDetailDto,
  OrganizationSummaryStatsDto,
  PagedResultOfOrganizationListItemDto,
  ProvisionOrganizationResult,
  ProvisionOrganizationWithAdminCommand,
};

export interface ListOrganizationsParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
}

const injectedPlatformOrganizationsApi = platformBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    listOrganizations: builder.query<PagedResultOfOrganizationListItemDto, ListOrganizationsParams>({
      query: ({ page, pageSize, search, status }) => ({
        url: '/api/v1/platform/organizations',
        method: 'GET',
        params: { page, pageSize, search, status },
      }),
      providesTags: ['Organizations'],
    }),
    getOrganizationSummaryStats: builder.query<OrganizationSummaryStatsDto, void>({
      query: () => ({ url: '/api/v1/platform/organizations/stats', method: 'GET' }),
      providesTags: ['Organizations'],
    }),
    getOrganizationById: builder.query<OrganizationDetailDto, string>({
      query: (id) => ({ url: `/api/v1/platform/organizations/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'Organization', id }],
    }),
    createOrganization: builder.mutation<ProvisionOrganizationResult, ProvisionOrganizationWithAdminCommand>({
      query: (body) => ({ url: '/api/v1/platform/organizations', method: 'POST', body }),
      invalidatesTags: ['Organizations'],
    }),
    updateOrganization: builder.mutation<void, { id: string; body: UpdateOrganizationRequest }>({
      query: ({ id, body }) => ({ url: `/api/v1/platform/organizations/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => ['Organizations', { type: 'Organization', id }],
    }),
    suspendOrganization: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/platform/organizations/${id}/suspend`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => ['Organizations', { type: 'Organization', id }],
    }),
    activateOrganization: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/platform/organizations/${id}/activate`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => ['Organizations', { type: 'Organization', id }],
    }),
    reactivateOrganization: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/platform/organizations/${id}/reactivate`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => ['Organizations', { type: 'Organization', id }],
    }),
    replaceOrganizationModules: builder.mutation<void, { id: string; body: ReplaceOrganizationModulesRequest }>({
      query: ({ id, body }) => ({ url: `/api/v1/platform/organizations/${id}/modules`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => ['Organizations', { type: 'Organization', id }],
    }),
  }),
});

export const {
  useListOrganizationsQuery,
  useGetOrganizationSummaryStatsQuery,
  useGetOrganizationByIdQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useSuspendOrganizationMutation,
  useActivateOrganizationMutation,
  useReactivateOrganizationMutation,
  useReplaceOrganizationModulesMutation,
} = injectedPlatformOrganizationsApi;
