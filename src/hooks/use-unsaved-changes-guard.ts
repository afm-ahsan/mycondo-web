import { useEffect } from 'react';

/**
 * Warns before an in-progress form's changes are lost. Covers what a classic `<BrowserRouter>` setup
 * (no data router / `useBlocker`) can actually support:
 * - tab close, refresh, and typing a new URL — native `beforeunload`.
 * - the browser Back/Forward buttons — a sentinel history entry + `popstate`, using `window.confirm`
 *   (synchronous, so it can interrupt the URL change before it commits — an async/styled dialog
 *   can't do that here, which is also why `beforeunload` itself can't show custom UI).
 *
 * Does NOT cover in-app navigation (clicking a sidebar link, a breadcrumb, `navigate()` elsewhere in
 * the app) — that needs React Router's `useBlocker`, which requires migrating off `<BrowserRouter>`
 * to a data router (`createBrowserRouter`/`RouterProvider`), a separate, larger change tracked as a
 * follow-up rather than attempted here.
 *
 * Only pass `isDirty: true` once the form has a real unsaved change — flip it back to `false` right
 * after a successful submit/reset so a post-save redirect doesn't trigger the warning.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Chrome requires returnValue to be set; the string itself is never shown to the user —
      // every modern browser renders its own fixed "leave site?" wording regardless.
      event.returnValue = '';
    }

    function handlePopState() {
      const confirmed = window.confirm('You have unsaved changes. Leave this page?');
      if (confirmed) {
        window.removeEventListener('popstate', handlePopState);
        window.history.back();
      } else {
        window.history.pushState(null, '', window.location.href);
      }
    }

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty]);
}
