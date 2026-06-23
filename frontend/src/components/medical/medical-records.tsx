'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ClipboardList,
  FileWarning,
  Loader2,
  RefreshCw,
  Search,
  Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { patientsApi, consultationsApi } from '@/lib/api';
import { formatShortDate } from '@/lib/utils/date';
import type {
  ClinicalRecordSummary,
  DossierAuditSummary,
  MedicalAppointmentSummary,
  MedicalData,
  PatientMedicalTimeline,
  VitalsTimelineResponse,
} from '@/types/patient';
import { useAuth, useRequireAuth } from '@/hooks/use-auth';
import { usePatientProfile } from '@/hooks/use-patient-profile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { VitalSignsTimeline } from '@/components/medical/VitalSignsTimeline';
import { PatientConsultationSheet } from '@/components/medical/patient-consultation-sheet';
import { AppointmentStatus } from '@/types/appointment';
import { cn } from '@/lib/utils';

type TimelineRow =
  | { kind: 'appointment'; at: string; data: MedicalAppointmentSummary }
  | { kind: 'clinical'; at: string; data: ClinicalRecordSummary }
  | { kind: 'audit'; at: string; data: DossierAuditSummary };

type KindFilter = 'all' | 'appointment' | 'clinical' | 'audit';

const STRUCTURED_VITAL_KEYS = [
  'taSys',
  'taDia',
  'fc',
  'poids',
  'taille',
  'spo2',
  'glycemie',
  'imc',
  'pio',
  'temperature',
] as const;

const VITAL_SHORT: Partial<Record<(typeof STRUCTURED_VITAL_KEYS)[number], string>> = {
  taSys: 'TA s',
  taDia: 'TA d',
  fc: 'FC',
  poids: 'Poids',
  spo2: 'SpO₂',
  glycemie: 'Gly',
  pio: 'PIO',
};

function medsToLines(m?: MedicalData['medications']): string {
  if (!m?.length) return '';
  return m.map((x) => `${x.name} | ${x.dosage} | ${x.duration}`).join('\n');
}

function linesToMeds(text: string): MedicalData['medications'] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const out: NonNullable<MedicalData['medications']> = [];
  for (const line of lines) {
    const [name, dosage, duration] = line.split('|').map((x) => x.trim());
    if (name) out.push({ name, dosage: dosage || '—', duration: duration || '—' });
  }
  return out.length ? out : undefined;
}

function apptStatusLabelFr(status: string): string {
  const s = String(status);
  switch (s) {
    case AppointmentStatus.CONFIRMED:
    case 'confirmed':
      return 'Confirmé';
    case AppointmentStatus.IN_PROGRESS:
    case 'in_progress':
      return 'En cours';
    case AppointmentStatus.PENDING:
    case 'pending':
      return 'En attente';
    case AppointmentStatus.COMPLETED:
    case 'completed':
      return 'Terminé';
    case AppointmentStatus.CANCELLED:
    case 'cancelled':
      return 'Annulé';
    case AppointmentStatus.NO_SHOW:
    case 'no_show':
      return 'Absent';
    default:
      return s;
  }
}

function visitChannelLabel(type: string): string | null {
  const t = String(type);
  if (t === 'video') return 'Téléconsultation';
  if (t === 'in_person' || t === 'in-person') return 'Présentiel';
  return null;
}

function clinicalVitalChips(structuredData: Record<string, unknown>) {
  const chips: { key: string; label: string; value: string }[] = [];
  for (const k of STRUCTURED_VITAL_KEYS) {
    const v = structuredData[k];
    if (v === undefined || v === null || v === '') continue;
    chips.push({
      key: k,
      label: VITAL_SHORT[k] ?? k,
      value: typeof v === 'number' ? String(v) : String(v),
    });
    if (chips.length >= 6) break;
  }
  return chips;
}

