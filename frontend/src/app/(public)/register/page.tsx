'use client';

import { Suspense } from 'react';
import { RegisterPatientFlow } from '@/components/marketing/register-patient-flow';
import { LoadingSpinner } from '@/components/common/alerts';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center bg-gradient-to-b from-white to-[#F8F8F6] sm:min-h-[calc(100svh-4rem)]">
          <LoadingSpinner />
        </div>
      }
    >
      <RegisterPatientFlow />
    </Suspense>
  );
}
