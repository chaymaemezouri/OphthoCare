import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DOCTOR_CARD, DOCTOR_SECTION_META, DOCTOR_SECTION_TITLE } from '@/components/doctor/doctor-dashboard-shell';

type DoctorSectionProps = {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
};

export function DoctorSection({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  padded = false,
}: DoctorSectionProps) {
  return (
    <section className={cn(DOCTOR_CARD, 'overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
        <div>
          <h2 className={DOCTOR_SECTION_TITLE}>{title}</h2>
          {description ? <p className={cn(DOCTOR_SECTION_META, 'mt-0.5')}>{description}</p> : null}
        </div>
        {action ? (
          <Link href={action.href} className="shrink-0 text-xs font-medium text-cyan-700 hover:text-cyan-800">
            {action.label}
          </Link>
        ) : null}
      </div>
      <div className={cn(padded && 'p-4 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  );
}
