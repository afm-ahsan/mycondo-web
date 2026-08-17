import { useState } from 'react';
import { toApiError, toUserMessage } from '@/api/errors';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper';
import { PageHeader } from '@/components/shared/PageHeader';
import { useCreateOrganizationMutation } from '../api/platformOrganizationsApi';
import { InitialAdministratorStep } from '../components/InitialAdministratorStep';
import { ModuleSelectionStep } from '../components/ModuleSelectionStep';
import { OrganizationIdentityStep } from '../components/OrganizationIdentityStep';
import { ALL_MODULE_KEYS } from '../lib/moduleKeys';
import type { InitialAdministratorSchemaType } from '../schemas/initialAdministratorSchema';
import type { OrganizationIdentitySchemaType } from '../schemas/organizationIdentitySchema';

const STEPS = [
  { step: 1, title: 'Organization' },
  { step: 2, title: 'Administrator' },
  { step: 3, title: 'Features' },
];

/**
 * Provisions a new organization AND its founding administrator in one atomic backend call — no
 * per-step persistence (contrast the leasing Tenant Registration wizard, which creates a draft after
 * step 1). Nothing is sent to the server until the final "Create Organization" click.
 */
export function NewOrganizationWizardPage() {
  const navigate = useNavigate();
  const [createOrganization, { isLoading: isCreating }] =
    useCreateOrganizationMutation();
  const [activeStep, setActiveStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [identity, setIdentity] = useState<OrganizationIdentitySchemaType>({
    name: '',
    code: '',
    slug: '',
  });
  const [administrator, setAdministrator] =
    useState<InitialAdministratorSchemaType>({
      fullName: '',
      email: '',
      password: '',
    });

  function handleIdentityContinue(values: OrganizationIdentitySchemaType) {
    setIdentity(values);
    setActiveStep(2);
  }

  function handleAdministratorContinue(values: InitialAdministratorSchemaType) {
    setAdministrator(values);
    setActiveStep(3);
  }

  async function handleCreate(moduleKeys: string[]) {
    setError(null);
    try {
      const result = await createOrganization({
        name: identity.name,
        code: identity.code,
        slug: identity.slug,
        administratorFullName: administrator.fullName,
        administratorEmail: administrator.email,
        administratorPassword: administrator.password,
        enabledModuleKeys: moduleKeys,
      }).unwrap();

      toast.success(`${result.name} created.`);
      navigate(`/platform/organizations/${result.tenantId}`);
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError?.isConflict) {
        setError(
          'An organization with this slug or code already exists. Go back and choose a different one.',
        );
        return;
      }
      setError(toUserMessage(apiError ?? err));
    }
  }

  return (
    <>
      <PageHeader
        title="New Organization"
        crumbs={[
          { label: 'Dashboard', path: '/platform/dashboard' },
          { label: 'Organizations', path: '/platform/organizations' },
          { label: 'New Organization' },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>New Organization</CardTitle>
        </CardHeader>
        <CardContent className="max-w-2xl space-y-6">
          <Stepper value={activeStep}>
            <StepperNav className="mb-6">
              {STEPS.map(({ step, title }, index) => (
                <StepperItem
                  key={step}
                  step={step}
                  disabled={step > activeStep}
                >
                  <StepperTrigger>
                    <StepperIndicator>{step}</StepperIndicator>
                    <StepperTitle className="hidden sm:block">
                      {title}
                    </StepperTitle>
                  </StepperTrigger>
                  {index < STEPS.length - 1 && <StepperSeparator />}
                </StepperItem>
              ))}
            </StepperNav>
          </Stepper>

          {error && (
            <Alert
              variant="destructive"
              appearance="light"
              onClose={() => setError(null)}
            >
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          {activeStep === 1 && (
            <OrganizationIdentityStep
              defaultValues={identity}
              onContinue={handleIdentityContinue}
            />
          )}

          {activeStep === 2 && (
            <InitialAdministratorStep
              defaultValues={administrator}
              onContinue={handleAdministratorContinue}
              onBack={() => setActiveStep(1)}
            />
          )}

          {activeStep === 3 && (
            <ModuleSelectionStep
              defaultModuleKeys={ALL_MODULE_KEYS}
              isSubmitting={isCreating}
              onSubmit={handleCreate}
              onBack={() => setActiveStep(2)}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
