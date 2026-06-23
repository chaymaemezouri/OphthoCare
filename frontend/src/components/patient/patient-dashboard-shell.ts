import { cn } from '@/lib/utils';

/** Padding page — pleine largeur, pas de max-width */
export const PATIENT_PAGE = 'w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12';

export const PATIENT_PAGE_BOTTOM = 'pb-24 md:pb-8';

export function patientPageClass(extra?: string) {
  return cn(PATIENT_PAGE, PATIENT_PAGE_BOTTOM, extra);
}

/** Carte dashboard standard */
export const PATIENT_CARD =
  'rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

export const PATIENT_CARD_PAD = 'p-5 sm:p-6';

export const PATIENT_SECTION_TITLE =
  'text-xs font-semibold uppercase tracking-wider text-slate-500';

export const PATIENT_MUTED = 'text-sm text-slate-600';

export const PATIENT_PRIMARY_BTN =
  'rounded-lg bg-blue-600 font-medium text-white shadow-sm hover:bg-blue-700';

export const PATIENT_OUTLINE_BTN =
  'rounded-lg border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50';
