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
  Euro, 
  FileText, 
  Receipt, 
  CreditCard, 
  Download,
  Filter,
  Plus,
  Clock,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Scan,
  PenTool
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const invoices = [
  { id: "INV-2026-001", patient: "Marie Laurent", date: "26 Mars 2026", amount: "80,00€", status: "Payé", method: "Carte Bancaire" },
  { id: "INV-2026-002", patient: "Robert Leroy", date: "26 Mars 2026", amount: "120,00€", status: "En attente", method: "-" },
  { id: "INV-2026-003", patient: "Emma Blanc", date: "25 Mars 2026", amount: "65,00€", status: "Payé", method: "Espèces" },
  { id: "INV-2026-004", patient: "Jean Martin", date: "25 Mars 2026", amount: "240,00€", status: "Partiel", method: "Virement" },
];

export default function SecretaireBillingPage() {
  return (
    <DashboardLayout role="secretaire">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ma Facturation</h2>
            <p className="text-[13px] text-slate-500 font-medium">Gestion des encaissements et honoraires du cabinet</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
              <Scan className="mr-2 h-3.5 w-3.5 text-slate-400" />
              Scanner Mutuelle
            </Button>
            <Button className="h-9 px-4 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition-all shadow-sm border-none">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Nouvel Encaissement
            </Button>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-100 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <Euro className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recettes Jour</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">1,240.00€</p>
            </CardContent>
          </Card>
          
          <Card className="border-slate-100 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Impayés</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">450.00€</p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Receipt className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reçus Générés</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">15</p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                  <PenTool className="h-4 w-4 text-slate-600" />
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Signatures en attente</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">3</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 py-4 px-6 bg-slate-50/30 flex-row items-center justify-between">
            <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-900">Encaissements Récents</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/10">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Référence</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Montant</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{inv.id}</td>
                    <td className="px-6 py-4 text-[13px] font-medium text-slate-600">{inv.patient}</td>
                    <td className="px-6 py-4 text-[13px] font-medium text-slate-400">{inv.date}</td>
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{inv.amount}</td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "border-none rounded-md px-2 py-0.5 font-bold text-[9px] uppercase tracking-tighter",
                        inv.status === "Payé" ? "bg-emerald-50 text-emerald-600" : 
                        inv.status === "En attente" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
