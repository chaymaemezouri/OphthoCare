"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DoctorPageShell } from "@/components/doctor/doctor-page-shell";
import { DoctorPageHeader } from "@/components/doctor/doctor-page-header";
import { DOCTOR_CARD, DOCTOR_PRIMARY_BTN } from "@/components/doctor/doctor-dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Cpu, 
  Settings, 
  Activity, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Eye,
  Microscope,
  HardDrive,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const machines = [
  { 
    id: "1", 
    name: "OCT - Zeiss Primus", 
    status: "Connecté", 
    lastSync: "Il y a 2 min", 
    type: "Imagerie", 
    icon: Eye,
    load: 12 
  },
  { 
    id: "2", 
    name: "Rétinographe Canon", 
    status: "Connecté", 
    lastSync: "Il y a 15 min", 
    type: "Imagerie", 
    icon: Microscope,
    load: 8 
  },
  { 
    id: "3", 
    name: "Auto-Réfractomètre Nidek", 
    status: "Déconnecté", 
    lastSync: "Hier", 
    type: "Mesure", 
    icon: Zap,
    load: 0 
  },
  { 
    id: "4", 
    name: "Tonomètre à air", 
    status: "Connecté", 
    lastSync: "Il y a 1 h", 
    type: "Mesure", 
    icon: Activity,
    load: 45 
  },
];

export default function MachineIntegrationPage() {
  return (
    <DashboardLayout role="medecin">
      <DoctorPageShell className="space-y-6">
        <DoctorPageHeader
          title="Équipements"
          description="Connexion et synchronisation des appareils du cabinet (démo — intégration DICOM/HL7 à venir)."
          variant="compact"
          actions={
            <>
              <Button variant="outline" size="sm" className="rounded-md border-slate-200">
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Actualiser
              </Button>
              <Button size="sm" className={DOCTOR_PRIMARY_BTN}>
                <Plus className="mr-1.5 h-4 w-4" />
                Ajouter
              </Button>
            </>
          }
        />

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Module de démonstration — les données affichées sont fictives en attendant le branchement réel aux équipements.
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {machines.map((m) => (
            <Card key={m.id} className="border-slate-100 shadow-sm bg-white overflow-hidden group">
              <CardContent className="p-0">
                <div className="p-5 border-b border-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      <m.icon className="h-5 w-5" />
                    </div>
                    <Badge className={cn(
                      "border-none rounded-md px-2 py-0.5 font-bold text-[9px] uppercase tracking-tighter",
                      m.status === "Connecté" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {m.status}
                    </Badge>
                  </div>
                  <h3 className="text-[14px] font-bold text-slate-900">{m.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{m.type}</p>
                </div>
                <div className="p-4 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dernière Sync</span>
                    <span className="text-[11px] font-semibold text-slate-600">{m.lastSync}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className={cn(DOCTOR_CARD, "overflow-hidden")}>
          <CardHeader className="border-b border-slate-100 bg-slate-50/80 py-3 px-5">
            <CardTitle className="text-sm font-semibold text-slate-900">Journal de synchronisation</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {[
                { time: "14:42", machine: "OCT Zeiss", patient: "Marie Laurent", status: "Succès", size: "42MB" },
                { time: "14:35", machine: "Rétinographe", patient: "Robert Leroy", status: "Succès", size: "12MB" },
                { time: "14:10", machine: "OCT Zeiss", patient: "Emma Blanc", status: "Erreur", size: "0MB" },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center border",
                      log.status === "Succès" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                    )}>
                      {log.status === "Succès" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">{log.machine} → {log.patient}</p>
                      <p className="text-[11px] font-medium text-slate-400">{log.time} • DICOM Transfer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{log.size}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DoctorPageShell>
    </DashboardLayout>
  );
}
