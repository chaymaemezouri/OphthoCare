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
  MessageSquare, 
  Mail, 
  Phone, 
  Send, 
  Search, 
  MoreVertical, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Clock,
  Filter,
  User,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const messages = [
  { 
    id: "1", 
    from: "Marie Laurent", 
    subject: "Confirmation RDV OCT", 
    date: "Aujourd'hui, 14:30", 
    status: "Envoyé", 
    type: "SMS", 
    initials: "ML" 
  },
  { 
    id: "2", 
    from: "Jean Martin", 
    subject: "Résultats d'Imagerie", 
    date: "Hier, 10:15", 
    status: "Ouvert", 
    type: "Email", 
    initials: "JM" 
  },
  { 
    id: "3", 
    from: "Robert Leroy", 
    subject: "Rappel de Consultation", 
    date: "25 Mars, 09:00", 
    status: "Échec", 
    type: "SMS", 
    initials: "RL" 
  },
  { 
    id: "4", 
    from: "Emma Blanc", 
    subject: "Facture INV-2026-003", 
    date: "24 Mars, 16:45", 
    status: "Envoyé", 
    type: "Email", 
    initials: "EB" 
  },
];

export default function CommunicationPage() {
  return (
    <DashboardLayout role="medecin">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Communication Patients</h2>
            <p className="text-[13px] text-slate-500 font-medium">Historique des messages, SMS et emails envoyés</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
              <Filter className="mr-2 h-3.5 w-3.5 text-slate-400" />
              Filtrer
            </Button>
            <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-all shadow-sm">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Nouveau Message
            </Button>
          </div>
        </div>

        {/* Message Status Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-100 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                  +15%
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">SMS Envoyés</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">1,284</p>
            </CardContent>
          </Card>
          
          <Card className="border-slate-100 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <Mail className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  98%
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Emails Ouverts</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">852</p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex items-center text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md">
                  12 auto
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Rappels Automatiques</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">24</p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center border border-rose-100">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                </div>
                <div className="flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                  2 erreurs
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Taux d'Échec</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">0.4%</p>
            </CardContent>
          </Card>
        </div>

        {/* Message Log */}
        <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 py-4 px-6 bg-slate-50/30 flex-row items-center justify-between">
            <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-900">Historique des Envois</CardTitle>
            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg p-1">
              <Button variant="ghost" className="h-7 px-3 text-[11px] font-bold uppercase tracking-widest bg-white shadow-sm text-slate-900">Patient</Button>
              <Button variant="ghost" className="h-7 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Interne</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {messages.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                      <AvatarFallback className="bg-slate-900 text-white font-bold text-[12px]">{m.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-slate-900">{m.from}</p>
                        <Badge className={cn(
                          "border-none rounded-md px-1.5 py-0.5 font-bold text-[8px] uppercase tracking-tighter",
                          m.type === "SMS" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {m.type}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-medium text-slate-600 truncate max-w-[300px]">{m.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-slate-900">{m.date}</p>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mt-0.5",
                        m.status === "Envoyé" || m.status === "Ouvert" ? "text-emerald-500" : "text-rose-500"
                      )}>{m.status}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
