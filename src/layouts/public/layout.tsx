import { Outlet } from 'react-router-dom';
import { PublicFooter } from './components/public-footer';
import { PublicHeader } from './components/public-header';

export function PublicLayout() {
  return (
    <div className="flex flex-col grow bg-background">
      <PublicHeader />
      <main className="grow">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
