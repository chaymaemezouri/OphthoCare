'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DoctorPageShell } from '@/components/doctor/doctor-page-shell';
import { DoctorSection } from '@/components/doctor/doctor-section';
import { DOCTOR_CARD } from '@/components/doctor/doctor-dashboard-shell';
import { clinicalRecordsApi, patientsApi } from '@/lib/api';
import type { ClinicalRecordSummary, Patient, PatientMedicalTimeline } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatShortDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils';
import { ChevronLeft, FolderOpen, History, Stethoscope, FileText, ClipboardList } from 'lucide-react';
import { DoctorPatientDocumentsPanel } from '@/components/medical/doctor-patient-documents-panel';
import { TraineePatientImagingPanel } from '@/components/medical/trainee-patient-imaging-panel';
import {
  buildTimelineRows,
  DoctorPatientDossierTimeline,
} from '@/components/medical/doctor-patient-dossier-timeline';
import { DoctorPatientDossierSidebar } from '@/components/medical/doctor-patient-dossier-sidebar';
import { doctorsApi } from '@/lib/api';
import { useRequireAuth } from '@/hooks/use-auth';
import { DoctorPrescriptionWorkspace } from '@/components/medical/doctor-prescription-workspace';
import { PrescriptionForm } from '@/components/documents/PrescriptionForm';
import { ReportEditor } from '@/components/documents/ReportEditor';
import { DocumentsList } from '@/components/documents/DocumentsList';
import { DoctorConsultationWorkspace } from '@/components/medical/doctor-consultation-workspace';

type StructuredOphthal = {
  visualAcuity: { od: string; og: string; method: string };
  intraocularPressure: { od: string; og: string; time: string };
  refraction: { od: string; og: string };
  anteriorSegment: { notes: string };
  fundus: { notes: string };
  extensions: Record<string, unknown>;
};

const emptyStructured = (): StructuredOphthal => ({
  visualAcuity: { od: '', og: '', method: '' },
  intraocularPressure: { od: '', og: '', time: '' },
  refraction: { od: '', og: '' },
  anteriorSegment: { notes: '' },
  fundus: { notes: '' },
  extensions: {},
});

function parseStructured(raw: Record<string, unknown> | undefined): StructuredOphthal {
  const d = emptyStructured();
  if (!raw || typeof raw !== 'object') return d;
  const va = raw.visualAcuity as Record<string, unknown> | undefined;
  if (va && typeof va === 'object') {
    d.visualAcuity = {
      od: String(va.od ?? ''),
      og: String(va.og ?? ''),
      method: String(va.method ?? ''),
    };
  }
  const pio = raw.intraocularPressure as Record<string, unknown> | undefined;
  if (pio && typeof pio === 'object') {
    d.intraocularPressure = {
      od: String(pio.od ?? ''),
      og: String(pio.og ?? ''),
      time: String(pio.time ?? ''),
    };
  }
  const ref = raw.refraction as Record<string, unknown> | undefined;
  if (ref && typeof ref === 'object') {
    d.refraction = { od: String(ref.od ?? ''), og: String(ref.og ?? '') };
  }
  const as = raw.anteriorSegment as Record<string, unknown> | undefined;
  if (as && typeof as === 'object') d.anteriorSegment = { notes: String(as.notes ?? '') };
  const fu = raw.fundus as Record<string, unknown> | undefined;
  if (fu && typeof fu === 'object') d.fundus = { notes: String(fu.notes ?? '') };
  if (raw.extensions && typeof raw.extensions === 'object' && !Array.isArray(raw.extensions)) {
    d.extensions = { ...(raw.extensions as Record<string, unknown>) };
  }
  return d;
}

function toStructuredPayload(s: StructuredOphthal): Record<string, unknown> {
  return {
    visualAcuity: s.visualAcuity,
    intraocularPressure: {
      od: s.intraocularPressure.od === '' ? null : Number(s.intraocularPressure.od) || s.intraocularPressure.od,
      og: s.intraocularPressure.og === '' ? null : Number(s.intraocularPressure.og) || s.intraocularPressure.og,
      time: s.intraocularPressure.time,
    },
    refraction: s.refraction,
    anteriorSegment: s.anteriorSegment,
    fundus: s.fundus,
    extensions: s.extensions,
  };
}

const DOSSIER_TABS = ['timeline', 'consultation', 'ordonnances', 'documents', 'dossier'] as const;
type DossierTab = (typeof DOSSIER_TABS)[number];

function tabFromParam(raw?: string | null): DossierTab {
  if (raw === 'note') return 'consultation';
  if (raw === 'import' || raw === 'versions') return 'timeline';
  return raw && (DOSSIER_TABS as readonly string[]).includes(raw) ? (raw as DossierTab) : 'timeline';
}

