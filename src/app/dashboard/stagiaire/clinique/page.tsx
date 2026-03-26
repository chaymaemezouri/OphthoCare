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
  Activity,
  Search,
  BookOpen,
  GraduationCap,
  History,
  ClipboardCheck,
  ChevronRight
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const internshipGoals = [
  { id: "1", patient: "Sophie Bernard", task: "Observation OCT", status: "Terminé" },
  { id: "2", patient: "Luc Petit", task: "Aide à la réfraction", status: "En attente" },
];

const clinicalLog = [
  { id: "L-001", patient: "Marie Laurent", type: "DMLA", observation: "Signes de néovaisseaux", dr: "Dr. Martin" },
  { id: "L-002", patient: "Jean Martin", type: "Glaucome", observation: "Excavation papillaire", dr: "Dr. Martin" },
];

export default function StagiaireCliniquePage() {
  return (
    <DashboardLayout role="stagiaire">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Suivi Clinique Stagiaire</h2>
            <p className="text-[13px] text-slate-500 font-medium">Journal d'apprentissage et observation des cas</p>
          </div>
          <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-all shadow-sm">
            <ClipboardCheck className="mr-2 h-3.5 w-3.5" />
            Nouvelle Note d'Observation
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Learning Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 py-4 px-6 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                    Objectifs de la journée
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {internshipGoals.map((g) => (
                    <div key={g.id} className="p-5 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center border",
                          g.status === "Terminé" ? "bg-emerald-50 border-emerald-100 text-emerald-500" : "bg-slate-50 border-slate-100 text-slate-300"
                        )}>
                          <ClipboardCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold text-slate-900">{g.task}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">{g.patient}</p>
                        </div>
                      </div>
                      <Badge className={cn(
                        "rounded-md px-2 py-0.5 font-bold text-[9px] uppercase border-none",
                        g.status === "Terminé" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                      )}>
                        {g.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 py-4 px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <History className="h-3.5 w-3.5" />
                    Journal des observations
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {clinicalLog.map((l) => (
                      <TableRow key={l.id} className="hover:bg-slate-50/30 border-slate-50">
                        <TableCell className="px-6 py-4">
                          <div>
                            <p className="text-[12px] font-bold text-slate-900">{l.patient}</p>
                            <Badge variant="outline" className="mt-1 rounded-md px-1.5 py-0 border-slate-100 bg-white text-slate-400 font-bold text-[8px] uppercase tracking-tighter">
                              {l.type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 font-medium text-[12px] max-w-[300px] truncate italic">
                          "{l.observation}"
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest">
                            Voir détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Resources Column */}
          <div className="space-y-6">
            <Card className="border-slate-100 shadow-sm bg-slate-900 text-white p-6 rounded-xl">
              <h3 className="text-[12px] font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Ressources Apprentissage
              </h3>
              <div className="space-y-3">
                {[
                  "Atlas de la Rétine",
                  "Guide OCT 2026",
                  "Protocoles Glaucome",
                ].map((item, i) => (
                  <button key={i} className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group">
                    <span className="text-[11px] font-bold text-slate-300">{item}</span>
                    <ChevronRight className="h-3 w-3 text-slate-500 group-hover:translate-x-1 transition-transform" />
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
