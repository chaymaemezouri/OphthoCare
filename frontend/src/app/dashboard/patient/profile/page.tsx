'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Calendar,
  FileSignature,
  HeartPulse,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { useAuth, useRequireAuth } from '@/hooks/use-auth';
import { usePatientProfile } from '@/hooks/use-patient-profile';
import { usePatientAppointments } from '@/hooks/use-patient-appointments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientPageHeader } from '@/components/patient/patient-page-header';
import { PatientPageShell } from '@/components/patient/patient-page-shell';
import { PATIENT_CARD } from '@/components/patient/patient-dashboard-shell';
import { cn } from '@/lib/utils';
import { formatShortDate } from '@/lib/utils/date';
import { patientsApi, usersApi } from '@/lib/api';
import type { Appointment, Cim10Diagnosis, FamilyMember, MedicalData } from '@/types';

const fieldClass =
  'flex min-h-[88px] w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100';

function doctorLabel(d: Appointment['doctor']) {
  const u = d.user;
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return name || u.email || 'Médecin';
}

function parseList(s: string): string[] {
  return s
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function medsToLines(m?: MedicalData['medications']): string {
  if (!m?.length) return '';
  return m.map((x) => `${x.name} | ${x.dosage} | ${x.duration}`).join('\n');
}

function linesToMeds(text: string): MedicalData['medications'] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: NonNullable<MedicalData['medications']> = [];
  for (const line of lines) {
    const [name, dosage, duration] = line.split('|').map((x) => x.trim());
    if (name) out.push({ name, dosage: dosage || '—', duration: duration || '—' });
  }
  return out.length ? out : undefined;
}

type Banner = { variant: 'success' | 'warning' | 'error'; text: string };

