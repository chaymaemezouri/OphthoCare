"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Intégration des Équipements</h2>
            <p className="text-[13px] text-slate-500 font-medium">Gestion et synchronisation des machines médicales</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
              <RefreshCw className="mr-2 h-3.5 w-3.5 text-slate-400" />
              Actualiser Tout
            </Button>
            <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-all shadow-sm">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Ajouter une Machine
            </Button>
          </div>
        </div>

        {/* Machine Status Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Data Sync Log */}
        <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 py-4 px-6 bg-slate-50/30">
            <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-900">Journal de Synchronisation (DICOM/HL7)</CardTitle>
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
      </div>
    </DashboardLayout>
  );
}
