'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { useAuth, useRequireAuth } from '@/hooks/use-auth';
import { MedicalRecordsDisplay, MedicalDataEditor } from '@/components/medical/medical-records';
import { PatientMedicalSidebar } from '@/components/medical/patient-medical-sidebar';
import { PatientPageHeader } from '@/components/patient/patient-page-header';
import { PatientPageShell } from '@/components/patient/patient-page-shell';
import { PATIENT_CARD } from '@/components/patient/patient-dashboard-shell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function MedicalRecordsPage() {
  useRequireAuth();
  const { user, isLoading } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);

  if (isLoading || !user) {
    return (
      <div className="relative min-h-[40vh] p-6">
        <p className="text-sm text-stone-500">Chargement du dossier…</p>
      </div>
    );
  }

  return (
    <PatientPageShell className="space-y-6">
        <PatientPageHeader
          variant="compact"
          title="Dossier médical"
          description="Historique des soins, constantes mesurées en cabinet et informations que vous souhaitez transmettre aux praticiens."
          actions={
            <>
              <Button variant="outline" size="sm" className="rounded-lg border-stone-200" asChild>
                <Link href="/dashboard/patient/bookings">
                  <CalendarDays className="mr-1.5 h-4 w-4" aria-hidden />
                  Rendez-vous
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="rounded-lg border-stone-200"
                aria-label="Actualiser le dossier"
                title="Actualiser"
                onClick={() => setReloadKey((k) => k + 1)}
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
              </Button>
            </>
          }
        />

        <Tabs defaultValue="parcours" className="w-full">
          <TabsList className="flex h-auto w-full flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 sm:flex-row sm:gap-1">
            <TabsTrigger
              value="parcours"
              className="flex-1 rounded-lg py-2.5 text-sm font-medium data-active:bg-white data-active:text-blue-700 data-active:shadow-sm"
            >
              Parcours & constantes
            </TabsTrigger>
            <TabsTrigger
              value="donnees"
              className="flex-1 rounded-lg py-2.5 text-sm font-medium data-active:bg-white data-active:text-blue-700 data-active:shadow-sm"
            >
              Mes données
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parcours" className="mt-6 space-y-6 outline-none sm:mt-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
              <PatientMedicalSidebar />
              <div className="min-w-0">
                <MedicalRecordsDisplay reloadKey={reloadKey} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="donnees" className="mt-6 outline-none sm:mt-8">
            <MedicalDataEditor />
          </TabsContent>
        </Tabs>
    </PatientPageShell>
  );
}
