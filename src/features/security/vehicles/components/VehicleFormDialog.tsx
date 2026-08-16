import { toUserMessage } from '@/api/errors';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  applyApiErrorToForm,
  toApiError,
} from '@/lib/forms/applyApiErrorToForm';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { EntityFormDialog } from '@/components/shared/EntityFormDialog';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { useRegisterVehicle } from '../api/vehiclesApi';
import { VEHICLE_OWNERSHIP_CATEGORIES, VEHICLE_TYPES } from '../lib/constants';
import {
  registerVehicleSchema,
  type RegisterVehicleSchemaType,
} from '../schemas/registerVehicleSchema';

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Create-only: mycondo-api's Vehicle feature exposes no update endpoint, only register/block/unblock.
export function VehicleFormDialog({ open, onOpenChange }: VehicleFormDialogProps) {
  const [registerVehicle, { isLoading }] = useRegisterVehicle();

  const form = useForm<RegisterVehicleSchemaType>({
    resolver: zodResolver(registerVehicleSchema),
    defaultValues: {
      registrationNumber: '',
      vehicleType: undefined,
      make: '',
      model: '',
      color: '',
      ownershipCategory: undefined,
      buildingId: '',
      flatId: '',
    },
  });

  const buildingId = form.watch('buildingId');

  async function onSubmit(values: RegisterVehicleSchemaType) {
    try {
      const vehicle = await registerVehicle({
        registerVehicleCommand: {
          registrationNumber: values.registrationNumber,
          vehicleType: values.vehicleType,
          make: values.make || null,
          model: values.model || null,
          color: values.color || null,
          ownershipCategory: values.ownershipCategory,
          flatId: values.flatId || null,
        },
      }).unwrap();

      toast.success(`Vehicle "${vehicle.registrationNumber}" registered.`);
      form.reset();
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      // No conflictMessage override — the backend's detail already names the exact duplicate
      // registration number, which is clearer than a generic replacement would be.
      const handled = applyApiErrorToForm(form, apiError, {
        conflictField: 'registrationNumber',
      });
      if (!handled) {
        toast.error(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <EntityFormDialog open={open} onOpenChange={onOpenChange} title="Register Vehicle">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="registrationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. DHAKA-METRO-GA-1234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vehicleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VEHICLE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ownershipCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ownership category</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VEHICLE_OWNERSHIP_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="make"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Make (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Toyota" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Corolla" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. White" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="buildingId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Building (optional)</FormLabel>
                <FormControl>
                  <BuildingSelect value={field.value} onValueChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="flatId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Flat (optional)</FormLabel>
                <FormControl>
                  <FlatSelect
                    buildingId={buildingId}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!buildingId}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Register Vehicle'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </EntityFormDialog>
  );
}
