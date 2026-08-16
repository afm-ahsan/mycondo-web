import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { OwnerHouseholdStep } from './OwnerHouseholdStep';

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
  residentHouseholdMemberId: 'member-1',
  residentId: 'resident-1',
  fullName: 'Fatema Ahmed',
  relationshipType: 'Spouse',
  gender: 'Female',
  dateOfBirth: '1992-05-01',
  nationalIdNumberMasked: null,
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
    http.get(`${API_BASE}/api/v1/residents/resident-1/household-members`, () => HttpResponse.json([existingMember])),
    http.get(`${API_BASE}/api/v1/attachments`, () => HttpResponse.json([])),
  );
  return renderWithProviders(<OwnerHouseholdStep residentId="resident-1" onContinue={vi.fn()} onBack={vi.fn()} />, {
    auth: { user: adminUser, isInitialized: true },
  });
}

describe('OwnerHouseholdStep', () => {
  it('does not show the photo/documents section while adding a new member', async () => {
    renderStep();

    expect(await screen.findByText('Fatema Ahmed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /upload photo/i })).not.toBeInTheDocument();
  });

  it('shows the photo upload and documents panel, scoped to that member, when editing an existing member', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(await screen.findByRole('button', { name: /edit fatema ahmed/i }));

    expect(await screen.findByRole('button', { name: /upload photo/i })).toBeInTheDocument();
    expect(screen.getByText('Documents (NID, Birth Certificate, etc.)')).toBeInTheDocument();
  });

  it('sends the member id as ownerId when uploading a document while editing', async () => {
    let capturedOwnerId: string | null = null;
    server.use(
      http.post(`${API_BASE}/api/v1/attachments`, async ({ request }) => {
        const form = await request.formData();
        capturedOwnerId = form.get('ownerId') as string;
        return HttpResponse.json({
          attachmentId: 'doc-1',
          ownerType: 'ResidentHouseholdMember',
          ownerId: capturedOwnerId,
          storageKey: 'k.pdf',
          fileName: 'nid.pdf',
          contentType: 'application/pdf',
          sizeBytes: 10,
          createdAtUtc: new Date().toISOString(),
        });
      }),
    );
    const user = userEvent.setup();
    renderStep();

    await user.click(await screen.findByRole('button', { name: /edit fatema ahmed/i }));
    await screen.findByText('Documents (NID, Birth Certificate, etc.)');

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const documentInput = fileInputs[fileInputs.length - 1] as HTMLInputElement;
    await user.upload(documentInput, new File(['x'], 'nid.pdf', { type: 'application/pdf' }));

    await waitFor(() => {
      expect(capturedOwnerId).toBe('member-1');
    });
  });
});
