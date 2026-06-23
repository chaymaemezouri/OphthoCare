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
  Settings, 
  Server, 
  Database, 
  Activity, 
  ShieldCheck, 
  RefreshCw, 
  HardDrive, 
  Cpu,
  AlertCircle,
  CheckCircle2,
  Lock,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const systemStatus = [
  { name: "Serveur API", status: "Opérationnel", load: "12%", icon: Server, color: "text-emerald-500" },
  { name: "Base de Données", status: "Opérationnel", load: "8%", icon: Database, color: "text-emerald-500" },
  { name: "Stockage DICOM", status: "Opérationnel", load: "45%", icon: HardDrive, color: "text-emerald-500" },
  { name: "Service IA", status: "Opérationnel", load: "22%", icon: Cpu, color: "text-emerald-500" },
];

export default function AdminMaintenancePage() {
  return (
    <DashboardLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Maintenance & Système</h2>
            <p className="text-[13px] text-slate-500 font-medium">Monitoring des services et santé de la plateforme</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
              <History className="mr-2 h-3.5 w-3.5 text-slate-400" />
              Historique des interventions
            </Button>
            <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-all shadow-sm">
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Lancer un Diagnostic
            </Button>
          </div>
        </div>

        {/* System Health Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {systemStatus.map((s) => (
            <Card key={s.name} className="border-slate-100 shadow-sm bg-white overflow-hidden group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-md px-2 py-0.5 font-bold text-[9px] uppercase tracking-tighter">
                    {s.status}
                  </Badge>
                </div>
                <h3 className="text-[14px] font-bold text-slate-900">{s.name}</h3>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Charge</span>
                    <span className="text-slate-900">{s.load}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: s.load }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Security Logs */}
          <div className="lg:col-span-2">
            <Card className="border-slate-100 shadow-sm bg-white overflow-hidden h-full">
              <CardHeader className="border-b border-slate-50 py-4 px-6 bg-slate-50/30 flex flex-row items-center justify-between">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  Journal de Sécurité
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase text-slate-400">Voir tout</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {[
                    { event: "Mise à jour SSL", time: "Il y a 2h", status: "Succès", type: "Système" },
                    { event: "Backup Automatique", time: "Il y a 5h", status: "Succès", type: "Data" },
                    { event: "Tentative de connexion suspecte", time: "Hier, 23:45", status: "Bloqué", statusColor: "text-rose-500", type: "Auth" },
                  ].map((log, i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                          <ShieldCheck className="h-4 w-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-900">{log.event}</p>
                          <p className="text-[11px] font-medium text-slate-400">{log.time} • {log.type}</p>
                        </div>
                      </div>
                      <Badge className={cn(
                        "border-none rounded-md px-2 py-0.5 font-bold text-[9px] uppercase tracking-tighter",
                        log.status === "Succès" || log.status === "Bloqué" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                      )}>
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="border-slate-100 shadow-sm bg-slate-900 text-white overflow-hidden">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Actions Critiques</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-3">
                <Button className="w-full justify-start gap-3 h-11 rounded-xl bg-white/10 hover:bg-white/20 border-none text-white transition-all">
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-[12px] font-bold">Redémarrer les Services</span>
                </Button>
                <Button className="w-full justify-start gap-3 h-11 rounded-xl bg-white/10 hover:bg-white/20 border-none text-white transition-all">
                  <Database className="h-4 w-4" />
                  <span className="text-[12px] font-bold">Optimiser la BDD</span>
                </Button>
                <Button className="w-full justify-start gap-3 h-11 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border-none text-rose-400 transition-all">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-[12px] font-bold">Mode Maintenance</span>
                </Button>
              </CardContent>
            </Card>

            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Temps de réponse : 42ms</span>
              </div>
              <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                Tous les services sont optimisés. Aucune alerte critique n'a été détectée lors du dernier scan de sécurité.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
