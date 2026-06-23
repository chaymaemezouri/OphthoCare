'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { appointmentsApi, specialtiesApi } from '@/lib/api';
import { useRequireAuth } from '@/hooks/use-auth';
import { SpecialtyFormRenderer } from '@/components/medical/SpecialtyFormRenderer';
import type { SpecialtyField } from '@/lib/medical/specialty-field.types';
import { PatientPageHeader } from '@/components/patient/patient-page-header';
import { PatientPageShell } from '@/components/patient/patient-page-shell';
import { PATIENT_CARD } from '@/components/patient/patient-dashboard-shell';
import { patientPageClass } from '@/components/patient/patient-dashboard-shell';
import { Button } from '@/components/ui/button';

function isSpecialtyFieldArray(v: unknown): v is SpecialtyField[] {
  return (
    Array.isArray(v) &&
    v.every(
      (x) =>
        x &&
        typeof x === 'object' &&
        typeof (x as SpecialtyField).key === 'string' &&
        typeof (x as SpecialtyField).label === 'string' &&
        typeof (x as SpecialtyField).type === 'string',
    )
  );
}

export default function PatientPreConsultationPage() {
  useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const appointmentId = typeof params?.appointmentId === 'string' ? params.appointmentId : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<Awaited<ReturnType<typeof appointmentsApi.getPatientPreConsultation>> | null>(
    null,
  );
  const [fields, setFields] = useState<SpecialtyField[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const load = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true);
    setError(null);
    setSavedOk(false);
    try {
      const pre = await appointmentsApi.getPatientPreConsultation(appointmentId);
      setState(pre);
      const tpl = await specialtiesApi.getTemplate(pre.specialtyCode);
      const f = tpl.fields;
      setFields(isSpecialtyFieldArray(f) ? f : []);
    } catch {
      setError('Impossible de charger ce rendez-vous ou le questionnaire.');
      setState(null);
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const preForm = useMemo(
    () => (state?.form ? { responses: state.form.responses } : null),
    [state?.form],
  );

  const readOnly = Boolean(state && !state.editable);
  const noCabinet = Boolean(state && !String(state.doctorSpaceId ?? '').trim());

  const onSubmit = async (data: Record<string, unknown>) => {
    if (!appointmentId || !state?.editable) return;
    setSaveError(null);
    setSavedOk(false);
    try {
      const out = await appointmentsApi.putPatientPreConsultation(appointmentId, { responses: data });
      setState((prev) =>
        prev
          ? {
              ...prev,
              form: out.form,
            }
          : prev,
      );
      setSavedOk(true);
    } catch {
      setSaveError('Enregistrement impossible. Réessayez ou contactez le cabinet.');
    }
  };

  if (!appointmentId) {
    return (
      <PatientPageShell>
        <p className="text-sm text-slate-600">Identifiant de rendez-vous manquant.</p>
        <Button asChild variant="outline" className="mt-4 rounded-lg">
          <Link href="/dashboard/patient/bookings">Retour aux rendez-vous</Link>
        </Button>
      </PatientPageShell>
    );
  }

  if (loading) {
    return (
      <PatientPageShell className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-slate-50" />
      </PatientPageShell>
    );
  }

  if (error || !state) {
    return (
      <PatientPageShell className="space-y-6">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error ?? 'Erreur inattendue.'}
        </p>
        <Button type="button" variant="outline" className="rounded-lg" onClick={() => router.push('/dashboard/patient/bookings')}>
          Retour aux rendez-vous
        </Button>
      </PatientPageShell>
    );
  }

  return (
    <PatientPageShell className="space-y-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 h-9 gap-1.5 rounded-lg text-slate-600 hover:text-slate-900"
          onClick={() => router.push('/dashboard/patient/bookings')}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Mes rendez-vous
        </Button>

        <PatientPageHeader
          variant="compact"
          title="Pré-consultation"
          description="Questionnaire avant la visite — les réponses sont transmises au cabinet pour préparer votre consultation."
        />

        {noCabinet && state.editable ? (
          <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            Ce rendez-vous n’est pas relié à un cabinet dans le système : la pré-consultation en ligne n’est pas
            disponible. Contactez le secrétariat si besoin.
          </div>
        ) : null}

        {readOnly ? (
          <p className="rounded-xl border border-zinc-200/80 bg-zinc-50/90 px-4 py-3 text-sm text-zinc-700">
            Ce rendez-vous ne permet plus la modification du questionnaire (statut ou date passée).
          </p>
        ) : null}

        {savedOk ? (
          <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
            Vos réponses ont été enregistrées. Vous pouvez revenir les modifier tant que le rendez-vous est à venir.
          </p>
        ) : null}

        {saveError ? (
          <p className="rounded-xl border border-red-200/80 bg-red-50/95 px-4 py-3 text-sm text-red-900">{saveError}</p>
        ) : null}

        {fields.length === 0 ? (
          <p className="text-sm text-zinc-600">Aucun champ de questionnaire n’est défini pour cette spécialité.</p>
        ) : (
          <div className={PATIENT_CARD + ' p-5 sm:p-6'}>
            <SpecialtyFormRenderer
              fields={fields}
              preConsultationForm={preForm}
              readOnly={readOnly || noCabinet}
              onSubmit={onSubmit}
              submitLabel="Enregistrer ma pré-consultation"
            />
          </div>
        )}
    </PatientPageShell>
  );
}
