import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { HouseholdMembersStep } from './HouseholdMembersStep';

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

const existingMember = {
  householdMemberId: 'member-1',
  occupancyRegistrationId: 'registration-1',
  fullName: 'John Tenant Jr',
  relationshipToPrimary: 'Spouse',
  dateOfBirth: '1992-05-01',
  phone: null,
  nationalIdNumberMasked: null,
  gender: 'Male',
  birthCertificateNumberMasked: null,
  bloodGroup: null,
  religion: null,
  nationality: null,
  occupation: null,
  isActive: true,
  primaryPhotoAttachmentId: null,
};

function renderStep() {
  server.use(
    http.get(`${API_BASE}/api/v1/occupancy-registrations/registration-1/household-members`, () =>
      HttpResponse.json([existingMember]),
    ),
    http.get(`${API_BASE}/api/v1/attachments`, () => HttpResponse.json([])),
  );
  return renderWithProviders(
    <HouseholdMembersStep registrationId="registration-1" onContinue={vi.fn()} onBack={vi.fn()} />,
    { auth: { user: adminUser, isInitialized: true } },
  );
}

describe('HouseholdMembersStep', () => {
  it('does not show the photo/documents section while adding a new member', async () => {
    renderStep();

    expect(await screen.findByText('John Tenant Jr')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /upload photo/i })).not.toBeInTheDocument();
  });

  it('shows the photo upload and documents panel, scoped to that member, when editing an existing member', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(await screen.findByRole('button', { name: /edit john tenant jr/i }));

    expect(await screen.findByRole('button', { name: /upload photo/i })).toBeInTheDocument();
    expect(screen.getByText('Documents (NID, Birth Certificate, etc.)')).toBeInTheDocument();
  });

  it('calls the primary-photo endpoint with the member id when a photo is uploaded', async () => {
    let capturedSetPhotoBody: unknown;
    server.use(
      http.post(`${API_BASE}/api/v1/attachments`, () =>
        HttpResponse.json({
          attachmentId: 'photo-1',
          ownerType: 'LeasingHouseholdMember',
          ownerId: 'member-1',
          storageKey: 'k.png',
          fileName: 'photo.png',
          contentType: 'image/png',
          sizeBytes: 5,
          createdAtUtc: new Date().toISOString(),
        }),
      ),
      http.put(`${API_BASE}/api/v1/household-members/member-1/primary-photo`, async ({ request }) => {
        capturedSetPhotoBody = await request.json();
        return HttpResponse.json({ ...existingMember, primaryPhotoAttachmentId: 'photo-1' });
      }),
    );
    const user = userEvent.setup();
    renderStep();

    await user.click(await screen.findByRole('button', { name: /edit john tenant jr/i }));
    const photoInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(photoInput, new File(['x'], 'photo.png', { type: 'image/png' }));

    await waitFor(() => {
      expect(capturedSetPhotoBody).toEqual({ attachmentId: 'photo-1' });
    });
  });
});
