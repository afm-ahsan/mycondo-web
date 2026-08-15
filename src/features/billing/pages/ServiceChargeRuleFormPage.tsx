import { useState } from 'react';
import { toUserMessage } from '@/api/errors';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  applyApiErrorToForm,
  toApiError,
} from '@/lib/forms/applyApiErrorToForm';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { useCreateServiceChargeRule } from '../api/serviceChargeRulesApi';
import {
  BILLING_FREQUENCIES,
  CALCULATION_METHODS,
  FLAT_TYPES,
} from '../lib/constants';
import {
  createServiceChargeRuleSchema,
  type CreateServiceChargeRuleSchemaType,
} from '../schemas/createServiceChargeRuleSchema';

// Create-only: ServiceChargeRule is immutable once created (ADR-017) — the only other mutators are
// Deactivate and EndEffectivePeriod (see ServiceChargeRuleManageDialog). A rule change means ending
// the old rule and creating a new one, not editing this one.
export function ServiceChargeRuleFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [createRule, { isLoading }] = useCreateServiceChargeRule();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateServiceChargeRuleSchemaType>({
    resolver: zodResolver(createServiceChargeRuleSchema),
    defaultValues: {
      buildingId: searchParams.get('buildingId') ?? '',
      category: '',
      name: '',
      calculationMethod: undefined,
      rate: 0,
      unitTypeFilter: undefined,
      frequency: undefined,
      effectiveFrom: new Date().toISOString().slice(0, 10),
    },
  });

  async function onSubmit(values: CreateServiceChargeRuleSchemaType) {
    setError(null);

    try {
      const rule = await createRule({
        createServiceChargeRuleCommand: {
          buildingId: values.buildingId,
          category: values.category,
          name: values.name,
          calculationMethod: values.calculationMethod,
          rate: values.rate,
          unitTypeFilter: values.unitTypeFilter || null,
          frequency: values.frequency,
          effectiveFrom: new Date(values.effectiveFrom)
            .toISOString()
            .slice(0, 10),
        },
      }).unwrap();

      toast.success(`"${rule.name}" created.`);
      navigate(`/billing/service-charge-rules?buildingId=${rule.buildingId}`);
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
        title="New Service Charge Rule"
        crumbs={[
          { label: 'Finance' },
          { label: 'Service Charges' },
          { label: 'Rules', path: '/billing/service-charge-rules' },
          { label: 'New' },
        ]}
      />
      <Card>
        <CardContent className="max-w-xl pt-6">
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
                name="buildingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building</FormLabel>
                    <FormControl>
                      <BuildingSelect
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Monthly Maintenance"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Maintenance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="calculationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calculation method</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CALCULATION_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method === 'FixedAmount'
                                ? 'Fixed Amount'
                                : 'Per Square Foot'}
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
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate (BDT)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unitTypeFilter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit type filter (optional)</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All unit types" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FLAT_TYPES.map((type) => (
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
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing frequency</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BILLING_FREQUENCIES.map((frequency) => (
                            <SelectItem key={frequency} value={frequency}>
                              {frequency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <p className="text-muted-foreground text-xs">
                        Informational only — batch generation does not currently
                        schedule by frequency.
                      </p>
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
                {isLoading ? 'Saving...' : 'Create Rule'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
