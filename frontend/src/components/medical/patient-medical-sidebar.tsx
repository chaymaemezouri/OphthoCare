'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Heart, Pill, UserCircle } from 'lucide-react';
import { patientsApi } from '@/lib/api';
import type { Patient } from '@/types/patient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function initials(p: Patient) {
  const u = p.user;
  const a = (u.firstName?.[0] || '').toUpperCase();
  const b = (u.lastName?.[0] || '').toUpperCase();
  if (a && b) return `${a}${b}`;
  if (a) return a;
  if (u.email?.[0]) return u.email[0].toUpperCase();
  return '?';
}

export function PatientMedicalSidebar() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    patientsApi
      .getMe()
      .then(setPatient)
      .catch(() => setError('Impossible de charger le profil.'));
  }, []);

  if (error) {
    return (
      <Card className="border-amber-200 bg-amber-50/80">
        <CardContent className="p-4 text-sm text-amber-900">{error}</CardContent>
      </Card>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="h-4 w-full max-w-[14rem] animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-2/3 max-w-[10rem] animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  const u = patient.user;
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email;
  const allergies = patient.medicalData?.allergies ?? [];
  const chronic = patient.medicalData?.chronicDiseases ?? [];
  const meds = patient.medicalData?.medications ?? [];

  return (
    <Card className="border-slate-200/90 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            {initials(patient)}
          </div>
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold text-slate-900">
              <UserCircle className="h-4 w-4 text-slate-400" />
              <span className="truncate">{name}</span>
            </CardTitle>
            <p className="mt-0.5 truncate text-xs text-slate-500">{u.email}</p>
            <Badge variant="secondary" className="mt-2 rounded-md text-[10px] font-semibold uppercase">
              Dossier patient
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 text-sm">
        {patient.dateOfBirth ? (
          <div className="flex items-start gap-2 text-slate-700">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Naissance</p>
              <p className="font-medium">{patient.dateOfBirth}</p>
            </div>
          </div>
        ) : null}
        <div className="flex items-start gap-2 text-slate-700">
          <Heart className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Allergies</p>
            <p className="font-medium leading-snug">
              {allergies.length ? allergies.join(', ') : 'Non renseignées'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-slate-700">
          <Pill className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Antécédents</p>
            <p className="font-medium leading-snug">
              {chronic.length ? chronic.join(', ') : 'Aucun antécédent saisi'}
            </p>
          </div>
        </div>
        {meds.length ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Traitements</p>
            <ul className="mt-1 list-inside list-disc text-slate-700">
              {meds.map((m, i) => (
                <li key={i}>
                  {m.name}
                  {m.dosage ? <span className="text-slate-500"> — {m.dosage}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <Button variant="outline" size="sm" className="w-full rounded-lg" asChild>
          <Link href="/dashboard/patient/profile">Modifier le profil complet</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
