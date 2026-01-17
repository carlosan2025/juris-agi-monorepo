'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { CompanyLayout } from '@/components/layout/CompanyLayout';
import { AppLayout } from '@/components/layout/AppLayout';

export default function CompanyRouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Setup page has its own layout (no sidebar)
  const isSetupPage = pathname === '/company/setup';

  // Check if we're inside a specific portfolio (fund/book/pipeline)
  // Match paths like /company/portfolios/[id] or /company/portfolios/[id]/anything
  const portfolioMatch = pathname.match(/^\/company\/portfolios\/([^/]+)(\/.*)?$/);
  const isInsidePortfolio = portfolioMatch && portfolioMatch[1] !== 'new';

  if (isSetupPage) {
    return (
      <NavigationProvider>
        {children}
      </NavigationProvider>
    );
  }

  // Use AppLayout (with fund-specific sidebar) when inside a portfolio
  if (isInsidePortfolio) {
    return (
      <NavigationProvider>
        <AppLayout>
          {children}
        </AppLayout>
      </NavigationProvider>
    );
  }

  return (
    <NavigationProvider>
      <CompanyLayout>
        {children}
      </CompanyLayout>
    </NavigationProvider>
  );
}
