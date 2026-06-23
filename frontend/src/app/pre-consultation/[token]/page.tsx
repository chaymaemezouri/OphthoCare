'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Loader2, Stethoscope } from 'lucide-react';
import { fetchPublicPreConsult, submitPublicPreConsult } from '@/lib/api/public-pre-consultation';
import type { PublicPreConsultState } from '@/lib/api/public-pre-consultation';
import { SpecialtyFormRenderer } from '@/components/medical/SpecialtyFormRenderer';
import type { SpecialtyField } from '@/lib/medical/specialty-field.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PublicPreConsultationPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<PublicPreConsultState | null>(null);
  const [fields, setFields] = useState<SpecialtyField[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPublicPreConsult(token);
      setState(data);
      setFields(Array.isArray(data.template.fields) ? data.template.fields : []);
      setDone(data.form.submitted);
    } catch {
      setError('Ce lien est invalide, expiré ou le rendez-vous ne permet plus la saisie.');
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (responses: Record<string, unknown>) => {
    if (!token || !state?.editable) return;
    setSubmitError(null);
    try {
      await submitPublicPreConsult(token, responses);
      setDone(true);
      await load();
    } catch {
      setSubmitError('Envoi impossible. Réessayez ou contactez le cabinet.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Questionnaire pré-consultation</h1>
            <p className="text-sm text-slate-500">OphthoCare — sans connexion requise</p>
          </div>
        </div>

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </p>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-sm text-red-800">{error}</CardContent>
          </Card>
        ) : state ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{state.doctorName}</CardTitle>
              <CardDescription>
                {state.specialtyName} — rendez-vous le{' '}
                {new Date(state.appointmentStart).toLocaleString('fr-FR', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {done ? (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Merci, votre questionnaire a bien été enregistré. Vous pouvez fermer cette page.
                  </p>
                </div>
              ) : null}

              {fields.length > 0 ? (
                <SpecialtyFormRenderer
                  fields={fields}
                  defaultValues={state.form.responses}
                  readOnly={!state.editable || done}
                  submitLabel="Envoyer le questionnaire"
                  onSubmit={onSubmit}
                />
              ) : (
                <p className="text-sm text-amber-800">Gabarit indisponible.</p>
              )}

              {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}

              {!state.editable && !done ? (
                <p className="text-sm text-slate-600">
                  Ce rendez-vous n&apos;accepte plus de modifications en ligne.
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
