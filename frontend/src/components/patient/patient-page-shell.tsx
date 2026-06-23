import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { patientPageClass } from '@/components/patient/patient-dashboard-shell';

export function PatientPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={patientPageClass(className)}>{children}</div>;
}
