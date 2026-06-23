"use client";

import { Clock, DoorOpen, Map as MapIcon, User, Users, Stethoscope, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type CabinetRoom = {
  id: string;
  name: string;
  patient?: string;
  status: "available" | "occupied" | "urgent";
  timeInRoom?: string;
  assistant?: string;
};

function Room({ name, patient, status, timeInRoom, assistant }: CabinetRoom) {
  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300",
        status === "available"
          ? "border-slate-50 bg-white hover:border-emerald-200"
          : status === "urgent"
            ? "border-rose-200 bg-rose-50"
            : "border-slate-200 bg-slate-50",
      )}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase leading-none tracking-widest text-slate-400">{name}</span>
          <span
            className={cn(
              "mt-1 text-[11px] font-bold",
              status === "available" ? "text-emerald-500" : status === "urgent" ? "text-rose-500" : "text-slate-900",
            )}
          >
            {status === "available" ? "Libre" : status === "urgent" ? "Urgence" : "Occupé"}
          </span>
        </div>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border",
            status === "available"
              ? "border-emerald-100 bg-emerald-50 text-emerald-600"
              : status === "urgent"
                ? "border-rose-200 bg-rose-100 text-rose-600"
                : "border-slate-200 bg-white text-slate-400",
          )}
        >
          {status === "available" ? <DoorOpen className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </div>
      </div>

      {patient ? (
        <div className="animate-in space-y-3 fade-in duration-300">
          <div>
            <p className="text-[13px] font-bold leading-tight text-slate-900">{patient}</p>
            {assistant ? (
              <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-slate-500">
                <Stethoscope className="h-2.5 w-2.5 opacity-40" />
                {assistant}
              </p>
            ) : null}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100/50 pt-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
              <Clock className="h-3 w-3" />
              {timeInRoom ?? "—"}
            </div>
            {status === "urgent" ? <AlertCircle className="h-3.5 w-3.5 animate-pulse text-rose-500" /> : null}
          </div>
        </div>
      ) : (
        <div className="flex h-[68px] items-center justify-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Disponible</p>
        </div>
      )}
    </div>
  );
}

type CabinetMapProps = {
  rooms?: CabinetRoom[];
  waitingCount?: number;
};

export function CabinetMap({ rooms, waitingCount = 0 }: CabinetMapProps) {
  const list = rooms ?? [];
  const free = list.filter((r) => r.status === "available").length;
  const busy = list.filter((r) => r.status !== "available").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-slate-400" />
          <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-900">Plan du cabinet</h3>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{free} libre(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{busy} occupé(s)</span>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune salle configurée.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {list.map((r) => (
            <Room key={r.id} {...r} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white">
            <Users className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-900">Salle d&apos;attente</p>
            <p className="text-[11px] font-medium text-slate-500">
              {waitingCount} patient(s) en attente d&apos;examen
            </p>
          </div>
        </div>
        {waitingCount > 0 ? (
          <Badge className="rounded-full border-none bg-slate-900 px-3 py-1 text-[11px] font-bold text-white">
            {waitingCount} en attente
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
