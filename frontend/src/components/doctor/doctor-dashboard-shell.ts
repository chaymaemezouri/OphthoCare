import { cn } from '@/lib/utils';

export const DOCTOR_PAGE = 'w-full px-4 py-5 sm:px-6 lg:px-8 xl:px-10';

export function doctorPageClass(extra?: string) {
  return cn(DOCTOR_PAGE, extra);
}

/** Carte sobre — bordure nette, peu d’ombre */
export const DOCTOR_CARD = 'rounded-lg border border-slate-200 bg-white';

export const DOCTOR_CARD_PAD = 'p-4 sm:p-5';

export const DOCTOR_SECTION_TITLE = 'text-sm font-semibold text-slate-900';

export const DOCTOR_SECTION_META = 'text-xs text-slate-500';

export const DOCTOR_MUTED = 'text-sm text-slate-600';

export const DOCTOR_PRIMARY_BTN =
  'rounded-md bg-slate-800 font-medium text-white hover:bg-slate-900';

export const DOCTOR_ACCENT_BTN =
  'rounded-md bg-cyan-700 font-medium text-white hover:bg-cyan-800';

export const DOCTOR_OUTLINE_BTN =
  'rounded-md border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

export const DOCTOR_ACCENT = 'text-cyan-700';

export const DOCTOR_ACCENT_BORDER = 'border-l-[3px] border-cyan-600';

export const DOCTOR_NAV_ACTIVE =
  'border-l-[3px] border-cyan-600 bg-slate-50 text-slate-900 font-medium';

export const DOCTOR_NAV_IDLE =
  'border-l-[3px] border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900';

export const DOCTOR_STATUS = {
  pending: 'bg-amber-50 text-amber-900 border-amber-200',
  confirmed: 'bg-slate-50 text-slate-800 border-slate-200',
  in_progress: 'bg-cyan-50 text-cyan-900 border-cyan-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  default: 'bg-slate-50 text-slate-700 border-slate-200',
} as const;
