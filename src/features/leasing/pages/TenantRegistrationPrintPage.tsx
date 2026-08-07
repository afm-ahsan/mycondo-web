import { skipToken } from '@reduxjs/toolkit/query/react';
import { Printer } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/helpers';
import {
  useHouseholdMembers,
  useOccupancySecurityView,
  useTenantRegistration,
  useVehicleAssignments,
  useWorkerAssignments,
} from '../api/leasingApi';

/**
 * Priority 2H — printable English Tenant Registration form. Frontend-only (no PDF library exists
 * anywhere in mycondo-api or mycondo-web today — see the Priority 2 conflict write-up): `@media print`
 * CSS plus `window.print()`, the browser handles A4 pagination and page breaks natively.
 *
 * A few paper-form fields (Father's/Mother's Name, Marital Status, Profession, Employer, household
 * Occupation, driver Licence number, Unit Owner/Lease dates, Previous Landlord) are on the original
 * DMP form but were never part of the Priority 1/2 data model — rather than fabricate values, this
 * renders those rows with "—" so the layout matches the paper form's intent while never inventing
 * business data. National ID is always masked; there is no "reveal" authorization mechanism.
 */
export function TenantRegistrationPrintPage() {
  const { id } = useParams<{ id: string }>();
  const registrationId = id ?? '';

  const { data: registration } = useTenantRegistration(registrationId ? { id: registrationId } : skipToken);
  const { data: security } = useOccupancySecurityView(registrationId ? { id: registrationId } : skipToken);
  const { data: members } = useHouseholdMembers(registrationId ? { id: registrationId } : skipToken);
  const { data: workers } = useWorkerAssignments(registrationId ? { id: registrationId } : skipToken);
  const { data: vehicles } = useVehicleAssignments(registrationId ? { id: registrationId } : skipToken);

  if (!registration) {
    return <p className="text-muted-foreground p-6 text-sm">Loading…</p>;
  }

  const activeMembers = members?.filter((m) => m.isActive) ?? [];
  const activeWorkers = workers?.filter((w) => w.isActive) ?? [];
  const activeVehicles = vehicles?.filter((v) => v.isActive) ?? [];
  const domesticWorkers = activeWorkers.filter((w) => w.workerType !== 'Driver');
  const drivers = activeWorkers.filter((w) => w.workerType === 'Driver');

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-root, #print-root * { visibility: visible; }
          #print-root { position: absolute; inset: 0; width: 100%; margin: 0; padding: 0; }
          #print-hide-on-print { display: none !important; }
          @page { size: A4; margin: 16mm; }
        }
      `}</style>

      <div id="print-hide-on-print" className="mb-4 flex justify-end">
        <Button onClick={() => window.print()}>
          <Printer /> Print
        </Button>
      </div>

      <div id="print-root" className="mx-auto max-w-[210mm] space-y-6 bg-white p-8 text-black print:p-0">
        <header className="border-b-2 border-black pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold uppercase">Flat Owner / Tenant Registration Form</h1>
              <p className="text-sm">
                {security?.buildingName ?? '—'} · Flat {security?.flatNumber ?? '—'}
              </p>
            </div>
            <div className="text-end text-xs">
              <p>Registration No.: {registration.occupancyRegistrationId}</p>
              <p>Status: {registration.status}</p>
            </div>
          </div>
          <div className="mt-2 h-24 w-20 border border-black text-center text-[10px] leading-[6rem] text-gray-500">
            Photo
          </div>
        </header>

        <Section title="Primary Resident">
          <Grid>
            <Field label="Full Name" value={registration.primaryFullName} />
            <Field label="Father's Name" value="—" />
            <Field label="Mother's Name" value="—" />
            <Field label="Date of Birth" value={registration.primaryDateOfBirth ? formatDate(registration.primaryDateOfBirth) : '—'} />
            <Field label="Marital Status" value="—" />
            <Field label="Permanent Address" value={registration.primaryPermanentAddress ?? '—'} span2 />
            <Field label="Profession" value="—" />
            <Field label="Employer / Office Address" value="—" />
            <Field label="Mobile" value={registration.primaryPhone ?? '—'} />
            <Field label="Email" value={registration.primaryEmail ?? '—'} />
            <Field label="National ID / Passport" value={registration.primaryNationalIdNumberMasked ?? '—'} />
          </Grid>
        </Section>

        <Section title="Emergency Contact">
          <Grid>
            <Field label="Name" value={registration.emergencyContactName ?? '—'} />
            <Field label="Relationship" value="—" />
            <Field label="Address" value="—" />
            <Field label="Mobile" value={registration.emergencyContactPhone ?? '—'} />
          </Grid>
        </Section>

        <Section title="Household Members">
          {activeMembers.length === 0 ? (
            <p className="text-xs">None declared.</p>
          ) : (
            <Table headers={['Name', 'Relationship', 'Date of Birth', 'Occupation', 'Mobile']}>
              {activeMembers.map((m) => (
                <tr key={m.householdMemberId}>
                  <Td>{m.fullName}</Td>
                  <Td>{m.relationshipToPrimary}</Td>
                  <Td>{m.dateOfBirth ? formatDate(m.dateOfBirth) : '—'}</Td>
                  <Td>—</Td>
                  <Td>{m.phone ?? '—'}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        <Section title="Domestic Workers">
          {domesticWorkers.length === 0 ? (
            <p className="text-xs">None declared.</p>
          ) : (
            <Table headers={['Name', 'Mobile', 'Verification Status']}>
              {domesticWorkers.map((w) => (
                <tr key={w.occupancyRegistrationWorkerAssignmentId}>
                  <Td>{w.workerFullName}</Td>
                  <Td>{w.workerPhone}</Td>
                  <Td>{w.verificationStatus}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        <Section title="Drivers">
          {drivers.length === 0 ? (
            <p className="text-xs">None declared.</p>
          ) : (
            <Table headers={['Name', 'Mobile', 'Licence', 'Verification Status']}>
              {drivers.map((w) => (
                <tr key={w.occupancyRegistrationWorkerAssignmentId}>
                  <Td>{w.workerFullName}</Td>
                  <Td>{w.workerPhone}</Td>
                  <Td>—</Td>
                  <Td>{w.verificationStatus}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        <Section title="Vehicles">
          {activeVehicles.length === 0 ? (
            <p className="text-xs">None declared.</p>
          ) : (
            <Table headers={['Registration Number', 'Type']}>
              {activeVehicles.map((v) => (
                <tr key={v.occupancyRegistrationVehicleAssignmentId}>
                  <Td>{v.registrationNumber}</Td>
                  <Td>{v.vehicleType}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        <Section title="Tenancy">
          <Grid>
            <Field label="Occupancy Type" value={registration.occupancyType} />
            <Field label="Unit Owner" value={registration.occupancyType === 'Owner' ? registration.primaryFullName : '—'} />
            <Field label="Lease Start" value="—" />
            <Field label="Lease End" value="—" />
            <Field
              label="Move-in Date"
              value={
                registration.activatedAtUtc
                  ? formatDate(registration.activatedAtUtc)
                  : (registration.moveInExpectedDate ? `${formatDate(registration.moveInExpectedDate)} (expected)` : '—')
              }
            />
            <Field label="Previous Landlord / Address" value="—" />
          </Grid>
        </Section>

        <Section title="Declaration">
          <Grid>
            <Field label="Applicant" value={registration.primaryFullName} />
            <Field label="Submission Date" value={registration.submittedAtUtc ? formatDate(registration.submittedAtUtc) : '—'} />
            <Field
              label="Owner Approval"
              value={registration.ownerReviewedAtUtc ? `Approved ${formatDate(registration.ownerReviewedAtUtc)}` : 'Pending'}
            />
            <Field
              label="Management Approval"
              value={registration.managementVerifiedAtUtc ? `Verified ${formatDate(registration.managementVerifiedAtUtc)}` : 'Pending'}
            />
          </Grid>
          <div className="mt-8 grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="mb-8 border-b border-black" />
              Applicant Signature
            </div>
            <div>
              <div className="mb-8 border-b border-black" />
              Management Signature
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-2 border-b border-black text-xs font-bold uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">{children}</div>;
}

function Field({ label, value, span2 }: { label: string; value: string; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : undefined}>
      <span className="font-semibold">{label}: </span>
      <span>{value}</span>
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} className="border border-black bg-gray-100 p-1 text-left">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border border-black p-1">{children}</td>;
}
