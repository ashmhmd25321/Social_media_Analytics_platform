'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import TopNav from './TopNav';
import MobileNav from './MobileNav';

type Props = {
  children: ReactNode;
};

const shouldHideNav = (pathname?: string | null) => {
  if (!pathname) return false;
  return pathname.startsWith('/auth');
};

export default function AppFrame({ children }: Props) {
  const pathname = usePathname();
  const hideNav = shouldHideNav(pathname);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {!hideNav && <TopNav />}
      {!hideNav && <MobileNav />}
      <main
        id="main-content"
        role="main"
        className={`${hideNav ? '' : 'pt-6 pb-10 md:pt-8 lg:pt-10'} px-4 sm:px-6 lg:px-8`}
      >
        {children}
      </main>
    </div>
  );
}


