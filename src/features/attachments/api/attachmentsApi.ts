import {
  mycondoApi,
  useDeleteApiV1AttachmentsByAttachmentIdMutation,
  useGetApiV1AttachmentsQuery,
} from '@/api/generated/mycondoApi';
import type { AttachmentDto } from '@/api/generated/mycondoApi';

// Friendlier re-exports of the OpenAPI-generated hooks (ADR-005, same pattern as authApi.ts).
export const useAttachmentsForOwner = useGetApiV1AttachmentsQuery;
export const useDeleteAttachment = useDeleteApiV1AttachmentsByAttachmentIdMutation;

interface UploadAttachmentArgs {
  file: File;
  ownerType: string;
  ownerId: string;
}

/**
 * Hand-authored: the generated `postApiV1Attachments` operation types its body as a plain
 * `{ file, ownerType, ownerId }` object, which fetchBaseQuery would JSON-serialize — never actually
 * sending multipart/form-data (same issue/fix as `authApi.ts`'s `uploadMyAvatar`). Injected into
 * `mycondoApi` itself so `invalidatesTags: ['Attachments']` type-checks and actually triggers the
 * owning list query's refetch. Never edit the generated file to fix this — regenerating reverts it.
 */
// Module-scoped, keyed by attachmentId: RTK Query gives each attachmentId its own cache entry, so
// each needs its own tracked object URL (see getMyAvatarBlob's single-entry variant in authApi.ts for
// the same pattern applied to a no-args query).
const attachmentObjectUrls = new Map<string, string>();

const attachmentsApi = mycondoApi.injectEndpoints({
  endpoints: (build) => ({
    uploadAttachment: build.mutation<AttachmentDto, UploadAttachmentArgs>({
      query: ({ file, ownerType, ownerId }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('ownerType', ownerType);
        formData.append('ownerId', ownerId);
        return { url: '/api/v1/attachments', method: 'POST', body: formData };
      },
      invalidatesTags: ['Attachments'],
    }),
    // Attachments are served from an authenticated endpoint, never a public/static path — an
    // <img src> can't attach a bearer token, so this fetches the bytes as a blob and immediately
    // converts to an object URL in transformResponse, so only a plain string ever reaches Redux (a
    // Blob fails RTK's isPlainObject serializableCheck). onCacheEntryAdded revokes it once this
    // attachmentId's cache entry is dropped after the last subscriber unmounts; transformResponse
    // revokes the previous URL too, covering the invalidatesTags-driven refetch after re-upload.
    getAttachmentContentBlob: build.query<string, string>({
      query: (attachmentId) => ({
        url: `/api/v1/attachments/${attachmentId}/content`,
        responseHandler: (response: Response) => response.blob(),
      }),
      transformResponse: (blob: Blob, _meta, attachmentId) => {
        const previousUrl = attachmentObjectUrls.get(attachmentId);
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        const url = URL.createObjectURL(blob);
        attachmentObjectUrls.set(attachmentId, url);
        return url;
      },
      providesTags: ['Attachments'],
      onCacheEntryAdded: async (attachmentId, { cacheEntryRemoved }) => {
        await cacheEntryRemoved;
        const url = attachmentObjectUrls.get(attachmentId);
        if (url) {
          URL.revokeObjectURL(url);
          attachmentObjectUrls.delete(attachmentId);
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadAttachmentMutation,
  useGetAttachmentContentBlobQuery,
  useLazyGetAttachmentContentBlobQuery,
} = attachmentsApi;
