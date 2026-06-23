'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt, RefreshCw } from 'lucide-react';
import { useRequireAuth } from '@/hooks/use-auth';
import { patientsApi } from '@/lib/api';
import { PatientPageHeader } from '@/components/patient/patient-page-header';
import { PatientPageShell } from '@/components/patient/patient-page-shell';
import { PATIENT_CARD } from '@/components/patient/patient-dashboard-shell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/alerts';
import { formatShortDate } from '@/lib/utils/date';

type ReceiptRow = {
  receiptId: string;
  consultationId: string;
  amount: number;
  currency: string;
  createdAt: string;
  closedAt: string | null;
  specialtyCode: string;
  doctorDisplayName: string;
};

export default function PatientReceiptsPage() {
  useRequireAuth();
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await patientsApi.getMyReceipts();
      setRows(data);
    } catch {
      setError('Impossible de charger vos reçus.');
      setRows([]);
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
        title="Mes reçus & factures"
        description="Reçus d’honoraires émis à la clôture d’une consultation. Le détail reste disponible dans chaque consultation du dossier."
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
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100/90" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300/80 bg-white px-6 py-14 text-center shadow-sm">
          <EmptyState message="Aucun reçu enregistré pour l’instant." />
          <Button asChild variant="outline" size="sm" className="mt-6 rounded-lg border-zinc-200">
            <Link href="/dashboard/patient/consultations">Voir mes consultations</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.receiptId}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="flex min-w-0 gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                  <Receipt className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-zinc-900">
                    {r.amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {r.currency}
                  </p>
                  <p className="text-sm text-zinc-600">{r.doctorDisplayName}</p>
                  <p className="text-xs text-zinc-500">
                    Spécialité {r.specialtyCode}
                    {r.closedAt ? ` · Visite clôturée le ${formatShortDate(r.closedAt)}` : ''}
                  </p>
                  <p className="text-[0.6875rem] text-zinc-400">Reçu émis le {formatShortDate(r.createdAt)}</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 rounded-lg border-zinc-200">
                <Link href={`/dashboard/patient/consultations?open=${encodeURIComponent(r.consultationId)}`}>
                  Voir la consultation
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </PatientPageShell>
  );
}
