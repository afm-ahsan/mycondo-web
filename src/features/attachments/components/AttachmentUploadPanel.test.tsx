import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { AttachmentUploadPanel } from './AttachmentUploadPanel';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  tenantId: 'tenant-1',
  roles: ['SuperAdmin'],
  permissions: ['document.view', 'document.upload'],
  buildingIds: [],
  buildingPermissions: [],
};

function renderPanel() {
  return renderWithProviders(
    <AttachmentUploadPanel ownerType="Resident" ownerId="resident-1" label="Click to upload" />,
    { auth: { user: adminUser, isInitialized: true } },
  );
}

const uploadedFile = new File(['bytes'], 'deed.pdf', { type: 'application/pdf' });

describe('AttachmentUploadPanel', () => {
  it('lists already-uploaded documents and allows removing one', async () => {
    let removed = false;
    const existingDto = {
      attachmentId: 'attachment-1',
      ownerType: 'Resident',
      ownerId: 'resident-1',
      storageKey: 'a1b2c3.pdf',
      fileName: 'deed.pdf',
      contentType: 'application/pdf',
      sizeBytes: 2048,
      createdAtUtc: new Date().toISOString(),
    };
    server.use(
      http.get(`${API_BASE}/api/v1/attachments`, () => HttpResponse.json(removed ? [] : [existingDto])),
      http.get(
        `${API_BASE}/api/v1/attachments/attachment-1/content`,
        () => new HttpResponse('fake-bytes', { headers: { 'Content-Type': 'application/pdf' } }),
      ),
      http.delete(`${API_BASE}/api/v1/attachments/attachment-1`, () => {
        removed = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderPanel();

    expect(await screen.findByText('deed.pdf')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /view/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove deed\.pdf/i }));

    await waitFor(() => {
      expect(screen.queryByText('deed.pdf')).not.toBeInTheDocument();
    });
  });

  it('uploads a selected file and shows it as uploaded once the server confirms', async () => {
    let uploaded = false;
    const uploadedDto = {
      attachmentId: 'attachment-2',
      ownerType: 'Resident',
      ownerId: 'resident-1',
      storageKey: 'd4e5f6.pdf',
      fileName: 'deed.pdf',
      contentType: 'application/pdf',
      sizeBytes: 2048,
      createdAtUtc: new Date().toISOString(),
    };
    server.use(
      http.get(`${API_BASE}/api/v1/attachments`, () => HttpResponse.json(uploaded ? [uploadedDto] : [])),
      http.get(
        `${API_BASE}/api/v1/attachments/attachment-2/content`,
        () => new HttpResponse('fake-bytes', { headers: { 'Content-Type': 'application/pdf' } }),
      ),
      http.post(`${API_BASE}/api/v1/attachments`, () => {
        uploaded = true;
        return HttpResponse.json(uploadedDto);
      }),
    );
    const user = userEvent.setup();
    renderPanel();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, uploadedFile);

    await waitFor(() => {
      expect(screen.getByText('deed.pdf')).toBeInTheDocument();
      expect(screen.getByText('Uploaded')).toBeInTheDocument();
    });
  });

  it('shows a retry affordance when the upload fails, and clears it on a successful retry', async () => {
    let attempt = 0;
    server.use(
      http.get(`${API_BASE}/api/v1/attachments`, () => HttpResponse.json([])),
      http.post(`${API_BASE}/api/v1/attachments`, () => {
        attempt += 1;
        if (attempt === 1) {
          return HttpResponse.json({ title: 'Upload failed', status: 500 }, { status: 500 });
        }
        return HttpResponse.json({
          attachmentId: 'attachment-3',
          ownerType: 'Resident',
          ownerId: 'resident-1',
          storageKey: 'g7h8i9.pdf',
          fileName: 'deed.pdf',
          contentType: 'application/pdf',
          sizeBytes: 2048,
          createdAtUtc: new Date().toISOString(),
        });
      }),
    );
    const user = userEvent.setup();
    renderPanel();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, uploadedFile);

    const retryButton = await screen.findByRole('button', { name: /retry deed\.pdf/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /retry deed\.pdf/i })).not.toBeInTheDocument();
    });
  });

  it('shows an image thumbnail preview for an existing image attachment', async () => {
    const imageDto = {
      attachmentId: 'attachment-img',
      ownerType: 'Resident',
      ownerId: 'resident-1',
      storageKey: 'a1b2c3.jpg',
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 1024,
      createdAtUtc: new Date().toISOString(),
    };
    server.use(
      http.get(`${API_BASE}/api/v1/attachments`, () => HttpResponse.json([imageDto])),
      http.get(
        `${API_BASE}/api/v1/attachments/attachment-img/content`,
        () => new HttpResponse('fake-bytes', { headers: { 'Content-Type': 'image/jpeg' } }),
      ),
    );
    renderPanel();

    const preview = await screen.findByRole('link', { name: /preview photo\.jpg/i });
    expect(preview.querySelector('img')).toBeInTheDocument();
  });
});
