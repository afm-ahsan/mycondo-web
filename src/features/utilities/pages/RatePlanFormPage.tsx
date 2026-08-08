import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { z } from 'zod';
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
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useCreateRatePlan } from '../api/ratePlansApi';
import { RATE_STRUCTURES, type UtilityType } from '../lib/constants';
import { createRatePlanSchema, type CreateRatePlanSchemaType } from '../schemas/createRatePlanSchema';

interface RatePlanFormPageProps {
  utilityType: UtilityType;
}

export function RatePlanFormPage({ utilityType }: RatePlanFormPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [createRatePlan, { isLoading }] = useCreateRatePlan();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.input<typeof createRatePlanSchema>, unknown, CreateRatePlanSchemaType>({
    resolver: zodResolver(createRatePlanSchema),
    defaultValues: {
      buildingId: searchParams.get('buildingId') ?? '',
      name: '',
      structure: undefined,
      fixedAmount: undefined,
      fixedServiceCharge: 0,
      taxPercentage: 0,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      slabs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'slabs' });
  const structure = form.watch('structure');

  async function onSubmit(values: CreateRatePlanSchemaType) {
    setError(null);

    try {
      const ratePlan = await createRatePlan({
        createRatePlanCommand: {
          buildingId: values.buildingId,
          utilityType,
          name: values.name,
          structure: values.structure,
          fixedAmount: values.structure === 'Fixed' ? (values.fixedAmount ?? 0) : null,
          fixedServiceCharge: values.fixedServiceCharge,
          taxPercentage: values.taxPercentage,
          effectiveFrom: new Date(values.effectiveFrom).toISOString().slice(0, 10),
          slabs: values.structure === 'Metered' ? values.slabs.map((s) => ({
            slabOrder: s.slabOrder,
            fromUnits: s.fromUnits,
            toUnits: s.toUnits ?? null,
            ratePerUnit: s.ratePerUnit,
          })) : [],
        },
      }).unwrap();

      toast.success(`"${ratePlan.name}" created.`);
      navigate(`/utilities/${utilityType.toLowerCase()}/rate-plans?buildingId=${ratePlan.buildingId}`);
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
        title={`New ${utilityType} Rate Plan`}
        crumbs={[{ label: 'Billing & Collections' }, { label: utilityType }, { label: 'Rate Plans', path: `/utilities/${utilityType.toLowerCase()}/rate-plans` }, { label: 'New' }]}
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
              <FormField
                control={form.control}
                name="buildingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building</FormLabel>
                    <FormControl>
                      <BuildingSelect value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder={`e.g. Standard ${utilityType} Rate`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="structure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Structure</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select structure" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RATE_STRUCTURES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {structure === 'Fixed' && (
                <FormField
                  control={form.control}
                  name="fixedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fixed amount (BDT)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {structure === 'Metered' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Slabs</FormLabel>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => append({ slabOrder: fields.length + 1, fromUnits: 0, toUnits: undefined, ratePerUnit: 0 })}
                    >
                      <Plus /> Add Slab
                    </Button>
                  </div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                      <FormField
                        control={form.control}
                        name={`slabs.${index}.fromUnits`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs">From units</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} step="0.01" {...f} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`slabs.${index}.toUnits`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs">To units (blank = ∞)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} step="0.01" {...f} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`slabs.${index}.ratePerUnit`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Rate/unit</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} step="0.01" {...f} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="button" size="icon" variant="ghost" aria-label={`Remove slab ${index + 1}`} onClick={() => remove(index)}>
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fixedServiceCharge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fixed service charge (optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax % (optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="effectiveFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective from</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Create Rate Plan'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