export default function PatientProfilePage() {
  useRequireAuth();
  const { update } = useSession();
  const { user, isLoading: authLoading } = useAuth();
  const { draft, setDraft, loading, save, patientId, reload } = usePatientProfile(user?.id);
  const { appointments, loading: rdvLoading } = usePatientAppointments(user?.id);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [banner, setBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [consentType, setConsentType] = useState('treatment_data');
  const [consentMsg, setConsentMsg] = useState<string | null>(null);
  const [consentLoading, setConsentLoading] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
  }, [user?.firstName, user?.lastName]);

  const allergiesStr = (draft.medicalData?.allergies ?? []).join(', ');
  const chronicStr = (draft.medicalData?.chronicDiseases ?? []).join(', ');
  const medsStr = medsToLines(draft.medicalData?.medications);

  const doctorHistory = useMemo(() => {
    const map = new Map<
      string,
      { doctor: Appointment['doctor']; lastVisit: string; visitCount: number }
    >();
    for (const a of appointments) {
      const id = a.doctor.id;
      const prev = map.get(id);
      if (!prev) {
        map.set(id, { doctor: a.doctor, lastVisit: a.startTime, visitCount: 1 });
      } else {
        const lastVisit =
          new Date(a.startTime) > new Date(prev.lastVisit) ? a.startTime : prev.lastVisit;
        map.set(id, { doctor: a.doctor, lastVisit, visitCount: prev.visitCount + 1 });
      }
    }
    return [...map.values()].sort(
      (x, y) => new Date(y.lastVisit).getTime() - new Date(x.lastVisit).getTime(),
    );
  }, [appointments]);

  const handleSaveAll = useCallback(async () => {
    setBanner(null);
    setSaving(true);
    let userRemote = false;
    try {
      await usersApi.patchMe({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      userRemote = true;
      if (typeof update === 'function') {
        try {
          await update({
            firstName: firstName.trim() || undefined,
            lastName: lastName.trim() || undefined,
          });
        } catch {
          /* session JWT : non bloquant si la synchro locale échoue */
        }
      }
    } catch {
      setBanner({
        variant: 'error',
        text: 'Le prénom / nom n’ont pas pu être mis à jour. Vérifiez la session ou réessayez.',
      });
      setSaving(false);
      return;
    }

    const { remote, error } = await save();
    if (remote && userRemote) {
      setBanner({
        variant: 'success',
        text: 'Profil complet enregistré sur le serveur (compte + dossier patient).',
      });
    } else if (!remote && error) {
      setBanner({
        variant: 'warning',
        text: userRemote
          ? `Compte mis à jour. Dossier patient : ${error}`
          : `Enregistrement incomplet. ${error}`,
      });
    } else {
      setBanner({
        variant: 'warning',
        text: userRemote
          ? 'Compte mis à jour. Dossier patient uniquement sur cet appareil — vérifiez la connexion ou les données (ex. code CIM-10 : H25.9).'
          : 'Données enregistrées localement uniquement.',
      });
    }
    setSaving(false);
  }, [firstName, lastName, save, update]);

  const recordConsent = async () => {
    if (!patientId) {
      setConsentMsg('Profil patient non chargé depuis le serveur. Enregistrez d’abord le dossier ou vérifiez la connexion.');
      return;
    }
    setConsentLoading(true);
    setConsentMsg(null);
    try {
      await patientsApi.postConsent(patientId, {
        type: consentType,
        signedAt: new Date().toISOString(),
      });
      setConsentMsg('Consentement enregistré et horodaté côté serveur.');
    } catch {
      setConsentMsg('Enregistrement impossible (réseau ou session).');
    } finally {
      setConsentLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <PatientPageShell className="space-y-6">
          <div className={PATIENT_CARD + ' p-6'}>
            <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-3 h-8 w-56 animate-pulse rounded-lg bg-slate-100" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="h-24 animate-pulse rounded-xl bg-slate-50" />
              <div className="h-24 animate-pulse rounded-xl bg-slate-50" />
            </div>
          </div>
      </PatientPageShell>
    );
  }

  const cardClass = PATIENT_CARD;

  return (
    <PatientPageShell className="space-y-6 md:space-y-8">
        <PatientPageHeader
          variant="compact"
          title="Profil santé"
          description="Identité du compte, couverture, antécédents et déclarations — partagés avec les cabinets où vous consultez."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                onClick={() => void reload()}
              >
                <RefreshCw className="mr-1.5 h-4 w-4 opacity-80" aria-hidden />
                Recharger
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg border-zinc-200" asChild>
                <Link href="/search">
                  <Search className="mr-1.5 h-4 w-4" aria-hidden />
                  Réserver
                </Link>
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-lg bg-zinc-900 font-medium text-white shadow-sm hover:bg-zinc-800"
                disabled={saving}
                onClick={() => void handleSaveAll()}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                    Enregistrement…
                  </>
                ) : (
                  'Tout enregistrer'
                )}
              </Button>
            </>
          }
        />

        {banner ? (
          <div
            className={cn(
              'rounded-xl border px-4 py-3 text-sm',
              banner.variant === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-950',
              banner.variant === 'warning' && 'border-amber-200 bg-amber-50 text-amber-950',
              banner.variant === 'error' && 'border-red-200 bg-red-50 text-red-950',
            )}
          >
            {banner.text}
          </div>
        ) : null}

        <Tabs defaultValue="identity" className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl border border-zinc-200/80 bg-zinc-100/90 p-1">
            <TabsTrigger
              value="identity"
              className="flex-1 gap-1.5 rounded-xl py-2.5 text-xs font-medium data-active:bg-white data-active:text-blue-700 data-active:shadow-sm sm:flex-none sm:px-4 sm:text-sm"
            >
              <User className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              Identité
            </TabsTrigger>
            <TabsTrigger
              value="coverage"
              className="flex-1 gap-1.5 rounded-xl py-2.5 text-xs font-medium data-active:bg-white data-active:text-blue-700 data-active:shadow-sm sm:flex-none sm:px-4 sm:text-sm"
            >
              <Shield className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              Couverture
            </TabsTrigger>
            <TabsTrigger
              value="health"
              className="flex-1 gap-1.5 rounded-xl py-2.5 text-xs font-medium data-active:bg-white data-active:text-blue-700 data-active:shadow-sm sm:flex-none sm:px-4 sm:text-sm"
            >
              <HeartPulse className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              Santé
            </TabsTrigger>
            <TabsTrigger
              value="family"
              className="flex-1 gap-1.5 rounded-xl py-2.5 text-xs font-medium data-active:bg-white data-active:text-blue-700 data-active:shadow-sm sm:flex-none sm:px-4 sm:text-sm"
            >
              <Users className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              Famille
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex-1 gap-1.5 rounded-xl py-2.5 text-xs font-medium data-active:bg-white data-active:text-blue-700 data-active:shadow-sm sm:flex-none sm:px-4 sm:text-sm"
            >
              <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              Suivi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="mt-6 space-y-6 outline-none sm:mt-8">
            <Card className={cardClass}>
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-base font-semibold text-zinc-900">Compte & identité</CardTitle>
                <CardDescription className="text-xs text-zinc-600">
                  Email de connexion :{' '}
                  <span className="font-medium text-zinc-900">{user?.email}</span> — mot de passe et 2FA dans{' '}
                  <Link href="/account" className="font-medium text-blue-700 underline-offset-4 hover:underline">
                    Compte & sécurité
                  </Link>
                  .
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fn">Prénom</Label>
                  <Input
                    id="fn"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-lg border-zinc-200"
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ln">Nom</Label>
                  <Input
                    id="ln"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-lg border-zinc-200"
                    autoComplete="family-name"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={draft.phoneNumber ?? ''}
                    onChange={(e) => setDraft({ phoneNumber: e.target.value })}
                    placeholder="+212 …"
                    className="rounded-lg border-zinc-200"
                    autoComplete="tel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date de naissance</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={draft.dateOfBirth ?? ''}
                    onChange={(e) => setDraft({ dateOfBirth: e.target.value })}
                    className="rounded-lg border-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Select value={draft.gender ?? ''} onValueChange={(v) => setDraft({ gender: v || undefined })}>
                    <SelectTrigger className="rounded-lg border-zinc-200">
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Féminin</SelectItem>
                      <SelectItem value="male">Masculin</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                      <SelectItem value="unspecified">Non précisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nid">Numéro d&apos;identité (CIN / passeport)</Label>
                  <Input
                    id="nid"
                    value={draft.nationalId ?? ''}
                    onChange={(e) => setDraft({ nationalId: e.target.value })}
                    className="rounded-lg border-zinc-200"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="addr">Adresse</Label>
                  <textarea
                    id="addr"
                    className={fieldClass}
                    value={draft.address ?? ''}
                    onChange={(e) => setDraft({ address: e.target.value })}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-base font-semibold text-zinc-900">Contact d&apos;urgence</CardTitle>
                <CardDescription className="text-xs text-zinc-600">
                  Personne à prévenir en cas d&apos;urgence (tous les champs sont requis pour l&apos;envoi au serveur).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="ecn">Nom</Label>
                  <Input
                    id="ecn"
                    value={draft.emergencyContact?.name ?? ''}
                    onChange={(e) =>
                      setDraft({
                        emergencyContact: {
                          name: e.target.value,
                          relation: draft.emergencyContact?.relation ?? '',
                          phone: draft.emergencyContact?.phone ?? '',
                        },
                      })
                    }
                    className="rounded-lg border-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ecr">Lien</Label>
                  <Input
                    id="ecr"
                    value={draft.emergencyContact?.relation ?? ''}
                    onChange={(e) =>
                      setDraft({
                        emergencyContact: {
                          name: draft.emergencyContact?.name ?? '',
                          relation: e.target.value,
                          phone: draft.emergencyContact?.phone ?? '',
                        },
                      })
                    }
                    className="rounded-lg border-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ecp">Téléphone</Label>
                  <Input
                    id="ecp"
                    value={draft.emergencyContact?.phone ?? ''}
                    onChange={(e) =>
                      setDraft({
                        emergencyContact: {
                          name: draft.emergencyContact?.name ?? '',
                          relation: draft.emergencyContact?.relation ?? '',
                          phone: e.target.value,
                        },
                      })
                    }
                    className="rounded-lg border-zinc-200"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coverage" className="mt-6 space-y-6 outline-none sm:mt-8">
            <Card className={cardClass}>
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-base font-semibold text-zinc-900">Couverture sociale</CardTitle>
                <CardDescription className="text-xs text-zinc-600">
                  CNSS, AMO, mutuelle — utiles pour la facturation et les démarches au cabinet.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Type de couverture</Label>
                  <Select
                    value={draft.insuranceProvider ?? ''}
                    onValueChange={(v) => setDraft({ insuranceProvider: v || undefined })}
                  >
                    <SelectTrigger className="rounded-lg border-zinc-200">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNSS">CNSS</SelectItem>
                      <SelectItem value="AMO">AMO</SelectItem>
                      <SelectItem value="Mutuelle">Mutuelle</SelectItem>
                      <SelectItem value="Privé">Privé (sans prise en charge)</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cnss">N° affiliation CNSS</Label>
                  <Input
                    id="cnss"
                    value={draft.cnssAffiliation ?? ''}
                    onChange={(e) => setDraft({ cnssAffiliation: e.target.value })}
                    className="rounded-lg border-zinc-200"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="amo">N° droits AMO</Label>
                  <Input
                    id="amo"
                    value={draft.amoRightsNumber ?? ''}
                    onChange={(e) => setDraft({ amoRightsNumber: e.target.value })}
                    className="rounded-lg border-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mut">Mutuelle (organisme)</Label>
                  <Input
                    id="mut"
                    value={draft.mutuelleName ?? ''}
                    onChange={(e) => setDraft({ mutuelleName: e.target.value })}
                    className="rounded-lg border-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mutn">N° contrat mutuelle</Label>
                  <Input
                    id="mutn"
                    value={draft.mutuelleContractNumber ?? ''}
                    onChange={(e) => setDraft({ mutuelleContractNumber: e.target.value })}
                    className="rounded-lg border-zinc-200"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="insNum">N° adhérent / police (générique)</Label>
                  <Input
                    id="insNum"
                    value={draft.insuranceNumber ?? ''}
                    onChange={(e) => setDraft({ insuranceNumber: e.target.value })}
                    className="rounded-lg border-zinc-200"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="covamt">Synthèse régime & taux (visible cabinet)</Label>
                  <textarea
                    id="covamt"
                    className={fieldClass}
                    value={draft.insuranceCoverage ?? ''}
                    onChange={(e) => setDraft({ insuranceCoverage: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cov">Remarques complémentaires (contexte, pièces…)</Label>
                  <textarea
                    id="cov"
                    className={fieldClass}
                    value={draft.coverageNotes ?? ''}
                    onChange={(e) => setDraft({ coverageNotes: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="mt-6 space-y-6 outline-none sm:mt-8">
            <Card className={cardClass}>
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-base font-semibold text-zinc-900">Données médicales de base</CardTitle>
                <CardDescription className="text-xs text-zinc-600">
                  Allergies, antécédents et traitements — aussi modifiables depuis le dossier médical.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="blood">Groupe sanguin (optionnel)</Label>
                  <Input
                    id="blood"
                    value={draft.bloodType ?? draft.medicalData?.bloodGroup ?? ''}
                    onChange={(e) => {
                      const v = e.target.value || undefined;
                      setDraft({
                        bloodType: v,
                        medicalData: { ...draft.medicalData, bloodGroup: v },
                      });
                    }}
                    placeholder="Ex. A+"
                    className="rounded-lg border-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies (virgules)</Label>
                  <textarea
                    id="allergies"
                    className={fieldClass}
                    value={allergiesStr}
                    onChange={(e) =>
                      setDraft({
                        medicalData: {
                          ...draft.medicalData,
                          allergies: parseList(e.target.value),
                        },
                      })
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chronic">Antécédents / maladies chroniques</Label>
                  <textarea
                    id="chronic"
                    className={fieldClass}
                    value={chronicStr}
                    onChange={(e) =>
                      setDraft({
                        medicalData: {
                          ...draft.medicalData,
                          chronicDiseases: parseList(e.target.value),
                        },
                      })
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meds">Traitements (une ligne : nom | posologie | durée)</Label>
                  <textarea
                    id="meds"
                    className={fieldClass + ' min-h-[100px] font-mono text-[13px]'}
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
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-base font-semibold text-zinc-900">Diagnostics CIM-10 (déclaratif)</CardTitle>
                <CardDescription className="text-xs text-zinc-600">
                  Format code OMS (ex. H25.9). Le médecin valide en consultation. Notes facultatives.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {(draft.diagnoses ?? []).map((d, index) => (
                  <div
                    key={index}
                    className="space-y-3 rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-4 ring-1 ring-zinc-100"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-zinc-500">Code CIM-10</Label>
                        <Input
                          placeholder="ex. H25.9"
                          value={d.code}
                          onChange={(e) => {
                            const list = [...(draft.diagnoses ?? [])];
                            list[index] = { ...list[index], code: e.target.value };
                            setDraft({ diagnoses: list });
                          }}
                          className="rounded-lg border-zinc-200 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-zinc-500">Libellé</Label>
                        <Input
                          placeholder="Cataracte sénile, non précisée"
                          value={d.label}
                          onChange={(e) => {
                            const list = [...(draft.diagnoses ?? [])];
                            list[index] = { ...list[index], label: e.target.value };
                            setDraft({ diagnoses: list });
                          }}
                          className="rounded-lg border-zinc-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-500">Notes (facultatif)</Label>
                      <Input
                        placeholder="Contexte, œil concerné…"
                        value={d.notes ?? ''}
                        onChange={(e) => {
                          const list = [...(draft.diagnoses ?? [])];
                          list[index] = { ...list[index], notes: e.target.value || undefined };
                          setDraft({ diagnoses: list });
                        }}
                        className="rounded-lg border-zinc-200"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-rose-700 hover:text-rose-900"
                        onClick={() => {
                          const list = [...(draft.diagnoses ?? [])];
                          list.splice(index, 1);
                          setDraft({ diagnoses: list.length ? list : undefined });
                        }}
                      >
                        Retirer
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-zinc-200"
                  onClick={() =>
                    setDraft({
                      diagnoses: [...(draft.diagnoses ?? []), { code: '', label: '' } as Cim10Diagnosis],
                    })
                  }
                >
                  Ajouter un diagnostic
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="family" className="mt-6 space-y-6 outline-none sm:mt-8">
            <Card className={cardClass}>
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-base font-semibold text-zinc-900">Famille & ayants droit</CardTitle>
                <CardDescription className="text-xs text-zinc-600">
                  Personnes à mentionner pour la prise en charge ou les urgences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {(draft.familyMembers ?? []).map((m, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-xl border border-zinc-200/90 bg-white p-4 sm:grid-cols-3"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-500">Nom</Label>
                      <Input
                        value={m.name}
                        onChange={(e) => {
                          const list = [...(draft.familyMembers ?? [])];
                          list[index] = { ...list[index], name: e.target.value };
                          setDraft({ familyMembers: list });
                        }}
                        className="rounded-lg border-zinc-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-500">Lien</Label>
                      <Input
                        placeholder="Conjoint, enfant…"
                        value={m.relationship}
                        onChange={(e) => {
                          const list = [...(draft.familyMembers ?? [])];
                          list[index] = { ...list[index], relationship: e.target.value };
                          setDraft({ familyMembers: list });
                        }}
                        className="rounded-lg border-zinc-200"
                      />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Label className="text-xs text-zinc-500">Naissance</Label>
                        <Input
                          type="date"
                          value={m.dateOfBirth ?? ''}
                          onChange={(e) => {
                            const list = [...(draft.familyMembers ?? [])];
                            list[index] = { ...list[index], dateOfBirth: e.target.value || undefined };
                            setDraft({ familyMembers: list });
                          }}
                          className="rounded-lg border-zinc-200"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-rose-700 hover:text-rose-900"
                        onClick={() => {
                          const list = [...(draft.familyMembers ?? [])];
                          list.splice(index, 1);
                          setDraft({ familyMembers: list.length ? list : undefined });
                        }}
                      >
                        Retirer
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-zinc-200"
                  onClick={() =>
                    setDraft({
                      familyMembers: [...(draft.familyMembers ?? []), { name: '', relationship: '' } as FamilyMember],
                    })
                  }
                >
                  Ajouter une personne
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-6 space-y-6 outline-none sm:mt-8">
            <Card className={cardClass}>
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
                  <FileSignature className="h-4 w-4 text-blue-700" aria-hidden />
                  Consentements
                </CardTitle>
                <CardDescription className="text-xs text-zinc-600">
                  Enregistrement horodaté (POST /patients/:id/consent). Peut être renouvelé pour le même type.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={consentType} onValueChange={(v) => setConsentType(v || 'treatment_data')}>
                    <SelectTrigger className="max-w-md rounded-lg border-zinc-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="treatment_data">Données de soins</SelectItem>
                      <SelectItem value="teleconsultation">Téléconsultation</SelectItem>
                      <SelectItem value="research">Recherche (anonymisée)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {consentMsg ? <p className="text-sm text-zinc-700">{consentMsg}</p> : null}
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg border-zinc-200"
                  disabled={consentLoading || !patientId}
                  onClick={() => void recordConsent()}
                >
                  {consentLoading ? 'Envoi…' : 'Signer et enregistrer'}
                </Button>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-base font-semibold text-zinc-900">Médecins vus</CardTitle>
                <CardDescription className="text-xs text-zinc-600">
                  Synthèse issue de vos rendez-vous {rdvLoading ? '(chargement…)' : ''}.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {doctorHistory.length === 0 ? (
                  <p className="text-sm text-zinc-600">
                    Aucun historique pour le moment.{' '}
                    <Link href="/search" className="font-medium text-blue-700 underline-offset-4 hover:underline">
                      Rechercher un praticien
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-zinc-200/80">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-200 hover:bg-transparent">
                          <TableHead className="text-zinc-600">Médecin</TableHead>
                          <TableHead className="text-zinc-600">Ville</TableHead>
                          <TableHead className="text-zinc-600">Dernière visite</TableHead>
                          <TableHead className="text-right text-zinc-600">RDV</TableHead>
                          <TableHead className="w-[1%] text-zinc-600" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {doctorHistory.map((row) => (
                          <TableRow key={row.doctor.id} className="border-zinc-100">
                            <TableCell className="font-medium text-zinc-900">{doctorLabel(row.doctor)}</TableCell>
                            <TableCell className="text-zinc-600">{row.doctor.city}</TableCell>
                            <TableCell className="text-zinc-600">{formatShortDate(row.lastVisit)}</TableCell>
                            <TableCell className="text-right tabular-nums text-zinc-700">{row.visitCount}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-blue-700" asChild>
                                <Link href={`/doctor/${row.doctor.id}`}>Voir</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-3 border-t border-zinc-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            Lié à votre compte sur tous vos appareils après synchronisation.{' '}
            <Link href="/dashboard/patient/medical-records" className="font-medium text-blue-700 underline-offset-4 hover:underline">
              Dossier médical
            </Link>
          </p>
          <Button
            type="button"
            className="rounded-lg bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700 sm:min-w-[10rem]"
            disabled={saving}
            onClick={() => void handleSaveAll()}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                Enregistrement…
              </>
            ) : (
              'Tout enregistrer'
            )}
          </Button>
        </div>
    </PatientPageShell>
  );
}
