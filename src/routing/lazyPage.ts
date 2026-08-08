import { lazy, type ComponentType } from 'react';

/**
 * Wraps `React.lazy` for a single named export out of a feature's barrel module, instead of
 * requiring every route to have its own default-exported file. Every `lazyPage(loader, 'X')` call
 * for the same `loader` module specifier resolves to the same dynamic import, so Vite/Rollup emits
 * one chunk per feature barrel (route-level splitting) rather than one chunk per page.
 */
export function lazyPage<TModule extends Record<string, unknown>, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  key: TKey,
): TModule[TKey] extends ComponentType<infer TProps>
  ? React.LazyExoticComponent<ComponentType<TProps>>
  : never {
  return lazy(async () => {
    const module = await loader();
    return { default: module[key] as ComponentType<unknown> };
  }) as never;
}
