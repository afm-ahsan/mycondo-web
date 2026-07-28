import { AppRouting } from '@/routing/app-routing';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { LoadingBarContainer } from 'react-top-loading-bar';
import { Toaster } from '@/components/ui/sonner';
import { useSessionBootstrap } from '@/features/auth/hooks/useSessionBootstrap';
import { I18nProvider } from './providers/i18n-provider';
import { ModulesProvider } from './providers/modules-provider';
import { QueryProvider } from './providers/query-provider';
import { SettingsProvider } from './providers/settings-provider';
import { ThemeProvider } from './providers/theme-provider';
import { TooltipsProvider } from './providers/tooltips-provider';

const { BASE_URL } = import.meta.env;

export function App() {
  // Attempts a silent session restore (mycondo_rt cookie) before any protected route renders —
  // replaces the old Supabase AuthProvider's role. Must run inside ReduxProvider (main.tsx).
  useSessionBootstrap();

  return (
    <SettingsProvider>
      <ThemeProvider>
        <I18nProvider>
          <HelmetProvider>
            <TooltipsProvider>
              <QueryProvider>
                <LoadingBarContainer>
                  <BrowserRouter basename={BASE_URL}>
                    <Toaster />
                    <ModulesProvider>
                      <AppRouting />
                    </ModulesProvider>
                  </BrowserRouter>
                </LoadingBarContainer>
              </QueryProvider>
            </TooltipsProvider>
          </HelmetProvider>
        </I18nProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}
