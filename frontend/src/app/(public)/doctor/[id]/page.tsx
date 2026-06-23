'use client';

import { useParams } from 'next/navigation';
import { DoctorPublicProfileView } from '@/components/marketing/doctor-public-profile';

export default function DoctorDetailPage() {
  const routeParams = useParams();
  const id = typeof routeParams?.id === 'string' ? routeParams.id : '';

  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-[#F8F8F6] text-[#77777D]">
        Identifiant médecin manquant.
      </div>
    );
  }

  return <DoctorPublicProfileView doctorId={id} />;
}
