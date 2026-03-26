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
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal,
  Eye,
  UserPlus,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";

const patients = [
  { id: "1", name: "Marie Laurent", age: 42, lastVisit: "26/03/2026", condition: "Myopie", status: "Suivi" },
  { id: "2", name: "Jean Martin", age: 65, lastVisit: "24/03/2026", condition: "Glaucome", status: "Actif" },
  { id: "3", name: "Sophie Bernard", age: 28, lastVisit: "20/03/2026", condition: "Post-Op", status: "Urgent" },
  { id: "4", name: "Luc Petit", age: 12, lastVisit: "15/03/2026", condition: "Strabisme", status: "Suivi" },
  { id: "5", name: "Alice Dubois", age: 35, lastVisit: "10/03/2026", condition: "Contrôle", status: "Suivi" },
];

export default function PatientsPage() {
  return (
    <DashboardLayout role="medecin">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Base Patients</h2>
            <p className="text-[13px] text-slate-500 font-medium">Gérez et consultez les dossiers patients</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
              <Filter className="mr-2 h-3.5 w-3.5 text-slate-400" />
              Filtrer
            </Button>
            <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-all shadow-sm">
              <UserPlus className="mr-2 h-3.5 w-3.5" />
              Nouveau Patient
            </Button>
          </div>
        </div>

        {/* Search & Stats Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Rechercher par nom..." 
              className="pl-9 h-9 bg-white border-slate-200 rounded-lg text-[12px] focus-visible:ring-1 focus-visible:ring-slate-200 transition-all"
            />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Affichage de 5 sur 1,240 patients</p>
        </div>

        {/* Patients Table */}
        <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[300px] px-6 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Patient</TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Âge</TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Dernière Visite</TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Pathologie</TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Statut</TableHead>
                  <TableHead className="text-right px-6 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id} className="group hover:bg-slate-50/30 transition-colors border-slate-50">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7 border border-slate-100">
                          <AvatarFallback className="bg-slate-50 text-slate-500 font-bold text-[9px]">
                            {patient.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-slate-900 text-[13px]">{patient.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 font-medium text-[12px]">{patient.age} ans</TableCell>
                    <TableCell className="text-slate-500 font-medium text-[12px]">{patient.lastVisit}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md px-2 py-0.5 border-slate-200 bg-white text-slate-500 font-bold text-[9px] uppercase tracking-tighter">
                        {patient.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-md px-2 py-0.5 font-bold text-[9px] uppercase border-none",
                        patient.status === "Urgent" ? "bg-rose-50 text-rose-600" :
                        patient.status === "Actif" ? "bg-emerald-50 text-emerald-600" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900" asChild>
                          <Link href={`/dashboard/medecin/patients/${patient.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 px-6 border-t border-slate-50 flex items-center justify-between">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Page 1 de 248</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-slate-400 hover:text-slate-900 disabled:opacity-30" disabled>Précédent</Button>
                <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-slate-400 hover:text-slate-900">Suivant</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