function rowMatchesQuery(row: TimelineRow, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  if (row.kind === 'appointment') {
    const a = row.data;
    return (
      a.doctor.displayName.toLowerCase().includes(s) ||
      (a.reason?.toLowerCase().includes(s) ?? false) ||
      (a.notes?.toLowerCase().includes(s) ?? false) ||
      a.doctor.specialty.toLowerCase().includes(s)
    );
  }
  if (row.kind === 'clinical') {
    const c = row.data;
    return (
      (c.title?.toLowerCase().includes(s) ?? false) ||
      (c.narrative?.toLowerCase().includes(s) ?? false) ||
      c.author.displayName.toLowerCase().includes(s)
    );
  }
  const u = row.data;
  return (
    (u.summary?.toLowerCase().includes(s) ?? false) || u.editor.displayName.toLowerCase().includes(s)
  );
}

export function UnifiedMedicalTimeline({
  data,
  onOpenConsultation,
}: {
  data: PatientMedicalTimeline;
  onOpenConsultation: (id: string) => void;
}) {
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [search, setSearch] = useState('');

  const rows: TimelineRow[] = useMemo(() => {
    const out: TimelineRow[] = [];
    for (const a of data.appointmentSummaries ?? []) {
      out.push({ kind: 'appointment', at: a.startTime, data: a });
    }
    for (const c of data.clinicalRecords ?? []) {
      out.push({ kind: 'clinical', at: c.createdAt, data: c });
    }
    for (const u of data.dossierAudits ?? []) {
      out.push({ kind: 'audit', at: u.createdAt, data: u });
    }
    return out.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());
  }, [data]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (kindFilter !== 'all' && row.kind !== kindFilter) return false;
      return rowMatchesQuery(row, search);
    });
  }, [rows, kindFilter, search]);

  const hasDx = data.declaredDiagnoses && data.declaredDiagnoses.length > 0;

  const filterButtons: { id: KindFilter; label: string }[] = [
    { id: 'all', label: 'Tout' },
    { id: 'appointment', label: 'Rendez-vous' },
    { id: 'clinical', label: 'Notes' },
    { id: 'audit', label: 'Dossier' },
  ];

  return (
    <div className="space-y-6">
      {hasDx ? (
        <section className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-stone-900">
            <ClipboardList className="h-4 w-4 text-blue-600" aria-hidden />
            Diagnostics déclarés (CIM-10)
          </h2>
          <ul className="mt-3 divide-y divide-stone-100 rounded-xl border border-stone-100 bg-stone-50/40">
            {(data.declaredDiagnoses as { code: string; label: string; notes?: string }[]).map((d, i) => (
              <li key={`${d.code}-${i}`} className="px-3 py-2.5 sm:px-4">
                <p className="text-sm font-medium text-stone-900">
                  {d.code} — {d.label}
                </p>
                {d.notes ? <p className="mt-1 text-xs text-stone-600">{d.notes}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-stone-900">
            <Activity className="h-4 w-4 text-blue-600" aria-hidden />
            Parcours de soins
          </h2>
          <p className="max-w-xl text-xs leading-relaxed text-stone-600">
            Rendez-vous, notes du cabinet et mises à jour du dossier administratif.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrer la timeline">
            {filterButtons.map((b) => (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={kindFilter === b.id}
                onClick={() => setKindFilter(b.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  kindFilter === b.id
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-stone-200 bg-stone-50/80 text-stone-700 hover:border-stone-300 hover:bg-white',
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
          <div className="relative max-w-md flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (praticien, motif, texte)…"
              className="h-9 rounded-lg border-stone-200 bg-white pl-8 text-xs"
              aria-label="Rechercher dans la timeline"
            />
          </div>
        </div>

        {!filtered.length ? (
          <div className="mt-6 rounded-xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-10 text-center">
            <p className="text-sm text-stone-600">
              {rows.length === 0
                ? 'Aucun événement pour le moment.'
                : 'Aucun résultat pour ces filtres.'}{' '}
              {rows.length === 0 ? (
                <Link href="/search" className="font-medium text-blue-700 underline-offset-4 hover:underline">
                  Prendre rendez-vous
                </Link>
              ) : null}
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {filtered.map((row, idx) => {
              if (row.kind === 'appointment') {
                const a = row.data;
                const channel = visitChannelLabel(a.type);
                return (
                  <li
                    key={`appt-${a.id}-${idx}`}
                    className="rounded-xl border border-stone-100 bg-gradient-to-br from-white to-stone-50/80 p-3.5 shadow-sm sm:p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className="rounded-md bg-blue-600 text-[10px] font-semibold uppercase text-white">
                          Rendez-vous
                        </Badge>
                        <Badge variant="outline" className="rounded-md text-[10px] font-medium">
                          {apptStatusLabelFr(a.status)}
                        </Badge>
                        {channel ? (
                          <Badge variant="secondary" className="rounded-md text-[10px]">
                            {channel}
                          </Badge>
                        ) : null}
                      </div>
                      <span className="text-[11px] text-stone-500">{formatShortDate(a.startTime)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-stone-900">{a.doctor.displayName}</p>
                    <p className="text-xs text-stone-600">
                      {a.doctor.specialty} · {a.doctor.city}
                    </p>
                    {a.reason ? (
                      <p className="mt-2 text-xs">
                        <span className="text-stone-500">Motif : </span>
                        <span className="text-stone-800">{a.reason}</span>
                      </p>
                    ) : null}
                    {a.notes ? (
                      <p className="mt-2 rounded-lg border border-stone-100 bg-white/80 px-2.5 py-2 text-xs text-stone-800">
                        {a.notes}
                      </p>
                    ) : null}
                    {a.consultationId ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg border-blue-200 text-xs text-blue-800 hover:bg-blue-50"
                          onClick={() => onOpenConsultation(a.consultationId!)}
                        >
                          <Stethoscope className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                          Synthèse consultation
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              }
              if (row.kind === 'clinical') {
                const c = row.data;
                const sd = (c.structuredData ?? {}) as Record<string, unknown>;
                const chips = clinicalVitalChips(sd);
                return (
                  <li
                    key={`clin-${c.id}-${idx}`}
                    className="rounded-xl border border-stone-200/90 bg-white p-3.5 shadow-sm sm:p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Badge className="rounded-md bg-stone-900 text-[10px] font-semibold uppercase text-white">
                        Note clinique
                      </Badge>
                      <span className="text-[11px] text-stone-500">{formatShortDate(c.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-stone-900">{c.title || 'Sans titre'}</p>
                    <p className="text-xs text-stone-600">{c.author.displayName}</p>
                    {c.appointmentStart ? (
                      <p className="mt-1 text-[11px] text-stone-500">
                        Lié à une visite du {formatShortDate(c.appointmentStart)}
                      </p>
                    ) : null}
                    {chips.length ? (
                      <ul className="mt-2 flex flex-wrap gap-1">
                        {chips.map((ch) => (
                          <li key={ch.key}>
                            <Badge variant="outline" className="font-normal text-[10px]">
                              {ch.label} {ch.value}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {c.narrative ? (
                      <p className="mt-2 rounded-lg bg-stone-50 px-2.5 py-2 text-xs leading-relaxed text-stone-800">
                        {c.narrative}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[10px] text-stone-400">
                      Spécialité {c.specialtyCode}
                      {c.versionCount ? ` · ${c.versionCount} version(s)` : ''}
                    </p>
                  </li>
                );
              }
              const u = row.data;
              return (
                <li
                  key={`audit-${u.id}-${idx}`}
                  className="rounded-xl border border-amber-100 bg-amber-50/35 p-3.5 sm:p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-md border-amber-200 text-[10px] font-semibold text-amber-950"
                    >
                      <FileWarning className="mr-1 h-3 w-3" aria-hidden />
                      Dossier
                    </Badge>
                    <span className="text-[11px] text-stone-500">{formatShortDate(u.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-stone-800">{u.editor.displayName}</p>
                  <p className="mt-1 text-sm text-stone-800">{u.summary || 'Mise à jour du dossier'}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export function MedicalRecordsDisplay({ reloadKey = 0 }: { reloadKey?: number }) {
  const [data, setData] = useState<PatientMedicalTimeline | null>(null);
  const [vitals, setVitals] = useState<VitalsTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [timeline, me] = await Promise.all([patientsApi.getMyMedicalTimeline(), patientsApi.getMe()]);
        const vitalsRes = await consultationsApi.getVitalsTimeline(me.id);
        setData(timeline);
        setVitals(vitalsRes);
      } catch {
        setError('Impossible de charger le dossier.');
        setData(null);
        setVitals(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-stone-500">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" aria-hidden />
        Chargement du dossier…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-sm text-red-800">
        {error}{' '}
        <button type="button" className="font-semibold underline underline-offset-2" onClick={() => void load()}>
          Réessayer
        </button>
      </div>
    );
  }
  if (!data) return null;

  return (
    <>
      <div className="space-y-8">
        {vitals && vitals.points.length > 0 ? (
          <VitalSignsTimeline points={vitals.points} className="border-stone-200/80 shadow-sm" />
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200/90 bg-stone-50/40 px-4 py-6 text-center">
            <p className="text-xs text-stone-600">
              Les courbes de constantes apparaîtront lorsque le cabinet aura enregistré des mesures sur des
              consultations terminées.
            </p>
          </div>
        )}
        <UnifiedMedicalTimeline data={data} onOpenConsultation={(id) => setConsultationId(id)} />
      </div>
      <PatientConsultationSheet
        consultationId={consultationId}
        open={consultationId != null}
        onOpenChange={(open) => {
          if (!open) setConsultationId(null);
        }}
      />
    </>
  );
}

export function MedicalDataEditor() {
  useRequireAuth();
  const { user, isLoading: authLoading } = useAuth();
  const { draft, setDraft, loading, save } = usePatientProfile(user?.id);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const allergiesStr = (draft.medicalData?.allergies ?? []).join(', ');
  const chronicStr = (draft.medicalData?.chronicDiseases ?? []).join(', ');
  const medsStr = medsToLines(draft.medicalData?.medications);

  const handleSave = useCallback(async () => {
    setMsg(null);
    setSaving(true);
    try {
      const { remote } = await save();
      setMsg(
        remote
          ? 'Données médicales enregistrées sur le serveur.'
          : 'Sauvegarde locale uniquement — vérifiez la session ou le réseau.',
      );
    } finally {
      setSaving(false);
    }
  }, [save]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Chargement…
      </div>
    );
  }

  const fieldClass =
    'flex min-h-[72px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-stone-900">Données partagées avec le cabinet</h2>
          <p className="mt-1 text-xs text-stone-600">
            Complétez aussi votre{' '}
            <Link href="/dashboard/patient/profile" className="font-medium text-blue-700 underline-offset-4 hover:underline">
              profil patient
            </Link>{' '}
            (couverture, contact d’urgence).
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
      {msg ? <p className="text-xs font-medium text-emerald-800">{msg}</p> : null}

      <div className="space-y-5 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-700">Groupe sanguin</Label>
          <Input
            value={draft.medicalData?.bloodGroup ?? ''}
            onChange={(e) =>
              setDraft({
                medicalData: { ...draft.medicalData, bloodGroup: e.target.value || undefined },
              })
            }
            placeholder="Ex. A+"
            className="rounded-lg border-stone-200"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-700">Allergies (séparées par virgule)</Label>
          <textarea
            className={fieldClass}
            value={allergiesStr}
            onChange={(e) =>
              setDraft({
                medicalData: {
                  ...draft.medicalData,
                  allergies: e.target.value
                    .split(/[,;\n]+/)
                    .map((x) => x.trim())
                    .filter(Boolean),
                },
              })
            }
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-700">Antécédents / maladies chroniques</Label>
          <textarea
            className={fieldClass}
            value={chronicStr}
            onChange={(e) =>
              setDraft({
                medicalData: {
                  ...draft.medicalData,
                  chronicDiseases: e.target.value
                    .split(/[,;\n]+/)
                    .map((x) => x.trim())
                    .filter(Boolean),
                },
              })
            }
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-700">
            Traitements en cours (une ligne par médicament :{' '}
            <span className="font-normal text-stone-500">nom | posologie | durée</span>)
          </Label>
          <textarea
            className={fieldClass + ' min-h-[88px] font-mono text-[13px]'}
            value={medsStr}
            onChange={(e) =>
              setDraft({
                medicalData: {
                  ...draft.medicalData,
                  medications: linesToMeds(e.target.value),
                },
              })
            }
            rows={4}
            placeholder={'Ex.\nDoliprane | 1000 mg x3/j | 3 jours'}
          />
        </div>
      </div>
    </div>
  );
}
