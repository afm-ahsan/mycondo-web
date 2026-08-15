import { toUserMessage } from '@/api/errors';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyProfile } from '@/features/auth/api/authApi';
import { AvatarSection } from '../components/AvatarSection';
import { ChangePasswordSection } from '../components/ChangePasswordSection';
import { PersonalDetailsForm } from '../components/PersonalDetailsForm';

/**
 * Self-service account-settings page backed by mycondo-api's GET/PUT /api/v1/auth/me and the
 * avatar/change-password endpoints alongside it — every field shown/edited here is derived solely
 * from the caller's own JWT identity, the same self-scoped pattern the rest of the `me` feature uses.
 */
export function MyProfilePage() {
  const { data: profile, isError, error, refetch } = useMyProfile();

  return (
    <>
      <PageHeader
        title="My Profile"
        description="Manage your personal information, profile image and account security."
        crumbs={[{ label: 'My Profile' }]}
      />

      {isError ? (
        <Card>
          <CardContent className="py-6">
            <ErrorState description={toUserMessage(error)} onRetry={refetch} />
          </CardContent>
        </Card>
      ) : !profile ? (
        <Card>
          <CardContent className="space-y-4 py-6">
            <Skeleton className="mx-auto size-24 rounded-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card>
            <CardContent className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-[auto_1fr]">
              <div className="lg:border-e lg:border-border lg:pe-6">
                <AvatarSection avatarUrl={profile.avatarUrl} />
              </div>
              <div>
                <h2 className="mb-4 text-base font-semibold">Personal Details</h2>
                <PersonalDetailsForm
                  email={profile.email}
                  fullName={profile.fullName}
                  phoneNumber={profile.phoneNumber}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Security</CardTitle>
              </CardHeading>
            </CardHeader>
            <CardContent className="py-6">
              <ChangePasswordSection />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
