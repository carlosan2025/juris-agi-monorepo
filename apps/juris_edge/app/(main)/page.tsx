'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MainPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mandates');
  }, [router]);

  return null;
}
