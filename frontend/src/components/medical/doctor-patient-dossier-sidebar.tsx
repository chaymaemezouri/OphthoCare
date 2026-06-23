'use client';

import Link from 'next/link';
import { AlertTriangle, CalendarPlus, ChevronLeft, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DOCTOR_OUTLINE_BTN, DOCTOR_PRIMARY_BTN } from '@/components/doctor/doctor-dashboard-shell';
import type { Patient } from '@/types/patient';

function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

type Props = {
  patient: Patient;
  displayName: string;
  listPath: string;
  loading?: boolean;
  onRefresh: () => void;
  apptCount: number;
  clinicalCount: number;
};

export function DoctorPatientDossierSidebar({
  patient,
  displayName,
  listPath,
  loading,
  onRefresh,
  apptCount,
  clinicalCount,
}: Props) {
  const age = ageFromDob(patient.dateOfBirth);
  const allergies = patient.medicalData?.allergies ?? [];
  const chronic = patient.medicalData?.chronicDiseases ?? [];
  const diagnoses = (patient.diagnoses as { code: string; label: string }[] | undefined) ?? [];
  const hasAllergyAlert = allergies.length > 0;

  return (
    <aside className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">{displayName}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {age != null ? `${age} ans` : 'Âge non renseigné'}
            {patient.dateOfBirth ? ` · né(e) le ${patient.dateOfBirth}` : ''}
          </p>
        </div>

        <div className="space-y-3 px-4 py-3 text-sm">
          {patient.user?.email ? (
            <p className="flex items-start gap-2 text-xs text-slate-600">
              <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="break-all">{patient.user.email}</span>
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2 border-y border-slate-100 py-3">
            <div>
              <p className="text-[10px] font-medium uppercase text-slate-400">RDV</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900">{apptCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase text-slate-400">Notes</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900">{clinicalCount}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Allergies</p>
            {hasAllergyAlert ? (
              <p className="mt-1 flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-950">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {allergies.join(', ')}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-600">Aucune allergie connue</p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Antécédents</p>
            <p className="mt-1 text-xs text-slate-700">{chronic.length ? chronic.join(', ') : 'Non renseignés'}</p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Diagnostics (CIM-10)</p>
            {diagnoses.length ? (
              <ul className="mt-1 space-y-1">
                {diagnoses.map((d) => (
                  <li key={d.code} className="text-xs text-slate-700">
                    <span className="font-medium text-slate-900">{d.code}</span> — {d.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-slate-600">—</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button size="sm" className={DOCTOR_PRIMARY_BTN} asChild>
          <Link href={`/dashboard/medecin/agenda?patientId=${patient.id}`}>
            <CalendarPlus className="mr-1.5 h-4 w-4" />
            Planifier un RDV
          </Link>
        </Button>
        <Button size="sm" variant="outline" className={DOCTOR_OUTLINE_BTN} disabled={loading} onClick={onRefresh}>
          <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
          Actualiser
        </Button>
        <Button size="sm" variant="ghost" className="justify-start text-slate-600" asChild>
          <Link href={listPath}>
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </div>
    </aside>
  );
}
