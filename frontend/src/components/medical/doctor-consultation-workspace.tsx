'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CheckCircle2,
  GitCompare,
  Loader2,
  Play,
  Save,
  Stethoscope,
  Upload,
} from 'lucide-react';
import { consultationsApi, specialtiesApi } from '@/lib/api';
import type { ConsultationApiDetail } from '@/types/consultation';
import type { MedicalAppointmentSummary } from '@/types/patient';
import type { SpecialtyField } from '@/lib/medical/specialty-field.types';
import { SpecialtyFormRenderer } from '@/components/medical/SpecialtyFormRenderer';
import { ConsultationComparison } from '@/components/medical/ConsultationComparison';
import { GrowthCurveChart } from '@/components/medical/GrowthCurveChart';
import { VitalSignsTimeline } from '@/components/medical/VitalSignsTimeline';
import { useDoctorProfile } from '@/hooks/use-doctor-profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ConsultationListRow = {
  id: string;
  createdAt: string;
  status: string;
  specialtyCode: string;
  closedAt: string | null;
  startAt: string | null;
  appointment: { id: string; startTime: string } | null;
};

type SuggestedPreForm = {
  id: string;
  responses?: Record<string, unknown>;
  specialtyCode?: string | null;
  createdAt?: string;
};

function statusFr(s: string) {
  switch (s) {
    case 'draft':
      return 'Brouillon';
    case 'in_progress':
      return 'En cours';
    case 'completed':
      return 'Clôturée';
    default:
      return s;
  }
}

