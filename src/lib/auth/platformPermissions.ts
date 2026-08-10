import type { PlatformAuthUser } from '@/store/slices/platformAuthSlice';

/** Platform-scope analogue of hasPermission (permissions.ts) — no building-scoped variant exists,
 * since Platform SuperAdmin is deliberately not tenant-scoped and has nothing to scope by. */
export function hasPlatformPermission(user: PlatformAuthUser | null, permission: string): boolean {
  return user?.permissions.includes(permission) ?? false;
}
