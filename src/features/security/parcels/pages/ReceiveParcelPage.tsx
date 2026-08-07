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
import { Separator } from '@/components/ui/separator';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { ResidentSelect, type ResidentSelectValue } from '@/components/shared/ResidentSelect';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useReceiveParcel } from '../api/parcelsApi';
import { PARCEL_TYPES } from '../lib/constants';
import { receiveParcelSchema, type ReceiveParcelSchemaType } from '../schemas/receiveParcelSchema';

export function ReceiveParcelPage() {
  const navigate = useNavigate();
  const [receiveParcel, { isLoading }] = useReceiveParcel();
  const [error, setError] = useState<string | null>(null);
  const [resident, setResident] = useState<ResidentSelectValue | null>(null);
  const [buildingId, setBuildingId] = useState('');

  const form = useForm<ReceiveParcelSchemaType>({
    resolver: zodResolver(receiveParcelSchema),
    defaultValues: {
      recipientFlatId: '',
      recipientResidentId: undefined,
      parcelType: undefined,
      packageCount: 1,
      parcelReference: '',
      courierProvider: '',
      trackingNumber: '',
      senderName: '',
      storageLocation: '',
    },
  });

  function handleResidentChange(picked: ResidentSelectValue | null) {
    setResident(picked);
    form.setValue('recipientResidentId', picked?.residentId, { shouldValidate: true });
    form.setValue('recipientFlatId', picked?.flatId ?? '', { shouldValidate: true });
  }

  async function onSubmit(values: ReceiveParcelSchemaType) {
    setError(null);

    try {
      const parcel = await receiveParcel({
        receiveParcelCommand: {
          recipientFlatId: values.recipientFlatId,
          recipientResidentId: values.recipientResidentId || null,
          parcelType: values.parcelType,
          packageCount: values.packageCount,
          parcelReference: values.parcelReference || null,
          courierProvider: values.courierProvider || null,
          trackingNumber: values.trackingNumber || null,
          senderName: values.senderName || null,
          storageLocation: values.storageLocation || null,
        },
      }).unwrap();

      toast.success('Parcel received and logged.');
      navigate(`/security/parcels/${parcel.parcelId}`);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        setError(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Receive Parcel"
        crumbs={[{ label: 'Front Desk' }, { label: 'Parcels', path: '/security/parcels' }, { label: 'Receive' }]}
      />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" appearance="light" className="mb-4" onClose={() => setError(null)}>
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <FormLabel>Recipient resident (optional)</FormLabel>
                <ResidentSelect value={resident} onChange={handleResidentChange} />
              </div>

              {!resident && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <FormLabel>Building</FormLabel>
                    <BuildingSelect
                      value={buildingId}
                      onValueChange={(v) => {
                        setBuildingId(v);
                        form.setValue('recipientFlatId', '', { shouldValidate: true });
                      }}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="recipientFlatId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flat</FormLabel>
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
                </div>
              )}
              {resident && (
                <p className="text-muted-foreground text-sm">
                  Delivering to {resident.fullName}&rsquo;s flat.
                </p>
              )}

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="parcelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcel type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PARCEL_TYPES.map((type) => (
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
                  name="packageCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package count</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="courierProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Courier (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Pathao Courier" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trackingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking number (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="senderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sender name (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="storageLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage location (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Front desk shelf B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="parcelReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal reference (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Log Parcel'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
