import { cn } from '@/lib/utils';
import { DOCTOR_CARD } from '@/components/doctor/doctor-dashboard-shell';

type DoctorStatCardProps = {
  label: string;
  value: string;
  detail?: string;
  highlight?: boolean;
  className?: string;
};

/** Indicateur chiffré — lisible en un coup d’œil, sans icône décorative */
export function DoctorStatCard({ label, value, detail, highlight, className }: DoctorStatCardProps) {
  return (
    <div className={cn(DOCTOR_CARD, 'flex flex-col justify-between px-4 py-3.5', className)}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums tracking-tight',
          highlight ? 'text-cyan-700' : 'text-slate-900',
        )}
      >
        {value}
      </p>
      {detail ? <p className="mt-0.5 text-[11px] text-slate-400">{detail}</p> : null}
    </div>
  );
}
