import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DoctorPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  meta?: ReactNode;
  variant?: 'default' | 'compact';
  /** Sans bordure basse — pour pages déjà encadrées */
  borderless?: boolean;
};

export function DoctorPageHeader({
  title,
  description,
  actions,
  className,
  meta,
  variant = 'default',
  borderless = false,
}: DoctorPageHeaderProps) {
  const compact = variant === 'compact';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        !borderless && 'border-b border-slate-200 pb-4',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {meta ? <div className="text-xs text-slate-500">{meta}</div> : null}
        <h1
          className={cn(
            'font-semibold tracking-tight text-slate-900',
            compact ? 'text-lg' : 'text-xl sm:text-2xl',
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
