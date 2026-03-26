"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  UserPlus, 
  Clock, 
  Euro,
  Phone,
  MoreVertical,
  ChevronRight,
  AlertCircle,
  Map as MapIcon,
  Scan,
  PenTool,
  MessageSquare
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CabinetMap } from "@/components/medical/cabinet-map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const stats = [
  { title: "RDV Prévus", value: "32", change: "+5", icon: Calendar, color: "text-slate-600" },
  { title: "En Salle d'Attente", value: "4", change: "Stable", icon: Clock, color: "text-orange-600" },
  { title: "Paiements Dus", value: "2", change: "Alert", icon: AlertCircle, color: "text-rose-600" },
  { title: "Recettes Jour", value: "1,240 €", change: "+12%", icon: Euro, color: "text-emerald-600" },
];

const waitingList = [
  { id: "1", patient: "Alice Dubois", time: "14:00", wait: "15 min", initials: "AD", status: "attente" },
  { id: "2", patient: "Robert Leroy", time: "14:15", wait: "5 min", initials: "RL", status: "examen" },
  { id: "3", patient: "Emma Blanc", time: "14:30", wait: "-", initials: "EB", status: "arrive" },
];

export default function SecretaireDashboard() {
  return (
    <DashboardLayout role="secretaire">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight italic">Espace Accueil</h2>
            <p className="text-[13px] text-slate-500 font-medium">Gestion des flux, facturation et rappels.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 text-[12px] font-bold bg-white gap-2">
              <Scan className="h-4 w-4 text-slate-400" />
              Scanner Document
            </Button>
            <Button className="h-10 px-6 rounded-xl bg-slate-900 text-white text-[12px] font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
              <UserPlus className="mr-2 h-4 w-4" />
              Admission Patient
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-transparent border-b border-slate-100 w-full justify-start rounded-none h-auto p-0 gap-8 mb-8">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3 text-[12px] font-bold text-slate-400 data-[state=active]:text-slate-900 transition-all">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="reminders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3 text-[12px] font-bold text-slate-400 data-[state=active]:text-slate-900 transition-all">Rappels & SMS</TabsTrigger>
            <TabsTrigger value="billing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3 text-[12px] font-bold text-slate-400 data-[state=active]:text-slate-900 transition-all">Facturation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
            {/* Interactive Cabinet Map */}
            <Card className="border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
              <CardContent className="p-8">
                <CabinetMap />
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Waiting List */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                  <CardHeader className="border-b border-slate-50 py-5 px-8 bg-slate-50/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-900 italic">Patients au cabinet</CardTitle>
                      <Badge className="bg-orange-50 text-orange-600 border-none text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                        3 Présents
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                      {waitingList.map((p) => (
                        <div key={p.id} className="p-6 flex items-center justify-between hover:bg-slate-50/30 transition-colors group">
                          <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-white transition-colors shadow-sm">
                              <span className="text-[12px] font-black text-slate-900 leading-none">{p.time}</span>
                            </div>
                            <div>
                              <h4 className="text-[14px] font-bold text-slate-900">{p.patient}</h4>
                              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-2 mt-1">
                                <span className="text-orange-500 font-bold uppercase text-[9px] tracking-tighter">Attente: {p.wait}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button variant="ghost" className="h-9 px-4 rounded-xl text-[11px] font-bold text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100">
                              Dossier
                            </Button>
                            <Button className="h-9 px-5 rounded-xl bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 shadow-md">
                              Arrivée
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white p-8 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <PenTool className="h-20 w-20" />
                  </div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 relative z-10">Signature Reçus</h3>
                  <p className="text-[13px] font-bold leading-relaxed mb-8 relative z-10 italic text-slate-300">
                    Activez le mode tablette pour la signature numérique des honoraires.
                  </p>
                  <Button className="w-full bg-white text-slate-900 h-11 rounded-xl text-[12px] font-bold hover:bg-slate-50 relative z-10 shadow-lg">
                    Lancer Signature
                  </Button>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 p-8 bg-white rounded-2xl">
                  <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-rose-500" />
                    Appels Urgents
                  </h3>
                  <div className="space-y-3">
                    {[
                      { name: "M. Lefebvre", msg: "Annulation RDV", time: "2m" },
                      { name: "Mme. Cohen", msg: "Demande Reçu PDF", time: "15m" },
                    ].map((call, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-slate-300 transition-all cursor-pointer shadow-sm">
                        <div>
                          <p className="text-[13px] font-bold text-slate-900">{call.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{call.msg}</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-300">{call.time}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reminders" className="space-y-6 animate-in fade-in duration-500">
            {/* Automatic Reminders Manager - IMPROVEMENT */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-none shadow-xl shadow-slate-200/50 bg-white p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h3 className="text-[15px] font-bold text-slate-900 italic">Rappels SMS (J-1)</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Statut des envois automatiques</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">Actif</Badge>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">28 / 32</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SMS confirmés</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-rose-500">4</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Échecs/Attente</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[85%] rounded-full" />
                  </div>
                </div>
              </Card>

              <Card className="md:col-span-2 border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-900 italic">Actions de rappel nécessaires</CardTitle>
                  <Button variant="ghost" className="h-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">Voir tout</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-50">
                    {[
                      { patient: "Luc Petit", action: "Confirmer chirurgie", tel: "06 12 34 56 78", status: "urgent" },
                      { patient: "Alice Dubois", action: "Résultats imagerie", tel: "06 98 76 54 32", status: "normal" },
                    ].map((task, i) => (
                      <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center border",
                            task.status === "urgent" ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-blue-50 border-blue-100 text-blue-500"
                          )}>
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-slate-900">{task.patient}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{task.action} • {task.tel}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="outline" className="h-9 px-4 rounded-xl border-slate-200 text-[11px] font-bold">Appeler</Button>
                          <Button className="h-9 px-4 rounded-xl bg-slate-900 text-white text-[11px] font-bold">SMS</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
