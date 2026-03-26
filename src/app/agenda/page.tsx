"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Settings2,
  CalendarDays
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const appointments = [
  { id: "1", patient: "Marie Laurent", time: "09:00", duration: "30 min", type: "Contrôle", color: "border-slate-200 bg-white" },
  { id: "2", patient: "Jean Martin", time: "10:30", duration: "45 min", type: "Glaucome", color: "border-slate-200 bg-white" },
  { id: "3", patient: "Sophie Bernard", time: "14:30", duration: "60 min", type: "Chirurgie", color: "border-slate-900 bg-slate-900 text-white" },
  { id: "4", patient: "Luc Petit", time: "15:15", duration: "15 min", type: "Urgence", color: "border-rose-100 bg-rose-50" },
];

export default function AgendaPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <DashboardLayout role="medecin">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Agenda Médical</h2>
            <p className="text-[13px] text-slate-500 font-medium">Gérez votre planning et vos disponibilités</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white border border-slate-100 rounded-lg p-1 flex items-center shadow-sm">
              <Button variant="ghost" className="h-7 px-3 text-[11px] font-bold bg-slate-50 text-slate-900 rounded-md">Jour</Button>
              <Button variant="ghost" className="h-7 px-3 text-[11px] font-bold text-slate-400 rounded-md">Semaine</Button>
            </div>
            <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-all shadow-sm">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Nouveau RDV
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Side Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-100 shadow-sm p-4 bg-white rounded-xl">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-lg w-full"
              />
            </Card>

            <Card className="border-slate-100 shadow-sm p-5 bg-white rounded-xl">
              <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5 text-slate-400" />
                Catégories
              </h3>
              <div className="space-y-1">
                {[
                  { label: "Consultations", count: 12, color: "bg-slate-200" },
                  { label: "Urgences", count: 2, color: "bg-rose-500" },
                  { label: "Chirurgies", count: 3, color: "bg-slate-900" },
                ].map((filter, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-1.5 w-1.5 rounded-full", filter.color)} />
                      <span className="text-[12px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{filter.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{filter.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Main View */}
          <div className="lg:col-span-3">
            <Card className="border-slate-100 shadow-sm overflow-hidden bg-white rounded-xl">
              <div className="border-b border-slate-50 py-4 px-6 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-slate-400">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-[12px] font-bold text-slate-900 uppercase tracking-widest px-2">
                      {date?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-slate-400">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50 relative">
                  {Array.from({ length: 9 }).map((_, i) => {
                    const hour = 9 + i;
                    const timeStr = `${hour}:00`;
                    const hasApp = appointments.find(a => a.time === timeStr);
                    
                    return (
                      <div key={i} className="flex min-h-[80px] group">
                        <div className="w-20 p-4 border-r border-slate-50 flex justify-center">
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{timeStr}</span>
                        </div>
                        <div className="flex-1 p-3 relative group-hover:bg-slate-50/30 transition-colors">
                          {hasApp && (
                            <div className={cn(
                              "absolute inset-x-3 top-2 bottom-2 rounded-lg border p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between",
                              hasApp.color
                            )}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-[12px] font-bold leading-none">{hasApp.patient}</h4>
                                  <p className="text-[9px] font-bold uppercase tracking-widest mt-1.5 opacity-60">{hasApp.type}</p>
                                </div>
                                <Clock className="h-3 w-3 opacity-40" />
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5 border border-white/20">
                                    <AvatarFallback className="bg-white/10 text-[8px] font-bold">
                                      {hasApp.patient[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{hasApp.duration}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
