'use client';

import dynamic from 'next/dynamic';
import type { Doctor } from '@/types';

const DoctorsMapInner = dynamic(() => import('./doctors-map-inner'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full animate-pulse rounded-[24px] bg-[#F0F0F0]" />,
});

export function DoctorsMap({ doctors }: { doctors: Doctor[] }) {
  return <DoctorsMapInner doctors={doctors} />;
}
