import { Suspense } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { lazyPage } from './lazyPage';

function FakePageA() {
  return <div>Page A content</div>;
}

function FakePageB() {
  return <div>Page B content</div>;
}

async function fakeBarrel() {
  return { FakePageA, FakePageB };
}

describe('lazyPage', () => {
  it('resolves the named export and renders it once the dynamic import settles', async () => {
    const LazyA = lazyPage(fakeBarrel, 'FakePageA');

    render(
      <Suspense fallback={<div>Loading…</div>}>
        <LazyA />
      </Suspense>,
    );

    expect(await screen.findByText('Page A content')).toBeInTheDocument();
  });

  it('resolves a different named export from the same loader independently', async () => {
    const LazyB = lazyPage(fakeBarrel, 'FakePageB');

    render(
      <Suspense fallback={<div>Loading…</div>}>
        <LazyB />
      </Suspense>,
    );

    expect(await screen.findByText('Page B content')).toBeInTheDocument();
    expect(screen.queryByText('Page A content')).not.toBeInTheDocument();
  });
});
