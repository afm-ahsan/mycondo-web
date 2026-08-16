import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { PasswordPolicyInfo } from '@/components/shared/PasswordPolicyInfo';
import { PasswordRequirementsChecklist } from '@/components/shared/PasswordRequirementsChecklist';
import {
  initialAdministratorSchema,
  type InitialAdministratorSchemaType,
} from '../schemas/initialAdministratorSchema';

interface InitialAdministratorStepProps {
  defaultValues: InitialAdministratorSchemaType;
  onContinue: (values: InitialAdministratorSchemaType) => void;
  onBack: () => void;
}

export function InitialAdministratorStep({ defaultValues, onContinue, onBack }: InitialAdministratorStepProps) {
  const form = useForm<InitialAdministratorSchemaType>({
    resolver: zodResolver(initialAdministratorSchema),
    defaultValues,
  });
  const password = form.watch('password');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onContinue)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem>
              <div className="flex items-center gap-1.5">
                <FormLabel>Initial password</FormLabel>
                <PasswordPolicyInfo />
              </div>
              <FormControl>
                <PasswordInput label="initial password" {...field} />
              </FormControl>
              {fieldState.isDirty && <PasswordRequirementsChecklist value={password} />}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </Form>
  );
}
