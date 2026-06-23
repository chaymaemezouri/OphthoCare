import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PATIENT_CARD, PATIENT_CARD_PAD } from '@/components/patient/patient-dashboard-shell';

type PatientPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  /** Bandeau compact pour sous-pages denses */
  variant?: 'default' | 'compact';
};

export function PatientPageHeader({
  title,
  description,
  actions,
  className,
  variant = 'default',
}: PatientPageHeaderProps) {
  const compact = variant === 'compact';

  return (
    <div
      className={cn(
        PATIENT_CARD,
        compact ? 'px-5 py-4 sm:px-6' : PATIENT_CARD_PAD,
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Espace patient</p>
        <h1 className={cn('font-semibold tracking-tight text-slate-900', compact ? 'text-xl' : 'text-2xl sm:text-[1.65rem]')}>
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
