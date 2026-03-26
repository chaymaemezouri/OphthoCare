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
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Filter,
  ChevronRight,
  Eye,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { 
    title: "Consultations", 
    value: "284", 
    change: "+12.5%",
    trend: "up",
    icon: Activity, 
  },
  { 
    title: "Nouveaux Patients", 
    value: "42", 
    change: "+8.2%",
    trend: "up",
    icon: Users, 
  },
  { 
    title: "Revenu Total", 
    value: "18,450€", 
    change: "-2.1%",
    trend: "down",
    icon: TrendingUp, 
  },
  { 
    title: "Taux de Rétention", 
    value: "94.2%", 
    change: "+0.5%",
    trend: "up",
    icon: BarChart3, 
  },
];

export default function AnalyticsPage() {
  return (
    <DashboardLayout role="medecin">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Analytiques & Performance</h2>
            <p className="text-[13px] text-slate-500 font-medium">Vue d'ensemble de l'activité du cabinet</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
              <Filter className="mr-2 h-3.5 w-3.5 text-slate-400" />
              Filtrer
            </Button>
            <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-all shadow-sm">
              <Download className="mr-2 h-3.5 w-3.5" />
              Exporter le rapport
            </Button>
          </div>
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
          {/* Main Chart Placeholder */}
          <Card className="lg:col-span-2 border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 py-4 px-6">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                Fréquentation du Cabinet
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-6 rounded-md bg-slate-50 text-slate-500 border-none text-[10px] font-bold uppercase tracking-tight px-2">Semaine</Badge>
                <Badge variant="outline" className="h-6 rounded-md text-slate-400 border-none text-[10px] font-bold uppercase tracking-tight px-2">Mois</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-8 flex items-center justify-center relative min-h-[300px]">
              <div className="absolute inset-x-8 bottom-8 top-8 border-b border-l border-slate-100 flex items-end gap-4 px-4">
                {[45, 62, 58, 75, 52, 68, 82].map((height, i) => (
                  <div key={i} className="flex-1 bg-slate-100 rounded-t-md hover:bg-slate-900 transition-all cursor-pointer group relative" style={{ height: `${height}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {height} patients
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest absolute bottom-4">Statistiques hebdomadaires • Mars 2026</p>
            </CardContent>
          </Card>

          {/* Distribution Placeholder */}
          <Card className="border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 py-4 px-6">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <PieChart className="h-4 w-4 text-slate-400" />
                Pathologies fréquentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[
                { label: "Myopie", value: "45%", color: "bg-slate-900" },
                { label: "Glaucome", value: "25%", color: "bg-slate-600" },
                { label: "Cataracte", value: "15%", color: "bg-slate-400" },
                { label: "Urgences", value: "10%", color: "bg-slate-200" },
                { label: "Autres", value: "5%", color: "bg-slate-100" },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="text-slate-900">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", item.color)} style={{ width: item.value }} />
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full h-8 mt-4 rounded-lg text-[11px] font-bold text-slate-400 hover:text-slate-900 border border-slate-50 hover:bg-slate-50">
                Détails par pathologie
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Detailed List Placeholder */}
        <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 py-4 px-6">
            <CardTitle className="text-sm font-bold">Performance par Type d'Examen</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {[
                { type: "Consultation Standard", volume: 142, revenue: "9,230€", efficiency: "98%" },
                { type: "Chirurgie Laser", volume: 28, revenue: "5,600€", efficiency: "92%" },
                { type: "Examen OCT", volume: 64, revenue: "2,560€", efficiency: "100%" },
                { type: "Urgence Oculaire", volume: 15, revenue: "1,050€", efficiency: "85%" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-12">
                    <div className="w-48">
                      <p className="text-[13px] font-bold text-slate-900">{item.type}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Secteur 1</p>
                    </div>
                    <div className="flex gap-16">
                      <div className="w-20">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Volume</p>
                        <p className="text-[13px] font-bold text-slate-900">{item.volume}</p>
                      </div>
                      <div className="w-24">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Revenu</p>
                        <p className="text-[13px] font-bold text-slate-900">{item.revenue}</p>
                      </div>
                      <div className="w-20">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Efficacité</p>
                        <p className="text-[13px] font-bold text-slate-900">{item.efficiency}</p>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors cursor-pointer" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
