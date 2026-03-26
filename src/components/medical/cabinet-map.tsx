"use client"

import * as React from "react"
import { 
  Users, 
  Map as MapIcon, 
  Clock, 
  User, 
  Stethoscope, 
  DoorOpen,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface RoomProps {
  id: string;
  name: string;
  patient?: string;
  status: "available" | "occupied" | "urgent";
  timeInRoom?: string;
  assistant?: string;
}

function Room({ name, patient, status, timeInRoom, assistant }: RoomProps) {
  return (
    <div className={cn(
      "relative rounded-2xl border-2 p-4 transition-all duration-300 group cursor-pointer",
      status === "available" ? "bg-white border-slate-50 hover:border-emerald-200" : 
      status === "urgent" ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{name}</span>
          <span className={cn(
            "text-[11px] font-bold mt-1",
            status === "available" ? "text-emerald-500" : 
            status === "urgent" ? "text-rose-500" : "text-slate-900"
          )}>
            {status === "available" ? "Libre" : status === "urgent" ? "Urgence" : "Occupé"}
          </span>
        </div>
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center border",
          status === "available" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : 
          status === "urgent" ? "bg-rose-100 border-rose-200 text-rose-600" : "bg-white border-slate-200 text-slate-400"
        )}>
          {status === "available" ? <DoorOpen className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </div>
      </div>

      {patient ? (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div>
            <p className="text-[13px] font-bold text-slate-900 leading-tight">{patient}</p>
            {assistant && (
              <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                <Stethoscope className="h-2.5 w-2.5 opacity-40" />
                {assistant}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100/50">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              <Clock className="h-3 w-3" />
              {timeInRoom}
            </div>
            {status === "urgent" && (
              <AlertCircle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
            )}
          </div>
        </div>
      ) : (
        <div className="h-[68px] flex items-center justify-center">
          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Disponible</p>
        </div>
      )}
    </div>
  )
}

export function CabinetMap() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-slate-400" />
          <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-900">Plan du Cabinet</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2 Libres</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">4 Occupés</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Room id="1" name="Examen 1" patient="Sophie Bernard" status="occupied" timeInRoom="12 min" />
        <Room id="2" name="Examen 2" status="available" />
        <Room id="3" name="OCT / Imagerie" patient="Robert Leroy" status="urgent" timeInRoom="45 min" assistant="Secrétaire" />
        <Room id="4" name="Box Laser" status="available" />
        <Room id="5" name="Consultation A" patient="Luc Petit" status="occupied" timeInRoom="8 min" />
        <Room id="6" name="Consultation B" patient="Emma Blanc" status="occupied" timeInRoom="25 min" />
      </div>
      
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-slate-200">
            <Users className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-900">Salle d'attente</p>
            <p className="text-[11px] text-slate-500 font-medium">4 patients en attente (moy. 12 min)</p>
          </div>
        </div>
        <Badge className="bg-slate-900 text-white border-none px-3 py-1 rounded-full text-[11px] font-bold">Voir liste</Badge>
      </div>
    </div>
  )
}
