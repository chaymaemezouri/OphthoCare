'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Filter, RefreshCw, Stethoscope } from 'lucide-react';
import { useRequireAuth } from '@/hooks/use-auth';
import { consultationsApi } from '@/lib/api';
import { PatientPageHeader } from '@/components/patient/patient-page-header';
import { PatientPageShell } from '@/components/patient/patient-page-shell';
import { PATIENT_CARD } from '@/components/patient/patient-dashboard-shell';
import { patientPageClass } from '@/components/patient/patient-dashboard-shell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/alerts';
import { formatShortDate } from '@/lib/utils/date';
import { PatientConsultationSheet } from '@/components/medical/patient-consultation-sheet';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Row = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  specialtyCode: string;
  closedAt: string | null;
  startAt: string | null;
  doctor: { id: string; displayName: string };
  appointment: { id: string; startTime: string } | null;
  receipt: { id: string; amount: number; currency: string; createdAt: string } | null;
};

function statusLabel(s: string) {
  switch (s) {
    case 'completed':
      return 'Clôturée';
    case 'in_progress':
      return 'En cours';
    case 'draft':
      return 'Brouillon';
    default:
      return s;
  }
}

function PatientConsultationsListContent() {
  useRequireAuth();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await consultationsApi.listMinePatient({
        status: status.trim() || undefined,
        from: from.trim() || undefined,
        to: to.trim() || undefined,
      });
      setRows(data);
    } catch {
      setError('Impossible de charger vos consultations.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const open = searchParams.get('open');
    if (open?.trim()) {
      setSheetId(open.trim());
      setSheetOpen(true);
    }
  }, [searchParams]);

  const hasFilters = useMemo(() => Boolean(status.trim() || from.trim() || to.trim()), [status, from, to]);

  return (
    <PatientPageShell className="space-y-6">
      <PatientPageHeader
        variant="compact"
        title="Mes consultations"
        description="Liste de vos consultations cliniques avec filtres. La timeline complète reste dans le dossier médical."
        actions={
          <Button type="button" variant="outline" size="sm" className="rounded-lg border-zinc-200" onClick={() => void load()}>
            <RefreshCw className="mr-1.5 h-4 w-4 opacity-80" aria-hidden />
            Actualiser
          </Button>
        }
      />

      <section className={cn(PATIENT_CARD, 'p-4 sm:p-5')}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" aria-hidden />
          <h2 className="text-sm font-semibold text-zinc-900">Filtres</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-status" className="text-xs text-zinc-600">
              Statut
            </Label>
            <select
              id="c-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100"
            >
              <option value="">Tous</option>
              <option value="draft">Brouillon</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Clôturée</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-from" className="text-xs text-zinc-600">
              Depuis
            </Label>
            <Input
              id="c-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border-zinc-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-to" className="text-xs text-zinc-600">
              Jusqu’au
            </Label>
            <Input id="c-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border-zinc-200" />
          </div>
        </div>
        {hasFilters ? (
          <Button type="button" variant="ghost" size="sm" className="mt-3 h-8 text-xs text-zinc-600" onClick={() => { setStatus(''); setFrom(''); setTo(''); }}>
            Réinitialiser les filtres
          </Button>
        ) : null}
      </section>

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
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-100/90" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className={cn(PATIENT_CARD, 'border-dashed px-6 py-14 text-center')}>
          <EmptyState message="Aucune consultation ne correspond à ces critères." />
          <Button asChild variant="outline" size="sm" className="mt-6 rounded-lg border-zinc-200">
            <Link href="/dashboard/patient/medical-records">Ouvrir le dossier médical</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className={cn(PATIENT_CARD, 'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5')}
            >
              <div className="flex min-w-0 gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <Stethoscope className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-zinc-900">{r.doctor.displayName}</p>
                  <p className="text-xs text-zinc-500">
                    {r.specialtyCode} · {statusLabel(r.status)}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {r.closedAt ? `Clôturée le ${formatShortDate(r.closedAt)}` : `Créée le ${formatShortDate(r.createdAt)}`}
                    {r.appointment ? ` · RDV ${formatShortDate(r.appointment.startTime)}` : ''}
                  </p>
                  {r.receipt ? (
                    <p className="text-xs font-medium text-blue-700">
                      Reçu : {r.receipt.amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {r.receipt.currency}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-zinc-200"
                  onClick={() => {
                    setSheetId(r.id);
                    setSheetOpen(true);
                  }}
                >
                  Synthèse
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-lg border-zinc-200">
                  <Link href="/dashboard/patient/receipts">Mes reçus</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PatientConsultationSheet consultationId={sheetId} open={sheetOpen} onOpenChange={setSheetOpen} />
    </PatientPageShell>
  );
}

export default function PatientConsultationsPage() {
  return (
    <Suspense
      fallback={
        <div className={patientPageClass('py-12 text-center text-sm text-slate-500')}>Chargement de la page…</div>
      }
    >
      <PatientConsultationsListContent />
    </Suspense>
  );
}
