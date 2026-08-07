import { useState } from 'react';
import { AlertCircle, Car, UserRound, X } from 'lucide-react';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleSelect, type VehicleSelectValue } from '@/components/shared/VehicleSelect';
import { WorkerSelect, type WorkerSelectValue } from '@/components/shared/WorkerSelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import {
  useAssignVehicle,
  useAssignWorker,
  useEndVehicleAssignment,
  useEndWorkerAssignment,
  useVehicleAssignments,
  useWorkerAssignments,
} from '../api/leasingApi';

interface WorkerVehicleAssignmentsSectionProps {
  registrationId: string;
}

/**
 * Priority 2A/2B/2C — worker (incl. driver, per `DomesticWorkerType.Driver`) and vehicle assignments
 * for a Tenant Registration. Search-selects an EXISTING `DomesticWorkerProfile`/`Vehicle` (never
 * creates a duplicate master record here) and links it via the thin `leasing`-schema assignment
 * entities built server-side.
 */
export function WorkerVehicleAssignmentsSection({ registrationId }: WorkerVehicleAssignmentsSectionProps) {
  const { data: workers } = useWorkerAssignments({ id: registrationId });
  const { data: vehicles } = useVehicleAssignments({ id: registrationId });
  const [assignWorker, { isLoading: isAssigningWorker }] = useAssignWorker();
  const [endWorkerAssignment] = useEndWorkerAssignment();
  const [assignVehicle, { isLoading: isAssigningVehicle }] = useAssignVehicle();
  const [endVehicleAssignment] = useEndVehicleAssignment();

  const [selectedWorker, setSelectedWorker] = useState<WorkerSelectValue | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleSelectValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeWorkers = workers?.filter((w) => w.isActive) ?? [];
  const activeVehicles = vehicles?.filter((v) => v.isActive) ?? [];

  async function handleAssignWorker() {
    if (!selectedWorker) return;
    setError(null);
    try {
      await assignWorker({
        id: registrationId,
        assignWorkerRequest: { domesticWorkerProfileId: selectedWorker.domesticWorkerProfileId },
      }).unwrap();
      setSelectedWorker(null);
    } catch (err) {
      setError(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleAssignVehicle() {
    if (!selectedVehicle) return;
    setError(null);
    try {
      await assignVehicle({
        id: registrationId,
        assignVehicleRequest: { vehicleId: selectedVehicle.vehicleId },
      }).unwrap();
      setSelectedVehicle(null);
    } catch (err) {
      setError(toUserMessage(toApiError(err) ?? err));
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {error && (
        <Alert variant="destructive" appearance="light" className="sm:col-span-2" onClose={() => setError(null)}>
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <UserRound className="size-4" /> Workers & Drivers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeWorkers.length === 0 ? (
            <p className="text-muted-foreground text-sm">None assigned.</p>
          ) : (
            <ul className="space-y-2">
              {activeWorkers.map((w) => (
                <li key={w.occupancyRegistrationWorkerAssignmentId} className="flex items-center justify-between text-sm">
                  <span className="flex flex-col">
                    <span>
                      {w.workerFullName} <Badge variant="secondary" appearance="light">{w.workerType}</Badge>
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {w.workerPhone} · {w.verificationStatus}
                    </span>
                  </span>
                  <RequirePermission permission={PERMISSIONS.occupancyRegistration.create}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => endWorkerAssignment({ id: w.occupancyRegistrationWorkerAssignmentId })}
                      aria-label={`Remove ${w.workerFullName}`}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </RequirePermission>
                </li>
              ))}
            </ul>
          )}

          <RequirePermission permission={PERMISSIONS.occupancyRegistration.create}>
            <div className="flex gap-2 border-t pt-3">
              <WorkerSelect value={selectedWorker} onChange={setSelectedWorker} />
              <Button type="button" onClick={handleAssignWorker} disabled={!selectedWorker || isAssigningWorker}>
                Assign
              </Button>
            </div>
          </RequirePermission>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Car className="size-4" /> Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeVehicles.length === 0 ? (
            <p className="text-muted-foreground text-sm">None assigned.</p>
          ) : (
            <ul className="space-y-2">
              {activeVehicles.map((v) => (
                <li key={v.occupancyRegistrationVehicleAssignmentId} className="flex items-center justify-between text-sm">
                  <span className="flex flex-col">
                    <span>{v.registrationNumber}</span>
                    <span className="text-muted-foreground text-xs">
                      {v.vehicleType} {v.isBlocked ? '· Blocked' : ''}
                    </span>
                  </span>
                  <RequirePermission permission={PERMISSIONS.occupancyRegistration.create}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => endVehicleAssignment({ id: v.occupancyRegistrationVehicleAssignmentId })}
                      aria-label={`Remove ${v.registrationNumber}`}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </RequirePermission>
                </li>
              ))}
            </ul>
          )}

          <RequirePermission permission={PERMISSIONS.occupancyRegistration.create}>
            <div className="flex gap-2 border-t pt-3">
              <VehicleSelect value={selectedVehicle} onChange={setSelectedVehicle} />
              <Button type="button" onClick={handleAssignVehicle} disabled={!selectedVehicle || isAssigningVehicle}>
                Assign
              </Button>
            </div>
          </RequirePermission>
        </CardContent>
      </Card>
    </div>
  );
}
