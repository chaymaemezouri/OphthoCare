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
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  User,
  MoreVertical,
  Search,
  Filter,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const hours = Array.from({ length: 11 }, (_, i) => `${i + 8}:00`);
const days = ["Lun 26", "Mar 27", "Mer 28", "Jeu 29", "Ven 30"];

const appointments = [
  { id: "1", patient: "Marie Laurent", time: "09:00", duration: "30 min", type: "Contrôle", color: "bg-blue-50 border-blue-100 text-blue-700", day: 0 },
  { id: "2", patient: "Jean Martin", time: "10:30", duration: "45 min", type: "Glaucome", color: "bg-emerald-50 border-emerald-100 text-emerald-700", day: 0 },
  { id: "3", patient: "Lucie Bernard", time: "14:00", duration: "20 min", type: "Urgence", color: "bg-rose-50 border-rose-100 text-rose-700", day: 1 },
  { id: "4", patient: "Robert Leroy", time: "11:00", duration: "30 min", type: "Laser", color: "bg-amber-50 border-amber-100 text-amber-700", day: 2 },
];

export default function AgendaPage() {
  return (
    <DashboardLayout role="medecin">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mon Agenda</h2>
            <p className="text-[13px] text-slate-500 font-medium">Planning des consultations et interventions</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg p-1 mr-2">
              <Button variant="ghost" className="h-7 px-3 text-[11px] font-bold uppercase tracking-widest bg-white shadow-sm text-slate-900">Jour</Button>
              <Button variant="ghost" className="h-7 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Semaine</Button>
              <Button variant="ghost" className="h-7 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Mois</Button>
            </div>
            <Button className="h-9 px-4 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition-all shadow-sm border-none">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Nouveau RDV
            </Button>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <h3 className="text-[15px] font-bold text-slate-900">Mars 2026</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" className="h-8 px-3 text-[11px] font-bold uppercase border-slate-200">Aujourd'hui</Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[12px] font-semibold text-slate-600">En direct</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-6 border-b border-slate-50 bg-slate-50/30">
            <div className="p-4 border-r border-slate-100"></div>
            {days.map((day) => (
              <div key={day} className="p-4 text-center border-r border-slate-100 last:border-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{day}</span>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-6 h-[600px] overflow-y-auto custom-scrollbar relative">
            {/* Time column */}
            <div className="flex flex-col border-r border-slate-100 bg-slate-50/10">
              {hours.map((hour) => (
                <div key={hour} className="h-20 p-2 text-right border-b border-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-400">{hour}</span>
                </div>
              ))}
            </div>

            {/* Days columns */}
            {Array.from({ length: 5 }).map((_, dayIndex) => (
              <div key={dayIndex} className="flex flex-col border-r border-slate-100 last:border-0 relative">
                {hours.map((hour) => (
                  <div key={hour} className="h-20 border-b border-slate-50/50 group hover:bg-slate-50/50 transition-colors" />
                ))}
                
                {/* Appointment Overlays (Simplified for demo) */}
                {appointments.filter(app => app.day === dayIndex).map(app => (
                  <div 
                    key={app.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-lg border p-2 shadow-sm cursor-pointer hover:scale-[1.02] transition-all z-10",
                      app.color
                    )}
                    style={{ 
                      top: `${(parseInt(app.time.split(':')[0]) - 8) * 80 + (parseInt(app.time.split(':')[1]) / 60) * 80}px`,
                      height: '70px'
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <span className="text-[11px] font-bold leading-none mb-1">{app.patient}</span>
                      <div className="flex items-center gap-1 text-[9px] opacity-80 font-bold uppercase tracking-tighter">
                        <Clock className="h-2.5 w-2.5" />
                        {app.time} • {app.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
