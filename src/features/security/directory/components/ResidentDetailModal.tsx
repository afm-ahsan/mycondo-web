import { Car, Phone, User, Users } from 'lucide-react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { toUserMessage } from '@/api/errors';
import { formatDate } from '@/lib/helpers';
import { useAttachmentContentUrl } from '@/features/attachments/hooks/useAttachmentContentUrl';
import { useSecurityDirectoryDetail } from '../api/securityDirectoryApi';

const RESIDENT_TYPE_LABELS: Record<string, string> = {
  Owner: 'Owner',
  Tenant: 'Tenant',
};

export function ResidentDetailModal({
  entryId,
  residentType,
  onOpenChange,
}: {
  entryId: string | null;
  residentType: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: detail, isFetching, isError, error } = useSecurityDirectoryDetail(
    entryId && residentType ? { id: entryId, type: residentType } : skipToken,
  );
  const photoUrl = useAttachmentContentUrl(detail?.primaryPhotoAttachmentId);

  return (
    <Dialog open={entryId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{detail?.primaryFullName ?? 'Resident details'}</DialogTitle>
        </DialogHeader>

        {isError ? (
          <ErrorState description={toUserMessage(error)} />
        ) : isFetching || !detail ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-5">
            <section className="flex items-start gap-4">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="size-16 shrink-0 rounded-full border object-cover" />
              ) : (
                <div className="bg-accent flex size-16 shrink-0 items-center justify-center rounded-full border">
                  <User className="text-muted-foreground size-6" />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" appearance="light">
                    {RESIDENT_TYPE_LABELS[detail.residentType] ?? detail.residentType}
                  </Badge>
                  <Badge variant={detail.accessStatus === 'Authorized' ? 'success' : 'destructive'} appearance="light">
                    {detail.accessStatus}
                  </Badge>
                  <Badge variant="outline">{detail.occupancyStatus}</Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {detail.buildingName} · {detail.flatNumber}
                </p>
                {detail.primaryPhone && (
                  <p className="flex items-center gap-1.5 text-sm">
                    <Phone className="text-muted-foreground size-3.5" /> {detail.primaryPhone}
                  </p>
                )}
              </div>
            </section>

            {detail.householdMembers !== null && (
              <section>
                <h4 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                  <Users className="size-3.5" /> Household Members
                </h4>
                {detail.householdMembers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">None on file.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {detail.householdMembers.map((m, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span>{m.fullName}</span>
                        <span className="text-muted-foreground text-xs">{m.relationshipToPrimary}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {detail.workers !== null && (
              <section>
                <h4 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                  <User className="size-3.5" /> Workers & Drivers
                </h4>
                {detail.workers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">None assigned.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {detail.workers.map((w, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span>
                          {w.fullName} ({w.workerType})
                        </span>
                        <span className="text-muted-foreground text-xs">{w.verificationStatus}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {detail.vehicles !== null && (
              <section>
                <h4 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                  <Car className="size-3.5" /> Vehicles
                </h4>
                {detail.vehicles.length === 0 ? (
                  <p className="text-muted-foreground text-sm">None assigned.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {detail.vehicles.map((v, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span>{v.registrationNumber}</span>
                        <span className="text-muted-foreground text-xs">{v.vehicleType}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {detail.extendedDetail !== null && (
              <section>
                <h4 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">Timeline</h4>
                <ul className="space-y-1 text-sm">
                  {detail.extendedDetail.activatedAtUtc && (
                    <li className="flex items-center justify-between">
                      <span>Activated</span>
                      <span className="text-muted-foreground text-xs">{formatDate(detail.extendedDetail.activatedAtUtc)}</span>
                    </li>
                  )}
                  {detail.extendedDetail.movedOutAtUtc && (
                    <li className="flex items-center justify-between">
                      <span>Moved out</span>
                      <span className="text-muted-foreground text-xs">{formatDate(detail.extendedDetail.movedOutAtUtc)}</span>
                    </li>
                  )}
                  {detail.extendedDetail.ownershipStartDate && (
                    <li className="flex items-center justify-between">
                      <span>Ownership start</span>
                      <span className="text-muted-foreground text-xs">{formatDate(detail.extendedDetail.ownershipStartDate)}</span>
                    </li>
                  )}
                  {detail.extendedDetail.ownershipEndDate && (
                    <li className="flex items-center justify-between">
                      <span>Ownership end</span>
                      <span className="text-muted-foreground text-xs">{formatDate(detail.extendedDetail.ownershipEndDate)}</span>
                    </li>
                  )}
                </ul>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
