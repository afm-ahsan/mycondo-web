import { Link, Outlet } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';

export function ClassicLayout() {
  return (
    <>
      <style>
        {`
          .page-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10.png')}');
          }
          .dark .page-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10-dark.png')}');
          }
        `}
      </style>
      <main className="flex flex-col items-center justify-center grow bg-center bg-no-repeat page-bg">
        <div className="m-5 mb-6 flex flex-col items-center gap-2">
          <Link to="/">
            <img
              src={toAbsoluteUrl('/media/app/condobd-logo.png')}
              className="h-16 w-auto max-w-none"
              alt="CondoBD"
            />
          </Link>
          <span className="bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 bg-clip-text text-lg font-semibold text-transparent">
            Akter Residence Park
          </span>
        </div>
        <Card className="w-full max-w-[400px]">
          <CardContent className="p-6">
            <Outlet />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
