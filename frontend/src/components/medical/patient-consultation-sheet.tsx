'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { consultationsApi } from '@/lib/api';
import { formatShortDate } from '@/lib/utils/date';
import type { ConsultationApiDetail } from '@/types/consultation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const VITAL_LABELS: Record<string, string> = {
  taSys: 'TA syst.',
  taDia: 'TA diast.',
  fc: 'FC',
  poids: 'Poids',
  taille: 'Taille',
  spo2: 'SpO₂',
  glycemie: 'Glycémie',
  imc: 'IMC',
  pio: 'PIO',
  temperature: 'Temp.',
};

function formatReceiptAmount(amount: unknown, currency: string) {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ${currency}`;
}

function statusLabelFr(status: string) {
  switch (status) {
    case 'completed':
      return 'Clôturée';
    case 'in_progress':
      return 'En cours';
    case 'draft':
      return 'Brouillon';
    default:
      return status;
  }
}

type PatientConsultationSheetProps = {
  consultationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PatientConsultationSheet({
  consultationId,
  open,
  onOpenChange,
}: PatientConsultationSheetProps) {
  const [detail, setDetail] = useState<ConsultationApiDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !consultationId) {
      setDetail(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    consultationsApi
      .getById(consultationId)
      .then(setDetail)
      .catch(() => setError('Impossible de charger cette consultation.'))
      .finally(() => setLoading(false));
  }, [open, consultationId]);

  const sd = detail?.structuredData ?? {};
  const vitalEntries = Object.entries(sd).filter(([k]) => k in VITAL_LABELS);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-4 py-4 text-left">
          <SheetTitle className="text-base font-semibold">Consultation</SheetTitle>
          <SheetDescription className="text-xs">
            Synthèse partagée par le cabinet après la visite (lecture seule).
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Chargement…
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : detail ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-semibold uppercase">
                  {statusLabelFr(detail.status)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {detail.closedAt
                    ? `Clôturée le ${formatShortDate(detail.closedAt)}`
                    : `Créée le ${formatShortDate(detail.createdAt)}`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Spécialité <span className="font-medium text-foreground">{detail.specialtyCode}</span>
              </p>

              {detail.diagnosis ? (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Diagnostic
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{detail.diagnosis}</p>
                </section>
              ) : null}

              {detail.observations ? (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Observations
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{detail.observations}</p>
                </section>
              ) : null}

              {detail.plan ? (
                <section className="rounded-xl border border-orange-200/60 bg-orange-50/40 px-3 py-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-orange-900/80">
                    Ordonnance / plan de traitement
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{detail.plan}</p>
                </section>
              ) : null}

              {vitalEntries.length ? (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Constantes enregistrées
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {vitalEntries.map(([k, v]) => (
                      <li key={k}>
                        <Badge variant="outline" className="font-normal">
                          {VITAL_LABELS[k] ?? k}:{' '}
                          <span className="font-medium">{v === null || v === undefined ? '—' : String(v)}</span>
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {detail.receipt ? (
                <section className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-blue-800">
                    Reçu / honoraires
                  </h3>
                  <p className="mt-1 text-lg font-semibold text-blue-950">
                    {formatReceiptAmount(detail.receipt.amount, detail.receipt.currency)}
                  </p>
                  <p className="text-[11px] text-blue-700">
                    Émis le {formatShortDate(detail.receipt.createdAt)}
                  </p>
                </section>
              ) : null}

              {detail.prescriptionIds?.length ? (
                <p className="text-xs text-muted-foreground">
                  {detail.prescriptionIds.length} référence(s) d&apos;ordonnance liée(s) au dossier cabinet.
                </p>
              ) : null}

              {detail.appointment ? (
                <Button variant="outline" size="sm" className="w-full rounded-lg" asChild>
                  <Link href="/dashboard/patient/bookings">Voir mes rendez-vous</Link>
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
