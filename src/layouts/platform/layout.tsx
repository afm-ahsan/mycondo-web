import { Suspense, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Outlet } from 'react-router-dom';
import { Container } from '@/components/common/container';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/providers/settings-provider';
import { Footer } from '@/layouts/demo1/components/footer';
import { PlatformHeader } from './components/header';
import { PlatformSidebar } from './components/sidebar';

// Reuses the same "demo1" layout-style body classes/settings as the tenant shell (Metronic's classic
// sidebar+header shell) — that's a layout-style identifier, not a tenant/auth boundary, so it's
// correct to reuse for Platform too rather than adding a parallel settings namespace for one boolean.
export function PlatformLayout() {
  const isMobile = useIsMobile();
  const { settings, setOption } = useSettings();

  useEffect(() => {
    const bodyClass = document.body.classList;

    if (settings.layouts.demo1.sidebarCollapse) {
      bodyClass.add('sidebar-collapse');
    } else {
      bodyClass.remove('sidebar-collapse');
    }
  }, [settings]);

  useEffect(() => {
    setOption('layout', 'demo1');
  }, [setOption]);

  useEffect(() => {
    const bodyClass = document.body.classList;

    bodyClass.add('demo1');
    bodyClass.add('sidebar-fixed');
    bodyClass.add('header-fixed');

    const timer = setTimeout(() => {
      bodyClass.add('layout-initialized');
    }, 1000);

    return () => {
      bodyClass.remove('demo1');
      bodyClass.remove('sidebar-fixed');
      bodyClass.remove('sidebar-collapse');
      bodyClass.remove('header-fixed');
      bodyClass.remove('layout-initialized');
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Platform Administration</title>
      </Helmet>

      {!isMobile && <PlatformSidebar />}

      <div className="wrapper flex grow flex-col">
        <PlatformHeader />

        <main className="grow pt-5">
          <Container width="fluid" className="pb-5">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </Container>
        </main>

        <Footer />
      </div>
    </>
  );
}