export function DoctorPatientDossierView({
  patientId,
  listPath = '/dashboard/medecin/patients',
  layoutRole = 'medecin',
  readOnlyMedical,
  defaultTab,
  initialAppointmentId,
}: {
  patientId: string;
  /** Liste patients (retour navigation). */
  listPath?: string;
  layoutRole?: 'medecin' | 'secretaire' | 'stagiaire';
  /** Si défini, prime sur le rôle : true = pas d’édition clinique / dossier. */
  readOnlyMedical?: boolean;
  /** Onglet initial (ex. `ordonnances` depuis la liste des ordonnances). */
  defaultTab?: string;
  /** RDV à ouvrir dans l’onglet consultation (depuis l’agenda). */
  initialAppointmentId?: string;
}) {
  useRequireAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isTrainee = layoutRole === 'stagiaire';
  const isReadOnly = readOnlyMedical ?? (layoutRole === 'secretaire' || isTrainee);
  const initialTab = tabFromParam(defaultTab);
  const [activeTab, setActiveTab] = useState<DossierTab>(initialTab);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [timeline, setTimeline] = useState<PatientMedicalTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('Consultation');
  const [narrative, setNarrative] = useState('');
  const [structured, setStructured] = useState<StructuredOphthal>(emptyStructured);
  const [appointmentId, setAppointmentId] = useState<string>('');
  const [savingNote, setSavingNote] = useState(false);

  const [dossierAllergies, setDossierAllergies] = useState('');
  const [dxCode, setDxCode] = useState('');
  const [dxLabel, setDxLabel] = useState('');
  const [dossierSummary, setDossierSummary] = useState('');
  const [savingDossier, setSavingDossier] = useState(false);

  const [importText, setImportText] = useState('');
  const [importTrace, setImportTrace] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecordSummary | null>(null);

  useEffect(() => {
    setActiveTab(tabFromParam(defaultTab));
  }, [defaultTab]);

  const setTab = (tab: DossierTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    if (tab !== 'consultation') params.delete('appointmentId');
    else if (initialAppointmentId) params.set('appointmentId', initialAppointmentId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const [versions, setVersions] = useState<
    Array<{
      id: string;
      createdAt: string;
      snapshot: unknown;
      changeSummary?: string;
      editedBy: { displayName: string; email: string };
    }>
  >([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [doctorLabel, setDoctorLabel] = useState('Médecin');

  const reload = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        patientsApi.getById(patientId) as Promise<Patient>,
        patientsApi.getMedicalTimelineByPatientId(patientId),
      ]);
      setPatient(p);
      setTimeline(t);
    } catch {
      setError('Chargement du dossier impossible (droits ou réseau).');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (isReadOnly) return;
    doctorsApi
      .getMe()
      .then((d) => {
        const u = d.user;
        const n = [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();
        if (n) setDoctorLabel(`Dr ${n}`);
      })
      .catch(() => undefined);
  }, [isReadOnly]);

  useEffect(() => {
    if (!selectedRecord) {
      setVersions([]);
      return;
    }
    setLoadingVersions(true);
    clinicalRecordsApi
      .getVersions(selectedRecord.id)
      .then(setVersions)
      .catch(() => setVersions([]))
      .finally(() => setLoadingVersions(false));
  }, [selectedRecord]);

  const displayName = useMemo(() => {
    if (!patient) return '';
    const u = patient.user;
    return [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email;
  }, [patient]);

  const saveClinicalNote = async () => {
    setSavingNote(true);
    try {
      await clinicalRecordsApi.create({
        patientId,
        appointmentId: appointmentId || undefined,
        structuredData: toStructuredPayload(structured),
        title: title || undefined,
        narrative: narrative || undefined,
      });
      setTitle('Consultation');
      setNarrative('');
      setStructured(emptyStructured());
      setAppointmentId('');
      await reload();
    } catch {
      setError('Enregistrement de la note clinique refusé.');
    } finally {
      setSavingNote(false);
    }
  };

  const saveDossierPatch = async () => {
    setSavingDossier(true);
    try {
      const allergies = dossierAllergies
        .split(/[,;\n]+/)
        .map((x) => x.trim())
        .filter(Boolean);
      await patientsApi.patchMedical(patientId, {
        medicalData: allergies.length ? { allergies } : undefined,
        diagnoses:
          dxCode && dxLabel
            ? [{ code: dxCode.trim(), label: dxLabel.trim(), notes: undefined }]
            : undefined,
        summary: dossierSummary || undefined,
      });
      setDxCode('');
      setDxLabel('');
      await reload();
    } catch {
      setError('Mise à jour du dossier refusée (CIM-10 ou droits).');
    } finally {
      setSavingDossier(false);
    }
  };

  const runImport = async () => {
    setImporting(true);
    try {
      const parsed = JSON.parse(importText) as Record<string, unknown>;
      const medicalData = (parsed.medicalData as Record<string, unknown> | undefined) ?? parsed;
      const diagnoses = parsed.diagnoses as
        | Array<{ code: string; label: string; notes?: string }>
        | undefined;
      await clinicalRecordsApi.importDossier(patientId, {
        medicalData: typeof medicalData === 'object' && medicalData && !Array.isArray(medicalData) ? medicalData : undefined,
        diagnoses,
        summary: typeof parsed.summary === 'string' ? parsed.summary : 'Import JSON',
        createClinicalTrace: importTrace,
      });
      setImportText('');
      await reload();
    } catch {
      setError('Import invalide : JSON attendu { medicalData?, diagnoses? }.');
    } finally {
      setImporting(false);
    }
  };

  if (loading && !patient) {
    return (
      <DashboardLayout role={layoutRole}>
        <p className="p-8 text-sm text-slate-500">Chargement du dossier…</p>
      </DashboardLayout>
    );
  }

  if (error && !patient) {
    return (
      <DashboardLayout role={layoutRole}>
        <div className="mx-auto max-w-lg p-8">
          <p className="text-sm text-red-800">{error}</p>
          <Button variant="outline" className="mt-4 rounded-lg" asChild>
            <Link href={listPath}>Retour</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const clinical = timeline?.clinicalRecords ?? [];
  const audits = timeline?.dossierAudits ?? [];
  const appts = timeline?.appointmentSummaries ?? [];
  const timelineRows = buildTimelineRows(appts, clinical, audits);

  const tabTriggerClass =
    'rounded-none border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-slate-600 data-active:border-cyan-600 data-active:text-slate-900';

  return (
    <DashboardLayout role={layoutRole}>
      <DoctorPageShell className="space-y-5 pb-10">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Button variant="ghost" size="sm" className="-ml-2 mb-1 h-8 text-xs text-slate-500" asChild>
              <Link href={listPath}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Patients
              </Link>
            </Button>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {displayName || 'Patient'}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">Dossier médical — consultation, ordonnances et documents</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="rounded-md border-slate-200" onClick={() => setTab('consultation')}>
              <Stethoscope className="mr-1.5 h-4 w-4" />
              Consultation
            </Button>
            <Button size="sm" variant="outline" className="rounded-md border-slate-200" onClick={() => setTab('ordonnances')}>
              <FileText className="mr-1.5 h-4 w-4" />
              Ordonnance
            </Button>
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950">{error}</p>
        ) : null}
        {isReadOnly ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {isTrainee
              ? 'Mode stagiaire : lecture seule.'
              : 'Mode secrétaire : consultation sans édition clinique.'}
          </p>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
          {patient ? (
            <DoctorPatientDossierSidebar
              patient={patient}
              displayName={displayName}
              listPath={listPath}
              loading={loading}
              onRefresh={() => void reload()}
              apptCount={appts.length}
              clinicalCount={clinical.length}
            />
          ) : null}

          <Tabs value={activeTab} onValueChange={(v) => setTab(v as DossierTab)} className="min-w-0">
            <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-slate-200 bg-transparent p-0">
              <TabsTrigger value="timeline" className={tabTriggerClass}>
                <History className="mr-1.5 h-4 w-4" />
                Parcours
              </TabsTrigger>
              <TabsTrigger value="consultation" className={tabTriggerClass}>
                <ClipboardList className="mr-1.5 h-4 w-4" />
                Consultation
              </TabsTrigger>
              <TabsTrigger value="ordonnances" className={tabTriggerClass}>
                <FileText className="mr-1.5 h-4 w-4" />
                Ordonnances
              </TabsTrigger>
              <TabsTrigger value="documents" className={tabTriggerClass}>
                <FolderOpen className="mr-1.5 h-4 w-4" />
                {isTrainee ? 'Imagerie' : 'Documents'}
              </TabsTrigger>
              {!isReadOnly ? (
                <TabsTrigger value="dossier" className={tabTriggerClass}>
                  Dossier médical
                </TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="timeline" className="mt-4 space-y-4 focus-visible:outline-none">
              <DoctorSection
                title="Historique"
                description="Rendez-vous, notes cliniques et mises à jour du dossier — du plus récent au plus ancien."
              >
                <DoctorPatientDossierTimeline
                  rows={timelineRows}
                  patientId={patientId}
                  selectedRecordId={selectedRecord?.id}
                  onSelectRecord={setSelectedRecord}
                />
              </DoctorSection>

              {selectedRecord ? (
                <div className={cn(DOCTOR_CARD, 'p-4 sm:p-5')}>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {selectedRecord.title || 'Note clinique'} — historique des versions
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatShortDate(selectedRecord.createdAt)} · {selectedRecord.author.displayName}
                  </p>
                  {loadingVersions ? (
                    <p className="mt-3 text-sm text-slate-500">Chargement…</p>
                  ) : versions.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">Aucune version antérieure.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {versions.map((v) => (
                        <li key={v.id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                          <p className="font-medium text-slate-800">{formatShortDate(v.createdAt)}</p>
                          <p className="text-slate-600">{v.editedBy.displayName}</p>
                          {v.changeSummary ? <p className="mt-1 text-slate-700">{v.changeSummary}</p> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!isReadOnly ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-md"
                        onClick={() => {
                          setTitle(selectedRecord.title || '');
                          setNarrative(selectedRecord.narrative || '');
                          setStructured(parseStructured(selectedRecord.structuredData as Record<string, unknown>));
                          setTab('consultation');
                        }}
                      >
                        Modifier dans Consultation
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="consultation" className="mt-4 focus-visible:outline-none">
              <DoctorConsultationWorkspace
                patientId={patientId}
                patientDateOfBirth={patient?.dateOfBirth ?? null}
                appointments={appts}
                readOnly={isReadOnly}
                initialAppointmentId={initialAppointmentId}
                onSaved={() => void reload()}
              />
            </TabsContent>

            <TabsContent value="ordonnances" className="mt-4 space-y-4 focus-visible:outline-none">
              <PrescriptionForm
                patientId={patientId}
                consultationId={initialAppointmentId}
                readOnly={isReadOnly}
                onCreated={() => void reload()}
              />
              <DoctorPrescriptionWorkspace
                patientId={patientId}
                patient={patient}
                appointments={appts}
                readOnly={isReadOnly}
                onSaved={() => void reload()}
              />
            </TabsContent>

            <TabsContent value="documents" className="mt-4 space-y-4 focus-visible:outline-none">
              {isTrainee ? (
                <TraineePatientImagingPanel patientId={patientId} />
              ) : (
                <>
                  <DocumentsList patientId={patientId} />
                  <ReportEditor patientId={patientId} consultationId={initialAppointmentId} readOnly={isReadOnly} />
                  <DoctorPatientDocumentsPanel
                    patientId={patientId}
                    patientName={displayName}
                    doctorName={doctorLabel}
                    readOnly={isReadOnly}
                  />
                </>
              )}
            </TabsContent>

            {!isReadOnly ? (
              <TabsContent value="dossier" className="mt-4 space-y-4 focus-visible:outline-none">
                <div className={cn(DOCTOR_CARD, 'p-4 sm:p-5')}>
                  <h3 className="text-sm font-semibold text-slate-900">Mettre à jour le dossier</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Allergies, diagnostic CIM-10 — chaque modification est tracée.
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Allergies (liste séparée par virgules)</Label>
                      <Input
                        value={dossierAllergies}
                        onChange={(e) => setDossierAllergies(e.target.value)}
                        className="rounded-md"
                        placeholder="Ex. Aspirine, Pénicilline"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Code CIM-10</Label>
                        <Input value={dxCode} onChange={(e) => setDxCode(e.target.value)} placeholder="H52.0" className="rounded-md" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Libellé diagnostic</Label>
                        <Input value={dxLabel} onChange={(e) => setDxLabel(e.target.value)} className="rounded-md" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Commentaire d&apos;audit (optionnel)</Label>
                      <Input value={dossierSummary} onChange={(e) => setDossierSummary(e.target.value)} className="rounded-md" />
                    </div>
                    <Button variant="secondary" disabled={savingDossier} onClick={() => void saveDossierPatch()}>
                      {savingDossier ? 'Enregistrement…' : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </div>

                <details className={cn(DOCTOR_CARD, 'group p-4 sm:p-5')}>
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 marker:content-none">
                    Import avancé (JSON)
                  </summary>
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-500">
                      Réservé à la migration de données. Format : medicalData, diagnoses, summary.
                    </p>
                    <textarea
                      className="min-h-[120px] w-full rounded-md border border-slate-200 font-mono text-xs"
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder='{ "medicalData": {}, "diagnoses": [] }'
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={importTrace} onChange={(e) => setImportTrace(e.target.checked)} />
                      Créer une trace dans le parcours
                    </label>
                    <Button variant="outline" size="sm" disabled={importing} onClick={() => void runImport()}>
                      {importing ? 'Import…' : 'Importer'}
                    </Button>
                  </div>
                </details>
              </TabsContent>
            ) : null}
          </Tabs>
        </div>
      </DoctorPageShell>
    </DashboardLayout>
  );
}
