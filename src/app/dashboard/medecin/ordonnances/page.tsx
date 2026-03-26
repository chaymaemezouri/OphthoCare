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
  FileText, 
  Download, 
  Printer, 
  Filter,
  MoreHorizontal,
  FileCheck,
  FileClock,
  Send,
  Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const prescriptions = [
  { id: "ORD-2026-001", patient: "Marie Laurent", date: "26/03/2026", type: "Lunettes", status: "Signée" },
  { id: "ORD-2026-002", patient: "Jean Martin", date: "24/03/2026", type: "Traitement", status: "Signée" },
  { id: "ORD-2026-003", patient: "Sophie Bernard", date: "20/03/2026", type: "Post-Op", status: "Signée" },
  { id: "ORD-2026-004", patient: "Luc Petit", date: "15/03/2026", type: "Lunettes", status: "Brouillon" },
  { id: "ORD-2026-005", patient: "Alice Dubois", date: "10/03/2026", type: "Lentilles", status: "Signée" },
];

export default function OrdonnancesPage() {
  return (
    <DashboardLayout role="medecin">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gestion des Ordonnances</h2>
            <p className="text-[13px] text-slate-500 font-medium">Prescriptions et documents médicaux</p>
          </div>
          <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-all shadow-sm">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Nouvelle Ordonnance
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Mois</p>
                <p className="text-xl font-bold text-slate-900 mt-1">142</p>
              </div>
              <FileCheck className="h-5 w-5 text-slate-200" />
            </CardContent>
          </Card>
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">À signer</p>
                <p className="text-xl font-bold text-slate-900 mt-1">8</p>
              </div>
              <FileClock className="h-5 w-5 text-amber-200" />
            </CardContent>
          </Card>
          <Card className="border-slate-100 shadow-sm bg-slate-50/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signature Numérique</p>
                <p className="text-[13px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">Active • Certifié</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
            </CardContent>
          </Card>
        </div>

        {/* Main List */}
        <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Toutes les ordonnances</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
              <Input placeholder="Rechercher..." className="pl-8 h-8 bg-slate-50 border-none rounded-lg text-[11px] font-medium" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="px-6 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-widest">N°</TableHead>
                  <TableHead className="px-6 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Patient</TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Date</TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Type</TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Statut</TableHead>
                  <TableHead className="text-right px-6 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((ord) => (
                  <TableRow key={ord.id} className="group hover:bg-slate-50/30 border-slate-50">
                    <TableCell className="px-6 py-4 text-[11px] font-bold text-slate-400">{ord.id}</TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-6 w-6 border border-slate-100">
                          <AvatarFallback className="bg-slate-50 text-slate-400 font-bold text-[8px]">
                            {ord.patient[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-slate-900 text-[13px]">{ord.patient}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 font-medium text-[12px]">{ord.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md px-1.5 py-0 border-slate-100 bg-white text-slate-400 font-bold text-[9px] uppercase tracking-tighter">
                        {ord.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-md px-2 py-0.5 font-bold text-[9px] uppercase border-none",
                        ord.status === "Signée" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {ord.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900">
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
