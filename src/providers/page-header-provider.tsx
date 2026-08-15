import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface PageHeaderCrumb {
  label: string;
  path?: string;
}

interface PageHeaderContextValue {
  crumbs: PageHeaderCrumb[];
  setCrumbs: (crumbs: PageHeaderCrumb[]) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | undefined>(undefined);

function crumbsEqual(a: PageHeaderCrumb[], b: PageHeaderCrumb[]) {
  return a.length === b.length && a.every((crumb, i) => crumb.label === b[i].label && crumb.path === b[i].path);
}

/**
 * Bridges page-level breadcrumb data (declared via <PageHeader crumbs={...}> deep inside a route)
 * up to the global app header, which renders the breadcrumb in the header's left-side context slot
 * rather than duplicating it in page content. Bails out of the state update when the incoming crumbs
 * are content-equal to avoid re-rendering the header on every page re-render (pages often pass a new
 * array literal each render).
 */
export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbsState] = useState<PageHeaderCrumb[]>([]);

  const setCrumbs = useCallback((next: PageHeaderCrumb[]) => {
    setCrumbsState((prev) => (crumbsEqual(prev, next) ? prev : next));
  }, []);

  const value = useMemo(() => ({ crumbs, setCrumbs }), [crumbs, setCrumbs]);

  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeaderContext() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error('usePageHeaderContext must be used within a PageHeaderProvider');
  }
  return ctx;
}
