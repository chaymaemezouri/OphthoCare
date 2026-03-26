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
  Plus, 
  Stethoscope, 
  ChevronRight,
  Activity,
  Search,
  Timer
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const activeConsultations = [
  { id: "C-101", patient: "Sophie Bernard", time: "14:30", type: "Chirurgie Laser", status: "En cours", room: "Box 1" },
  { id: "C-102", patient: "Luc Petit", time: "15:15", type: "Urgence", status: "Attente", room: "Box 2" },
];

const pastConsultations = [
  { id: "C-099", patient: "Marie Laurent", date: "09:00", type: "Contrôle", dr: "Dr. Dupont" },
  { id: "C-098", patient: "Jean Martin", date: "10:30", type: "Glaucome", dr: "Dr. Dupont" },
  { id: "C-097", patient: "Alice Dubois", date: "Hier", type: "Réfraction", dr: "Dr. Dupont" },
];

export default function ConsultationsPage() {
  return (
    <DashboardLayout role="medecin">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Consultations & Examens</h2>
            <p className="text-[13px] text-slate-500 font-medium">Suivi clinique et flux des patients</p>
          </div>
          <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-all shadow-sm">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Nouvelle Consultation
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 py-4 px-6 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                    En cours au cabinet
                  </CardTitle>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">
                    2 Actifs
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {activeConsultations.map((c) => (
                    <div key={c.id} className="p-5 flex items-center justify-between hover:bg-slate-50/30 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-white transition-colors">
                          <span className="text-[11px] font-bold text-slate-900 leading-none">{c.time}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-[13px] font-bold text-slate-900">{c.patient}</h4>
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-widest",
                              c.status === "En cours" ? "text-emerald-500" : "text-slate-400"
                            )}>{c.status}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-2 mt-1">
                            {c.type} • <span className="text-slate-900 font-bold">{c.room}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" className="h-8 rounded-lg text-[11px] font-bold text-slate-400 hover:text-slate-900">
                          Suspendre
                        </Button>
                        <Button className="h-8 px-4 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 shadow-sm">
                          Démarrer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 py-4 px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Historique du jour</CardTitle>
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
                    <Input placeholder="Rechercher..." className="pl-8 h-8 bg-slate-50 border-none rounded-lg text-[11px] font-medium" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {pastConsultations.map((c) => (
                      <TableRow key={c.id} className="hover:bg-slate-50/30 border-slate-50">
                        <TableCell className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-6 w-6 border border-slate-100">
                              <AvatarFallback className="bg-slate-50 text-slate-400 font-bold text-[8px]">
                                {c.patient[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-[12px] font-bold text-slate-900">{c.patient}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{c.dr}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 font-medium text-[11px]">{c.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-md px-1.5 py-0 border-slate-100 bg-white text-slate-400 font-bold text-[9px] uppercase tracking-tighter">
                            {c.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest">
                            Rapport
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Stats Column */}
          <div className="space-y-6">
            <Card className="border-slate-100 shadow-sm bg-white p-6 rounded-xl">
              <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                <Timer className="h-3.5 w-3.5 text-slate-400" />
                Performance Flux
              </h3>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">Moyenne examen</span>
                    <span className="text-slate-900">18 min</span>
                  </div>
                  <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-900 w-[65%]" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">Occupation Box</span>
                    <span className="text-slate-900">82%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-900 w-[82%]" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-slate-100 shadow-sm bg-slate-900 text-white p-6 rounded-xl">
              <h3 className="text-[12px] font-bold uppercase tracking-tight mb-4">Actions Rapides</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "OCT Macula", icon: Stethoscope },
                  { label: "Réfraction", icon: Stethoscope },
                  { label: "Champ Visuel", icon: Stethoscope },
                  { label: "Pachymétrie", icon: Stethoscope },
                ].map((item, i) => (
                  <button key={i} className="flex flex-col items-start gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <item.icon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-tight text-left">{item.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
