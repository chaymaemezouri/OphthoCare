import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PATIENT_CARD } from '@/components/patient/patient-dashboard-shell';

type PatientStatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  accent?: 'blue' | 'amber' | 'emerald' | 'slate';
  className?: string;
};

const ACCENTS = {
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  slate: 'bg-slate-100 text-slate-700',
};

export function PatientStatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  accent = 'blue',
  className,
}: PatientStatCardProps) {
  const inner = (
    <div className={cn(PATIENT_CARD, 'flex h-full items-start gap-4 p-5 transition hover:border-slate-300', className)}>
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', ACCENTS[accent])}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full outline-offset-2">
        {inner}
      </Link>
    );
  }

  return inner;
}
