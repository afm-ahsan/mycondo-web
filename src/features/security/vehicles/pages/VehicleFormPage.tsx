import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useRegisterVehicle } from '../api/vehiclesApi';
import { VEHICLE_OWNERSHIP_CATEGORIES, VEHICLE_TYPES } from '../lib/constants';
import { registerVehicleSchema, type RegisterVehicleSchemaType } from '../schemas/registerVehicleSchema';

// Create-only: mycondo-api's Vehicle feature exposes no update endpoint, only register/block/unblock
// — no "edit" mode here, matching GuestProfileFormPage's precedent for the same backend shape.
export function VehicleFormPage() {
  const navigate = useNavigate();
  const [registerVehicle, { isLoading }] = useRegisterVehicle();
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

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
      navigate('/security/vehicles');
    } catch (err) {
      const apiError = toApiError(err);
      // No conflictMessage override — the backend's detail already names the exact duplicate
      // registration number, which is clearer than a generic replacement would be.
      const handled = applyApiErrorToForm(form, apiError, { conflictField: 'registrationNumber' });
      if (!handled) {
        setError(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Register Vehicle"
        crumbs={[{ label: 'Security & Access' }, { label: 'Vehicle Access', path: '/security/vehicles' }, { label: 'Register' }]}
      />
      <Card className="max-w-lg">
        <CardContent className="pt-6">
          {error && (
            <Alert
              variant="destructive"
              appearance="light"
              className="mb-4"
              onClose={() => setError(null)}
            >
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Register Vehicle'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
