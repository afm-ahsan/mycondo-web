import '@testing-library/jest-dom/vitest';
import 'vitest-axe/extend-expect';
import { configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';
import { server } from './server';

expect.extend(axeMatchers);

// Testing Library's own findBy*/waitFor retry window (default 1000ms) is independent of Vitest's
// testTimeout and was the actual cause of sporadic full-suite failures (Template 6 test-infrastructure
// investigation) — under real CPU load, a genuinely-passing assertion can still lose the race against
// this fixed window well before Vitest's own timeout would fire.
configure({ asyncUtilTimeout: 5000 });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// jsdom doesn't implement these, but Radix's `Select` (used by BuildingSelect/FlatSelect/GateSelect
// and any other shadcn Select-based field) calls them when opening/closing its popover — without
// these no-op polyfills, userEvent.click on a SelectTrigger throws in every feature test that uses it.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom doesn't implement ResizeObserver either, and `cmdk`'s `Command` (used by ResidentSelect and
// the pre-existing, previously-untested country-combobox.tsx) calls it on mount — same rationale as
// the pointer-capture polyfills above.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom doesn't implement URL.createObjectURL/revokeObjectURL either, and useAvatarUrl (My Profile's
// avatar fetch/preview) calls both — same rationale as the polyfills above.
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock-object-url';
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}

// jsdom doesn't implement window.matchMedia either, and useIsMobile (used by the app shell's
// Header/Sidebar) calls it on mount to detect the responsive breakpoint.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}
