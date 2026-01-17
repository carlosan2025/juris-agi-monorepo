'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { ActiveContextProvider } from '@/contexts/ActiveContext';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ActiveContextProvider>
          {children}
        </ActiveContextProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
