'use client';

import { ReactNode } from 'react';
import { CompanySidebar } from './CompanySidebar';
import { CompanyTopBar } from './CompanyTopBar';

interface CompanyLayoutProps {
  children: ReactNode;
}

export function CompanyLayout({ children }: CompanyLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Fixed sidebar */}
      <CompanySidebar className="flex-shrink-0" />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <CompanyTopBar />

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
