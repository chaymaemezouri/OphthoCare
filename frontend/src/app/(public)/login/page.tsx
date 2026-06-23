'use client';

import { Suspense } from 'react';
import { LoginFlow } from '@/components/marketing/login-flow';
import { LoadingSpinner } from '@/components/common/alerts';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center bg-slate-100 sm:min-h-[calc(100svh-4rem)]">
          <LoadingSpinner />
        </div>
      }
    >
      <LoginFlow />
    </Suspense>
  );
}
