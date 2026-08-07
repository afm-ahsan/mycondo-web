import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

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
