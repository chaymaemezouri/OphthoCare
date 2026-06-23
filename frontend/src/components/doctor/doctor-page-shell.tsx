import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { doctorPageClass } from '@/components/doctor/doctor-dashboard-shell';

export function DoctorPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={doctorPageClass(className)}>{children}</div>;
}
