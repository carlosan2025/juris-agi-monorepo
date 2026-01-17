'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root page - redirects to company level
 * First-time users go to setup, returning users go to company dashboard
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to company level - the company layout will handle
    // checking if setup is complete
    router.replace('/company');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
