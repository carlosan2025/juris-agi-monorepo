'use client';

import { JurisAdminProvider } from '@/contexts/JurisAdminContext';

export default function AdministrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <JurisAdminProvider>
      {children}
    </JurisAdminProvider>
  );
}
