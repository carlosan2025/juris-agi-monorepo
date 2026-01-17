'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to portfolios by default (accessible to all users)
    router.replace('/company/portfolios');
  }, [router]);

  return null;
}
