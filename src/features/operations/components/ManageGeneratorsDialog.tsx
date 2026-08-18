import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { Pencil, Plus, Power, PowerOff, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RowActionsMenu } from '@/components/ui/data-grid-row-actions';
import { EmptyState } from '@/components/feedback/EmptyState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { toUserMessage } from '@/api/errors';
import {
  useCreateGenerator,
  useDeactivateGenerator,
  useGenerators,
  useReactivateGenerator,
  useUpdateGenerator,
} from '../api/generatorsApi';
import { GeneratorFormDialog } from './GeneratorFormDialog';
import type { GeneratorDto } from '@/api/generated/mycondoApi';
import type { GeneratorSchemaType } from '../schemas/generatorSchema';

interface ManageGeneratorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Generator master list + create/edit/deactivate/reactivate — see GeneratorFormDialog's doc comment
 * for why this lives here rather than as its own menu item. */
export function ManageGeneratorsDialog({ open, onOpenChange }: ManageGeneratorsDialogProps) {
  const { data, isFetching } = useGenerators(open ? { page: 1, pageSize: 100 } : skipToken);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGenerator, setEditingGenerator] = useState<GeneratorDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [createGenerator, { isLoading: isCreating }] = useCreateGenerator();
  const [updateGenerator, { isLoading: isUpdating }] = useUpdateGenerator();
  const [deactivateGenerator] = useDeactivateGenerator();
  const [reactivateGenerator] = useReactivateGenerator();
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);

  async function handleSubmit(values: GeneratorSchemaType) {
    setErrorMessage(null);
    try {
      if (editingGenerator) {
        await updateGenerator({
          id: editingGenerator.generatorId,
          updateGeneratorRequest: {
            name: values.name,
            model: values.model || null,
            capacityKva: values.capacityKva ?? null,
            location: values.location || null,
          },
        }).unwrap();
      } else {
        await createGenerator({
          createGeneratorCommand: {
            buildingId: values.buildingId,
            name: values.name,
            model: values.model || null,
            capacityKva: values.capacityKva ?? null,
            location: values.location || null,
          },
        }).unwrap();
      }
      setFormOpen(false);
      setEditingGenerator(null);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleToggleActive(generator: GeneratorDto) {
    setErrorMessage(null);
    setPendingToggleId(generator.generatorId);
    try {
      if (generator.isActive) {
        await deactivateGenerator({ id: generator.generatorId }).unwrap();
      } else {
        await reactivateGenerator({ id: generator.generatorId }).unwrap();
      }
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    } finally {
      setPendingToggleId(null);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Generators</DialogTitle>
          </DialogHeader>

          {errorMessage && <p className="text-destructive text-sm">{errorMessage}</p>}

          <RequirePermission permission={PERMISSIONS.generator.manage}>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setEditingGenerator(null);
                  setFormOpen(true);
                }}
              >
                <Plus /> New Generator
              </Button>
            </div>
          </RequirePermission>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Capacity (kVA)</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                <TableSkeleton columns={6} />
              ) : (data?.items ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0 text-center">
                    <EmptyState
                      icon={<Zap className="size-8" aria-hidden="true" />}
                      title="No generators found"
                      description="No generators have been added yet."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                (data?.items ?? []).map((generator) => (
                  <TableRow key={generator.generatorId}>
                    <TableCell>{generator.name}</TableCell>
                    <TableCell>{generator.model ?? '—'}</TableCell>
                    <TableCell>{generator.capacityKva ?? '—'}</TableCell>
                    <TableCell>{generator.location ?? '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={generator.isActive ? 'primary' : 'secondary'} appearance="light">
                        {generator.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <RowActionsMenu
                        ariaLabel={`Actions for ${generator.name}`}
                        actions={[
                          {
                            key: 'edit',
                            label: 'Edit',
                            icon: <Pencil />,
                            onClick: () => {
                              setEditingGenerator(generator);
                              setFormOpen(true);
                            },
                            permission: PERMISSIONS.generator.manage,
                          },
                          {
                            key: 'toggle-active',
                            label: generator.isActive ? 'Deactivate' : 'Reactivate',
                            icon: generator.isActive ? <PowerOff /> : <Power />,
                            onClick: () => handleToggleActive(generator),
                            permission: PERMISSIONS.generator.manage,
                            disabled: pendingToggleId === generator.generatorId,
                            variant: generator.isActive ? 'destructive' : undefined,
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <GeneratorFormDialog
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditingGenerator(null);
        }}
        isSubmitting={isCreating || isUpdating}
        onSubmit={handleSubmit}
        initialValues={
          editingGenerator
            ? {
                buildingId: editingGenerator.buildingId,
                name: editingGenerator.name,
                model: editingGenerator.model ?? undefined,
                capacityKva: editingGenerator.capacityKva != null ? Number(editingGenerator.capacityKva) : undefined,
                location: editingGenerator.location ?? undefined,
              }
            : undefined
        }
      />
    </>
  );
}