function formatDuration(sec?: number | null) {
  if (sec == null || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} min ${s}s` : `${s}s`;
}

function patientAgeMonths(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  return (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
}

export function DoctorConsultationWorkspace({
  patientId,
  patientDateOfBirth,
  appointments,
  readOnly,
  initialAppointmentId,
  onSaved,
}: {
  patientId: string;
  patientDateOfBirth?: string | null;
  appointments: MedicalAppointmentSummary[];
  readOnly: boolean;
  initialAppointmentId?: string;
  onSaved: () => void;
}) {
  const { doctor } = useDoctorProfile(!readOnly);
  const defaultSpecialty = doctor?.specialtyCode ?? 'general-medicine';

  const [list, setList] = useState<ConsultationListRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConsultationApiDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fields, setFields] = useState<SpecialtyField[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);

  const [observations, setObservations] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [plan, setPlan] = useState('');
  const [structuredDraft, setStructuredDraft] = useState<Record<string, unknown>>({});

  const [selectedApptId, setSelectedApptId] = useState(initialAppointmentId ?? '');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [banner, setBanner] = useState<{ variant: 'success' | 'error'; text: string } | null>(null);

  const [vitals, setVitals] = useState<
    Array<{ date: string; consultationId: string; values: Record<string, number | string | null> }>
  >([]);

  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [compareLeft, setCompareLeft] = useState<ConsultationApiDetail | null>(null);
  const [compareRight, setCompareRight] = useState<ConsultationApiDetail | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const suggestedPre = (detail as ConsultationApiDetail & { suggestedPreConsultation?: SuggestedPreForm | null })
    ?.suggestedPreConsultation;

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const rows = await consultationsApi.getByPatient(patientId);
      setList(Array.isArray(rows) ? rows : []);
    } catch {
      setList([]);
    } finally {
      setListLoading(false);
    }
  }, [patientId]);

  const loadVitals = useCallback(async () => {
    try {
      const data = await consultationsApi.getVitalsTimeline(patientId);
      setVitals(data.points ?? []);
    } catch {
      setVitals([]);
    }
  }, [patientId]);

  useEffect(() => {
    void loadList();
    void loadVitals();
  }, [loadList, loadVitals]);

  const loadTemplate = useCallback(async (code: string) => {
    setTemplateLoading(true);
    try {
      const tpl = await specialtiesApi.getTemplate(code);
      setFields(Array.isArray(tpl.fields) ? (tpl.fields as SpecialtyField[]) : []);
    } catch {
      setFields([]);
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  const loadDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true);
      setBanner(null);
      try {
        const d = await consultationsApi.getById(id);
        setDetail(d);
        setActiveId(id);
        setObservations(d.observations ?? '');
        setDiagnosis(d.diagnosis ?? '');
        setPlan(d.plan ?? '');
        setStructuredDraft((d.structuredData ?? {}) as Record<string, unknown>);
        await loadTemplate(d.specialtyCode || defaultSpecialty);
      } catch {
        setDetail(null);
        setBanner({ variant: 'error', text: 'Impossible de charger la consultation.' });
      } finally {
        setDetailLoading(false);
      }
    },
    [defaultSpecialty, loadTemplate],
  );

  const bootstrapRef = useRef(false);

  useEffect(() => {
    if (initialAppointmentId) setSelectedApptId(initialAppointmentId);
  }, [initialAppointmentId]);

  const handleCreate = useCallback(async (appointmentId?: string) => {
    if (readOnly) return;
    setCreating(true);
    setBanner(null);
    try {
      const created = (await consultationsApi.create({
        patientId,
        appointmentId: appointmentId || selectedApptId || undefined,
        specialtyCode: defaultSpecialty,
      })) as ConsultationApiDetail;
      const id = created.id;
      if (!id) throw new Error('missing id');
      await loadList();
      await loadDetail(id);
      setBanner({ variant: 'success', text: 'Brouillon de consultation créé.' });
      onSaved();
    } catch {
      setBanner({ variant: 'error', text: 'Création impossible (vérifiez le RDV et vos droits).' });
    } finally {
      setCreating(false);
    }
  }, [defaultSpecialty, loadDetail, loadList, onSaved, patientId, readOnly, selectedApptId]);

  useEffect(() => {
    if (bootstrapRef.current || !initialAppointmentId || listLoading) return;
    const existing = list.find(
      (c) =>
        (c.status === 'in_progress' || c.status === 'draft') &&
        c.appointment?.id === initialAppointmentId,
    );
    if (existing) {
      bootstrapRef.current = true;
      void loadDetail(existing.id);
      return;
    }
    if (!readOnly && appointments.some((a) => a.id === initialAppointmentId)) {
      bootstrapRef.current = true;
      void handleCreate(initialAppointmentId);
    }
  }, [initialAppointmentId, listLoading, list, readOnly, appointments, loadDetail, handleCreate]);

  const handleStart = async () => {
    if (!detail || readOnly || detail.status !== 'draft') return;
    setSaving(true);
    setBanner(null);
    try {
      const updated = await consultationsApi.start(detail.id);
      setDetail(updated);
      setBanner({ variant: 'success', text: 'Consultation démarrée — chronomètre actif.' });
      onSaved();
    } catch {
      setBanner({ variant: 'error', text: 'Impossible de démarrer la consultation.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStructured = async (data: Record<string, unknown>) => {
    if (!detail || readOnly || detail.status === 'completed') return;
    setSaving(true);
    setBanner(null);
    try {
      const updated = await consultationsApi.update(detail.id, {
        structuredData: data,
        observations: observations.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        plan: plan.trim() || undefined,
      });
      setDetail(updated);
      setStructuredDraft((updated.structuredData ?? {}) as Record<string, unknown>);
      setBanner({ variant: 'success', text: 'Consultation enregistrée.' });
      onSaved();
    } catch {
      setBanner({ variant: 'error', text: 'Enregistrement refusé.' });
    } finally {
      setSaving(false);
    }
  };

  const handleImportPre = async () => {
    if (!detail || !suggestedPre?.id || readOnly) return;
    setImporting(true);
    setBanner(null);
    try {
      const updated = await consultationsApi.importPreConsultation(detail.id, suggestedPre.id);
      setDetail(updated);
      setStructuredDraft((updated.structuredData ?? {}) as Record<string, unknown>);
      setBanner({ variant: 'success', text: 'Données pré-consultation importées (original conservé côté serveur).' });
      onSaved();
    } catch {
      setBanner({ variant: 'error', text: 'Import impossible.' });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = async () => {
    if (!detail || readOnly) return;
    setClosing(true);
    setBanner(null);
    try {
      const updated = await consultationsApi.close(detail.id);
      setDetail(updated);
      await loadList();
      await loadVitals();
      setBanner({
        variant: 'success',
        text: `Consultation clôturée — durée ${formatDuration(updated.durationSeconds)}. Reçu généré.`,
      });
      onSaved();
    } catch {
      setBanner({ variant: 'error', text: 'Clôture impossible.' });
    } finally {
      setClosing(false);
    }
  };

  const completedList = useMemo(
    () => list.filter((c) => c.status === 'completed'),
    [list],
  );

  const runCompare = async () => {
    if (!compareA || !compareB || compareA === compareB) return;
    setCompareLoading(true);
    try {
      await consultationsApi.compareConsultations(compareA, compareB);
      const [left, right] = await Promise.all([
        consultationsApi.getById(compareA),
        consultationsApi.getById(compareB),
      ]);
      setCompareLeft(left);
      setCompareRight(right);
    } catch {
      setCompareLeft(null);
      setCompareRight(null);
      setBanner({ variant: 'error', text: 'Comparaison impossible (même patient, votre cabinet).' });
    } finally {
      setCompareLoading(false);
    }
  };

  const isPediatrics =
    detail?.specialtyCode === 'pediatrics' ||
    defaultSpecialty === 'pediatrics';
  const ageMonths = patientAgeMonths(patientDateOfBirth);
  const poids = Number(structuredDraft.poids);
  const taille = Number(structuredDraft.taille);
  const pc = Number(structuredDraft.pc);
  const showGrowth = isPediatrics && ageMonths != null;

  const fieldKeys = useMemo(() => fields.map((f) => f.key), [fields]);

  return (
    <div className="space-y-6">
      {banner ? (
        <p
          className={cn(
            'rounded-lg border px-3 py-2 text-sm',
            banner.variant === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900',
          )}
        >
          {banner.text}
        </p>
      ) : null}

      <Card className="border-slate-200/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="h-4 w-4" />
            Consultation en cours
          </CardTitle>
          <CardDescription>
            Formulaire dynamique selon la spécialité — enregistrement, import pré-consultation et clôture.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-1">
              <Label>Rendez-vous (optionnel)</Label>
              <Select
                value={selectedApptId || '__none__'}
                onValueChange={(v) => setSelectedApptId(!v || v === '__none__' ? '' : v)}
                disabled={readOnly || !!activeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un RDV…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sans RDV</SelectItem>
                  {appointments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {format(parseISO(a.startTime), 'dd/MM/yyyy HH:mm', { locale: fr })} —{' '}
                      {a.reason || 'Consultation'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!readOnly ? (
              <Button
                type="button"
                disabled={creating}
                onClick={() => void handleCreate()}
                className="gap-2"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Créer brouillon
              </Button>
            ) : null}
          </div>

          {listLoading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Historique…
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {list.map((c) => (
                <Button
                  key={c.id}
                  type="button"
                  size="sm"
                  variant={activeId === c.id ? 'default' : 'outline'}
                  onClick={() => void loadDetail(c.id)}
                >
                  {format(parseISO(c.createdAt), 'dd/MM/yy', { locale: fr })} — {statusFr(c.status)}
                </Button>
              ))}
            </div>
          )}

          {detailLoading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2 py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement…
            </p>
          ) : detail ? (
            <div className="space-y-4 border-t pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{statusFr(detail.status)}</Badge>
                <Badge variant="outline">{detail.specialtyCode}</Badge>
                {detail.startAt ? (
                  <span className="text-xs text-muted-foreground">
                    Début {format(parseISO(detail.startAt), 'PPp', { locale: fr })}
                  </span>
                ) : null}
                {detail.durationSeconds != null ? (
                  <span className="text-xs text-muted-foreground">
                    Durée {formatDuration(detail.durationSeconds)}
                  </span>
                ) : null}
              </div>

              {suggestedPre?.id && detail.status !== 'completed' && !readOnly ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-2">
                  <p className="text-sm text-blue-900">
                    Questionnaire pré-consultation disponible pour ce rendez-vous.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="gap-2"
                    disabled={importing}
                    onClick={() => void handleImportPre()}
                  >
                    {importing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Importer pré-consultation
                  </Button>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1 sm:col-span-3">
                  <Label>Observations</Label>
                  <textarea
                    className="min-h-[72px] w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    readOnly={readOnly || detail.status === 'completed'}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Diagnostic</Label>
                  <textarea
                    className="min-h-[72px] w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    readOnly={readOnly || detail.status === 'completed'}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Plan / ordonnance</Label>
                  <textarea
                    className="min-h-[72px] w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    readOnly={readOnly || detail.status === 'completed'}
                  />
                </div>
              </div>

              {templateLoading ? (
                <p className="text-sm text-muted-foreground">Chargement du gabarit…</p>
              ) : fields.length > 0 ? (
                <SpecialtyFormRenderer
                  fields={fields}
                  defaultValues={structuredDraft}
                  preConsultationForm={suggestedPre ?? undefined}
                  readOnly={readOnly || detail.status === 'completed'}
                  submitLabel={saving ? 'Enregistrement…' : 'Enregistrer la consultation'}
                  onSubmit={handleSaveStructured}
                />
              ) : (
                <p className="text-sm text-amber-800">Gabarit spécialité indisponible.</p>
              )}

              {!readOnly && detail.status !== 'completed' ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    disabled={saving}
                    onClick={() => void handleSaveStructured(structuredDraft)}
                  >
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </Button>
                  {detail.status === 'draft' ? (
                    <Button type="button" className="gap-2" disabled={saving} onClick={() => void handleStart()}>
                      <Play className="h-4 w-4" />
                      Lancer le chronomètre
                    </Button>
                  ) : null}
                  {detail.status === 'in_progress' ? (
                    <Button
                      type="button"
                      className="gap-2 bg-emerald-700 hover:bg-emerald-800"
                      disabled={closing}
                      onClick={() => void handleClose()}
                    >
                      {closing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Clôturer & générer le reçu
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              {readOnly
                ? 'Sélectionnez une consultation dans la liste.'
                : 'Démarrez une consultation ou sélectionnez-en une dans la liste.'}
            </p>
          )}
        </CardContent>
      </Card>

      {vitals.length > 0 ? (
        <VitalSignsTimeline points={vitals} />
      ) : null}

      {showGrowth ? (
        <GrowthCurveChart
          sex="male"
          ageMonths={ageMonths}
          weightKg={Number.isFinite(poids) && poids > 0 ? poids : undefined}
          heightCm={Number.isFinite(taille) && taille > 0 ? taille : undefined}
          headCm={Number.isFinite(pc) && pc > 0 ? pc : undefined}
        />
      ) : null}

      <Card className="border-slate-200/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCompare className="h-4 w-4" />
            Comparer deux consultations
          </CardTitle>
          <CardDescription>
            Réservé au médecin du cabinet — champs modifiés surlignés.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Consultation A (avant)</Label>
              <Select value={compareA} onValueChange={(v) => setCompareA(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {completedList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {format(parseISO(c.closedAt ?? c.createdAt), 'dd/MM/yyyy', { locale: fr })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Consultation B (après)</Label>
              <Select value={compareB} onValueChange={(v) => setCompareB(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {completedList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {format(parseISO(c.closedAt ?? c.createdAt), 'dd/MM/yyyy', { locale: fr })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={!compareA || !compareB || compareLoading || readOnly}
            onClick={() => void runCompare()}
          >
            {compareLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Lancer la comparaison
          </Button>
          {compareLeft && compareRight ? (
            <ConsultationComparison
              left={{
                id: compareLeft.id,
                createdAt: compareLeft.createdAt,
                closedAt: compareLeft.closedAt,
                structuredData: (compareLeft.structuredData ?? {}) as Record<string, unknown>,
                observations: compareLeft.observations,
                diagnosis: compareLeft.diagnosis,
                plan: compareLeft.plan,
              }}
              right={{
                id: compareRight.id,
                createdAt: compareRight.createdAt,
                closedAt: compareRight.closedAt,
                structuredData: (compareRight.structuredData ?? {}) as Record<string, unknown>,
                observations: compareRight.observations,
                diagnosis: compareRight.diagnosis,
                plan: compareRight.plan,
              }}
              fieldKeys={fieldKeys}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

