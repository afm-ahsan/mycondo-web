import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { HouseholdMemberPhotoUpload } from './HouseholdMemberPhotoUpload';

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

const uploadedFile = new File(['bytes'], 'photo.png', { type: 'image/png' });

describe('HouseholdMemberPhotoUpload', () => {
  it('shows a placeholder and an Upload Photo action when no photo exists yet', () => {
    renderWithProviders(
      <HouseholdMemberPhotoUpload
        ownerType="ResidentHouseholdMember"
        ownerId="member-1"
        primaryPhotoAttachmentId={null}
        onSetPrimaryPhoto={vi.fn()}
      />,
      { auth: { user: adminUser, isInitialized: true } },
    );

    expect(screen.getByRole('button', { name: /upload photo/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove photo/i })).not.toBeInTheDocument();
  });

  it('uploads a selected photo and hands the new attachment id to onSetPrimaryPhoto', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/attachments`, () =>
        HttpResponse.json({
          attachmentId: 'attachment-new',
          ownerType: 'ResidentHouseholdMember',
          ownerId: 'member-1',
          storageKey: 'a1b2.png',
          fileName: 'photo.png',
          contentType: 'image/png',
          sizeBytes: 5,
          createdAtUtc: new Date().toISOString(),
        }),
      ),
    );
    const onSetPrimaryPhoto = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(
      <HouseholdMemberPhotoUpload
        ownerType="ResidentHouseholdMember"
        ownerId="member-1"
        primaryPhotoAttachmentId={null}
        onSetPrimaryPhoto={onSetPrimaryPhoto}
      />,
      { auth: { user: adminUser, isInitialized: true } },
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, uploadedFile);

    await waitFor(() => {
      expect(onSetPrimaryPhoto).toHaveBeenCalledWith('attachment-new');
    });
  });

  it('shows Change/Remove actions and loads the existing photo when one is already set', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/attachments/attachment-existing/content`, () =>
        HttpResponse.arrayBuffer(new ArrayBuffer(4), { headers: { 'Content-Type': 'image/png' } }),
      ),
    );
    renderWithProviders(
      <HouseholdMemberPhotoUpload
        ownerType="ResidentHouseholdMember"
        ownerId="member-1"
        primaryPhotoAttachmentId="attachment-existing"
        onSetPrimaryPhoto={vi.fn()}
      />,
      { auth: { user: adminUser, isInitialized: true } },
    );

    expect(screen.getByRole('button', { name: /change photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove photo/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByAltText('Household member photo')).toHaveAttribute('src', expect.stringContaining('blob:'));
    });
  });

  it('calls onSetPrimaryPhoto with null when Remove Photo is clicked', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/attachments/attachment-existing/content`, () =>
        HttpResponse.arrayBuffer(new ArrayBuffer(4), { headers: { 'Content-Type': 'image/png' } }),
      ),
    );
    const onSetPrimaryPhoto = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(
      <HouseholdMemberPhotoUpload
        ownerType="ResidentHouseholdMember"
        ownerId="member-1"
        primaryPhotoAttachmentId="attachment-existing"
        onSetPrimaryPhoto={onSetPrimaryPhoto}
      />,
      { auth: { user: adminUser, isInitialized: true } },
    );

    await user.click(await screen.findByRole('button', { name: /remove photo/i }));

    await waitFor(() => {
      expect(onSetPrimaryPhoto).toHaveBeenCalledWith(null);
    });
  });
});
