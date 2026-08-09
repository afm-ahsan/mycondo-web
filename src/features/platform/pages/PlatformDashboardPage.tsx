import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setPlatformAccessToken } from '@/api/platformBaseApi';
import { platformSessionEnded } from '@/store/slices/platformAuthSlice';
import { useListOrganizationsQuery, usePlatformLogout } from '../api/platformAuthApi';

/**
 * The minimum Phase 1 shell to prove the Platform flow end-to-end — not a Platform Admin UI (that is
 * explicitly out of scope for this phase). Shows who's logged in and the organization list
 * (/api/v1/platform/organizations), which also proves the platform.organization.read permission
 * check and the Platform authentication scheme are both working over a real HTTP round trip.
 */
export function PlatformDashboardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.platformAuth.user);
  const [logout, { isLoading: isLoggingOut }] = usePlatformLogout();
  const { data: organizations, isLoading, isError } = useListOrganizationsQuery();

  async function handleLogout() {
    try {
      await logout().unwrap();
    } finally {
      setPlatformAccessToken(null);
      dispatch(platformSessionEnded());
      navigate('/platform/login');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Platform Administration</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user?.displayName} ({user?.email})
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
          Sign out
        </Button>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Organizations</h2>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {isError && <p className="text-sm text-destructive">Failed to load organizations.</p>}
        {organizations && organizations.length === 0 && (
          <p className="text-sm text-muted-foreground">No organizations yet.</p>
        )}
        {organizations && organizations.length > 0 && (
          <ul className="divide-y rounded-md border">
            {organizations.map((org) => (
              <li key={org.tenantId} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{org.name}</span>
                <span className="text-muted-foreground">{org.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
