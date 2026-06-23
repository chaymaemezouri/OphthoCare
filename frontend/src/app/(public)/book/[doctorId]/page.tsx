'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { BookDoctorFlow } from '@/components/marketing/book-doctor-flow';
import { LoadingSpinner } from '@/components/common/alerts';

function BookPageInner() {
  const params = useParams();
  const doctorId = typeof params?.doctorId === 'string' ? params.doctorId : '';

  if (!doctorId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-[#F8F8F6] px-4 text-[#77777D]">
        Lien de réservation invalide.
      </div>
    );
  }

  return <BookDoctorFlow doctorId={doctorId} />;
}

export default function BookDoctorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-[#F8F8F6]">
          <LoadingSpinner />
        </div>
      }
    >
      <BookPageInner />
    </Suspense>
  );
}
