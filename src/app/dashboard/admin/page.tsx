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
  ShieldCheck, 
  Settings, 
  Activity, 
  UserPlus,
  Shield,
  Lock,
  Database,
  ChevronRight
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

const stats = [
  { title: "Utilisateurs", value: "24", change: "+2", icon: Users, color: "text-slate-600" },
  { title: "Activité", value: "99.9%", change: "Stable", icon: Activity, color: "text-emerald-600" },
  { title: "Sécurité", value: "0", change: "OK", icon: ShieldCheck, color: "text-slate-900" },
  { title: "Données", value: "1.2 TB", change: "+5%", icon: Database, color: "text-slate-400" },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Administration Système</h2>
            <p className="text-[13px] text-slate-500 font-medium">Contrôle global et sécurité</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
              <Lock className="mr-2 h-3.5 w-3.5 text-slate-400" />
              Logs
            </Button>
            <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-all shadow-sm">
              <UserPlus className="mr-2 h-3.5 w-3.5" />
              Créer un Compte
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{stat.change}</span>
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
          {/* Access Management */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 py-4 px-6 bg-slate-50/30">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-900">Utilisateurs Actifs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {[
                    { name: "Dr. Dupont", role: "Médecin", lastLogin: "5m", status: "Actif" },
                    { name: "Mme. Martin", role: "Secrétaire", lastLogin: "1h", status: "Actif" },
                    { name: "Admin Root", role: "Admin", lastLogin: "Maintenant", status: "Actif" },
                  ].map((u, i) => (
                    <div key={i} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-8 w-8 border border-slate-100">
                          <AvatarFallback className="bg-slate-50 text-slate-400 font-bold text-[9px]">
                            {u.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-[13px] font-bold text-slate-900">{u.name}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">{u.role} • {u.lastLogin}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest">
                          {u.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300">
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Status */}
          <div className="space-y-6">
            <Card className="border-slate-100 shadow-sm bg-slate-900 text-white p-6 rounded-xl">
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                Statut Sécurité
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-[11px] font-medium text-slate-400">Firewall</span>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-tighter">Actif</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-[11px] font-medium text-slate-400">Backup</span>
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tighter">OK</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">SSL</span>
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tighter">200 jours</span>
                </div>
              </div>
              <Button className="w-full h-9 mt-8 rounded-lg bg-white text-slate-900 text-[11px] font-bold hover:bg-slate-100 transition-all">
                Rapport Complet
              </Button>
            </Card>

            <Card className="border-slate-100 shadow-sm p-6 bg-white rounded-xl">
              <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight mb-4">Actions Rapides</h3>
              <div className="space-y-1">
                <Button variant="ghost" className="w-full h-9 justify-between px-3 text-[12px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg group" asChild>
                  <Link href="/dashboard/admin/maintenance">
                    Maintenance Système
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-900" />
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full h-9 justify-between px-3 text-[12px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg group">
                  Purger les Logs
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-900" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
