"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Eye,
  Stethoscope,
  TrendingUp,
  FileText,
  Bot
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const stats = [
  { 
    title: "Patients du jour", 
    value: "12", 
    change: "+20%",
    trend: "up",
    icon: Users, 
  },
  { 
    title: "Consultations", 
    value: "8/15", 
    change: "53%",
    trend: "up",
    icon: Stethoscope, 
  },
  { 
    title: "Attente Moyenne", 
    value: "14 min", 
    change: "-2m",
    trend: "down",
    icon: Clock, 
  },
  { 
    title: "Revenus (est.)", 
    value: "840€", 
    change: "+12%",
    trend: "up",
    icon: TrendingUp, 
  },
];

const appointments = [
  { 
    id: "1", 
    patient: "Marie Laurent", 
    time: "09:00", 
    type: "Contrôle", 
    status: "Terminé",
    initials: "ML",
  },
  { 
    id: "2", 
    patient: "Jean Martin", 
    time: "10:30", 
    type: "Glaucome", 
    status: "Terminé",
    initials: "JM",
  },
  { 
    id: "3", 
    patient: "Sophie Bernard", 
    time: "14:30", 
    type: "Laser", 
    status: "En cours",
    initials: "SB",
  },
  { 
    id: "4", 
    patient: "Luc Petit", 
    time: "15:15", 
    type: "Urgence", 
    status: "Suivant",
    initials: "LP",
  },
];

export default function MedecinDashboard() {
  return (
    <DashboardLayout role="medecin">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tableau de Bord</h2>
            <p className="text-[13px] text-slate-500 font-medium">Bon retour, Dr. Dupont 👋</p>
          </div>
          <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-all shadow-sm">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Nouvelle Consultation
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-slate-100 shadow-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                    <stat.icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className={cn(
                    "flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-md",
                    stat.trend === "up" ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                  )}>
                    {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 py-4 px-6">
                <CardTitle className="text-sm font-bold">Rendez-vous du jour</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-slate-400 hover:text-slate-900">
                  Voir l'agenda complet
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {appointments.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] font-bold text-slate-900 w-12">{app.time}</span>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-slate-100">
                            <AvatarFallback className="bg-slate-50 text-[10px] font-bold text-slate-600">
                              {app.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-[13px] font-bold text-slate-900">{app.patient}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{app.type}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={cn(
                          "px-2.5 py-0.5 rounded-md text-[10px] font-bold border-none",
                          app.status === "Terminé" ? "bg-slate-100 text-slate-500" : 
                          app.status === "En cours" ? "bg-emerald-50 text-emerald-600" : 
                          "bg-slate-900 text-white"
                        )}>
                          {app.status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors cursor-pointer" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-slate-100 shadow-sm bg-slate-900 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Bot className="h-4 w-4 text-slate-400" />
                    Assistant IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                    "Sophie Bernard montre une instabilité maculaire. Un examen OCT approfondi est suggéré."
                  </p>
                  <Button variant="outline" className="w-full h-8 mt-4 rounded-lg border-white/10 bg-white/5 text-[11px] font-bold hover:bg-white/10 text-white">
                    Ouvrir l'analyse
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    Rapports Récents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { title: "OCT - Marie L.", time: "10m" },
                    { title: "Rétino - Jean M.", time: "1h" },
                  ].map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-700">{doc.title}</span>
                      <span className="text-[10px] font-bold text-slate-400">{doc.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Side Info */}
          <div className="space-y-6">
            <Card className="border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-slate-100">
                <CardTitle className="text-sm font-bold">Dossiers Récents</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[
                  { name: "Marc Lefebvre", type: "Myopie" },
                  { name: "Julie Morel", type: "Cataracte" },
                  { name: "Paul Vasseur", type: "Urgence" },
                ].map((patient, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        {patient.name[0]}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-900">{patient.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{patient.type}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-3 w-3 text-slate-300" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-rose-100 bg-rose-50/30 shadow-sm p-5">
              <h4 className="text-[12px] font-bold text-rose-600 mb-2 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Urgence signalée
              </h4>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                M. Martin est arrivé avec une douleur oculaire aiguë. Priorité conseillée.
              </p>
              <Button className="w-full h-8 mt-4 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700">
                Voir le dossier
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
