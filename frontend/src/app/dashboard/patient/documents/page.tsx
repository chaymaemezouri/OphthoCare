'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, RefreshCw } from 'lucide-react';
import { useRequireAuth } from '@/hooks/use-auth';
import { patientsApi } from '@/lib/api';
import { PatientPageHeader } from '@/components/patient/patient-page-header';
import { PatientPageShell } from '@/components/patient/patient-page-shell';
import { PATIENT_CARD } from '@/components/patient/patient-dashboard-shell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/alerts';

type DocItem =
  | {
      id: string;
      title: string;
      url: string;
      kind: string;
      sourceType: 'consultation' | 'medical_record';
      sourceId: string;
      specialtyCode?: string;
      createdAt: string;
    }
  | {
      id: string;
      title: string;
      kind: string;
      sourceType: 'prescription_ref';
      sourceId: string;
      specialtyCode?: string;
      createdAt: string;
      ref: string;
    };

export default function PatientDocumentsPage() {
  useRequireAuth();
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await patientsApi.getMyDocumentItems();
      setItems(data.items as DocItem[]);
    } catch {
      setError('Impossible de charger vos documents.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <PatientPageShell className="space-y-6">
      <PatientPageHeader
        variant="compact"
        title="Mes documents"
        description="Pièces partagées par le cabinet (liens sécurisés), ordonnances référencées et pièces indexées dans vos consultations ou notes de dossier."
        actions={
          <Button type="button" variant="outline" size="sm" className="rounded-lg border-zinc-200" onClick={() => void load()}>
            <RefreshCw className="mr-1.5 h-4 w-4 opacity-80" aria-hidden />
            Actualiser
          </Button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-200/80 bg-red-50/95 px-4 py-3 text-sm text-red-900">
          {error}{' '}
          <button type="button" className="font-semibold underline underline-offset-2" onClick={() => void load()}>
            Réessayer
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100/90" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300/80 bg-white px-6 py-14 text-center shadow-sm">
          <EmptyState message="Aucun document indexé pour l’instant." />
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-zinc-500">
            Les cabinets peuvent attacher des fichiers dans la synthèse de consultation (`patientDocuments` ou `attachments`
            dans les données structurées). Les références d’ordonnances liées à une consultation apparaissent aussi ici.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-6 rounded-lg border-zinc-200">
            <Link href="/dashboard/patient/medical-records">Voir le dossier médical</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((d) => (
            <li
              key={d.id}
              className="flex flex-col gap-2 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                  <FileText className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">{d.title}</p>
                  <p className="text-xs text-zinc-500">
                    {d.sourceType === 'consultation' && 'Consultation'}
                    {d.sourceType === 'medical_record' && 'Note dossier'}
                    {d.sourceType === 'prescription_ref' && 'Ordonnance (référence)'}
                    {d.specialtyCode ? ` · ${d.specialtyCode}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {'url' in d && d.url ? (
                  <Button variant="outline" size="sm" className="rounded-lg border-zinc-200" asChild>
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                      Ouvrir
                      <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-zinc-400">Pas de lien direct</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PatientPageShell>
  );
}
