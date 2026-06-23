"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  addDays,
  addMinutes,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Video,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { doctorsApi, appointmentsApi, patientsApi } from "@/lib/api";

const START_H = 8;
const END_H = 19;
const PX_PER_HOUR = 52;

export type DoctorAgendaAppointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  reason?: string;
  notes?: string;
  patient: {
    id: string;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    } | null;
  };
};

type ScheduleBlock = {
  id: string;
  startTime: string;
  endTime: string;
  kind: string;
  note?: string;
};

type Toast = { variant: "success" | "error" | "info"; text: string };

function patientLabel(a: DoctorAgendaAppointment) {
  const u = a.patient.user;
  if (!u) return "Patient";
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return n || u.email || "Patient";
}

function statusLabelFr(status: string) {
  switch (status) {
    case "pending":
      return "En attente";
    case "confirmed":
      return "Confirmé";
    case "in_progress":
      return "En cours";
    case "completed":
      return "Terminé";
    case "cancelled":
      return "Annulé";
    case "no_show":
      return "Absent";
    default:
      return status;
  }
}

function minutesFromDayStart(d: Date) {
  return (d.getHours() - START_H) * 60 + d.getMinutes();
}

function eventStyle(start: Date, end: Date) {
  const m0 = minutesFromDayStart(start);
  const dur = Math.max(15, (end.getTime() - start.getTime()) / 60000);
  const top = (m0 / 60) * PX_PER_HOUR;
  const height = (dur / 60) * PX_PER_HOUR;
  return { top: Math.max(0, top), height: Math.max(24, height) };
}

function statusColors(status: string, type: string) {
  const base =
    status === "completed"
      ? "bg-emerald-50 text-emerald-950 border-emerald-200/90"
      : status === "cancelled"
        ? "bg-zinc-100 text-zinc-500 line-through border-zinc-200"
        : status === "confirmed"
          ? "bg-cyan-50 text-cyan-950 border-cyan-200/90"
          : status === "no_show"
            ? "bg-zinc-200/80 text-zinc-800 border-zinc-300"
            : status === "in_progress"
              ? "bg-sky-50 text-sky-950 border-sky-200/90"
              : "bg-amber-50 text-amber-950 border-amber-200/90";
  const videoDash = type === "video" ? "border-dashed" : "";
  return cn(
    "absolute left-1 right-1 overflow-hidden rounded-lg border px-1.5 py-1 text-[11px] shadow-sm ring-1 ring-black/[0.03]",
    base,
    videoDash,
  );
}

type View = "day" | "week" | "month";

const cardClass =
  "overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]";

export function DoctorAgenda({ initialPatientId }: { initialPatientId?: string } = {}) {
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [appts, setAppts] = useState<DoctorAgendaAppointment[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DoctorAgendaAppointment | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<string>("");
  const [splitAt, setSplitAt] = useState("");
  const [cancelStep, setCancelStep] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [drag, setDrag] = useState<{
    id: string;
    originStart: Date;
    originEnd: Date;
    grabY: number;
    colDay: Date;
  } | null>(null);
  const [dragDy, setDragDy] = useState(0);
  const dragMovedRef = useRef(false);

  const range = useMemo(() => {
    if (view === "day") {
      const d0 = new Date(anchor);
      d0.setHours(0, 0, 0, 0);
      const d1 = addDays(d0, 1);
      return { from: d0, to: d1, days: [d0] };
    }
    if (view === "week") {
      const ws = startOfWeek(anchor, { weekStartsOn: 1 });
      const we = endOfWeek(anchor, { weekStartsOn: 1 });
      return { from: ws, to: addDays(we, 1), days: eachDayOfInterval({ start: ws, end: we }) };
    }
    const ms = startOfMonth(anchor);
    const me = endOfMonth(anchor);
    return { from: ms, to: addDays(me, 1), days: eachDayOfInterval({ start: ms, end: me }) };
  }, [anchor, view]);

  const showToast = useCallback((t: Toast) => {
    setToast(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        doctorsApi.getMyAppointments(range.from.toISOString(), range.to.toISOString()),
        doctorsApi.listMyScheduleBlocks(range.from.toISOString(), range.to.toISOString()),
      ]);
      setAppts(Array.isArray(a) ? (a as DoctorAgendaAppointment[]) : []);
      setBlocks(Array.isArray(b) ? (b as ScheduleBlock[]) : []);
    } catch {
      setAppts([]);
      setBlocks([]);
      showToast({ variant: "error", text: "Impossible de charger l’agenda. Vérifiez la connexion et votre session." });
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let x = START_H; x <= END_H; x++) h.push(x);
    return h;
  }, []);

  const apptsByDay = useMemo(() => {
    const map = new Map<string, DoctorAgendaAppointment[]>();
    for (const d of range.days) {
      map.set(format(d, "yyyy-MM-dd"), []);
    }
    for (const a of appts) {
      const sd = parseISO(a.startTime);
      const key = format(sd, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    for (const arr of map.values()) {
      arr.sort((x, y) => parseISO(x.startTime).getTime() - parseISO(y.startTime).getTime());
    }
    return map;
  }, [appts, range.days]);

  const stats = useMemo(() => {
    const active = appts.filter((a) => a.status !== "cancelled");
    const pending = active.filter((a) => a.status === "pending").length;
    const today = format(new Date(), "yyyy-MM-dd");
    const todayN = active.filter((a) => format(parseISO(a.startTime), "yyyy-MM-dd") === today).length;
    return { total: active.length, pending, todayN, blocks: blocks.length };
  }, [appts, blocks]);

  const mergeCandidates = useMemo(() => {
    if (!selected) return [];
    const day = parseISO(selected.startTime);
    return appts.filter(
      (a) => a.id !== selected.id && isSameDay(parseISO(a.startTime), day) && a.status !== "cancelled",
    );
  }, [appts, selected]);

  const onPointerDown = (e: React.PointerEvent, a: DoctorAgendaAppointment, day: Date) => {
    if (a.status === "cancelled") return;
    e.preventDefault();
    dragMovedRef.current = false;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag({
      id: a.id,
      originStart: parseISO(a.startTime),
      originEnd: parseISO(a.endTime),
      grabY: e.clientY,
      colDay: day,
    });
    setDragDy(0);
  };

  useEffect(() => {
    if (!drag) return;
    let currentDy = 0;
    const move = (ev: PointerEvent) => {
      currentDy = ev.clientY - drag.grabY;
      if (Math.abs(currentDy) > 6) dragMovedRef.current = true;
      setDragDy(currentDy);
    };
    const up = async () => {
      const deltaMin = Math.round(currentDy / PX_PER_HOUR) * 60;
      const snapped = Math.round(deltaMin / 15) * 15;
      const newStart = addMinutes(drag.originStart, snapped);
      const newEnd = addMinutes(drag.originEnd, snapped);
      const dayStart = new Date(drag.colDay);
      dayStart.setHours(START_H, 0, 0, 0);
      const dayEnd = new Date(drag.colDay);
      dayEnd.setHours(END_H, 0, 0, 0);
      if (dragMovedRef.current && newStart >= dayStart && newEnd <= dayEnd && newEnd > newStart) {
        try {
          await appointmentsApi.doctorPatch(drag.id, {
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString(),
          });
          showToast({ variant: "success", text: "Créneau déplacé." });
          await load();
        } catch {
          showToast({ variant: "error", text: "Déplacement refusé (conflit ou règle métier)." });
        }
      }
      setDrag(null);
      setDragDy(0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag, load, showToast]);

  const saveDetail = async () => {
    if (!selected) return;
    try {
      await appointmentsApi.doctorPatch(selected.id, {
        status: selected.status,
        notes: selected.notes,
        reason: selected.reason,
        type: selected.type === "video" ? "video" : "in_person",
      });
      setSelected(null);
      setCancelStep(false);
      setCancelReason("");
      showToast({ variant: "success", text: "Rendez-vous mis à jour." });
      await load();
    } catch {
      showToast({ variant: "error", text: "Enregistrement impossible." });
    }
  };

  const downloadIcs = async () => {
    try {
      const text = await doctorsApi.fetchMyAppointmentsIcsText();
      const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ophthocare-rdv.ics";
      a.click();
      URL.revokeObjectURL(url);
      showToast({ variant: "success", text: "Export .ics téléchargé." });
    } catch {
      showToast({ variant: "error", text: "Export ICS indisponible." });
    }
  };

  const calendarModifiers = useMemo(() => {
    const has = new Set<string>();
    for (const a of appts) {
      if (a.status === "cancelled") continue;
      has.add(format(parseISO(a.startTime), "yyyy-MM-dd"));
    }
    return {
      hasAppt: (d: Date) => has.has(format(d, "yyyy-MM-dd")),
    };
  }, [appts]);

  const monthListAppts = useMemo(() => {
    return [...appts]
      .filter((a) => a.status !== "cancelled")
      .sort((x, y) => parseISO(x.startTime).getTime() - parseISO(y.startTime).getTime());
  }, [appts]);

  const shiftAnchor = (dir: -1 | 1) => {
    if (view === "week") setAnchor(addDays(anchor, 7 * dir));
    else if (view === "day") setAnchor(addDays(anchor, dir));
    else setAnchor(dir < 0 ? subMonths(anchor, 1) : addMonths(anchor, 1));
  };

  const navLabel = useMemo(() => {
    if (view === "month") return format(anchor, "MMMM yyyy", { locale: fr });
    if (view === "day") return format(anchor, "EEEE d MMMM yyyy", { locale: fr });
    return `${format(range.from, "d MMM", { locale: fr })} – ${format(addDays(range.from, 6), "d MMM yyyy", { locale: fr })}`;
  }, [anchor, range.from, view]);

  return (
    <div className="space-y-6">
      {toast ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm shadow-sm",
            toast.variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-950",
            toast.variant === "error" && "border-red-200 bg-red-50 text-red-950",
            toast.variant === "info" && "border-zinc-200 bg-zinc-50 text-zinc-800",
          )}
        >
          {toast.text}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-zinc-400">Période (actifs)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-zinc-400">À confirmer</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-700">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-zinc-400">Aujourd’hui</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-cyan-800">{stats.todayN}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-zinc-400">Blocages</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-rose-700">{stats.blocks}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-zinc-600">
            Vue <strong className="text-zinc-900">{view === "day" ? "jour" : view === "week" ? "semaine" : "mois"}</strong>{" "}
            — glisser verticalement pour déplacer (15 min). Clic sans bouger : détail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-zinc-200 bg-zinc-100/90 p-0.5">
            {(["day", "week", "month"] as const).map((v) => (
              <Button
                key={v}
                type="button"
                variant={view === v ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-9 rounded-lg px-3 text-xs font-semibold",
                  view === v && "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800",
                )}
                onClick={() => setView(v)}
              >
                {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg border-zinc-200 bg-white"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} aria-hidden />
            Actualiser
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg border-zinc-200 bg-white"
            onClick={() => void downloadIcs()}
          >
            <Download className="mr-1.5 h-4 w-4" aria-hidden />
            Export ICS
          </Button>
          <Button type="button" variant="outline" size="sm" className="rounded-lg border-zinc-200 bg-white" onClick={() => setAnchor(new Date())}>
            <CalendarIcon className="mr-1.5 h-4 w-4 opacity-70" aria-hidden />
            Aujourd’hui
          </Button>
        </div>
      </div>

      <Card className={cardClass}>
        <CardHeader className="border-b border-zinc-100 bg-zinc-50/60 pb-4">
          <CardTitle className="text-base font-semibold text-zinc-900">Absences & fermetures</CardTitle>
          <CardDescription className="text-xs text-zinc-600">
            Les plages chevauchées bloquent la réservation en ligne sur les créneaux concernés.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <AbsenceForm blocks={blocks} onCreated={() => void load()} onDeleted={() => void load()} />
        </CardContent>
      </Card>

      {view === "month" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,340px),1fr]">
          <Card className={cardClass}>
            <CardHeader className="border-b border-zinc-100 pb-3">
              <CardTitle className="text-sm font-semibold text-zinc-900">Calendrier</CardTitle>
              <CardDescription className="text-xs">Point sous les jours avec au moins un RDV.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={anchor}
                onSelect={(d) => d && setAnchor(d)}
                locale={fr}
                modifiers={{
                  booked: (d) => calendarModifiers.hasAppt(d),
                }}
                modifiersClassNames={{
                  booked:
                    "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-cyan-600",
                }}
              />
              <Button type="button" variant="outline" size="sm" className="mt-4 w-full rounded-lg" onClick={() => setView("day")}>
                Ouvrir la vue jour pour la date sélectionnée
              </Button>
            </CardContent>
          </Card>
          <Card className={cardClass}>
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/60 pb-4">
              <CardTitle className="text-base font-semibold text-zinc-900">Rendez-vous du mois</CardTitle>
              <CardDescription className="text-xs">{monthListAppts.length} rendez-vous (hors annulés)</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto pt-6">
              {monthListAppts.length === 0 ? (
                <p className="text-sm text-zinc-500">Aucun rendez-vous sur cette période.</p>
              ) : (
                monthListAppts.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-zinc-50/30 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">{patientLabel(a)}</p>
                      <p className="text-xs text-zinc-500">
                        {format(parseISO(a.startTime), "EEE d MMM · HH:mm", { locale: fr })} – {format(parseISO(a.endTime), "HH:mm")}
                        {a.type === "video" ? (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-cyan-700">
                            <Video className="inline h-3 w-3" aria-hidden />
                            Visio
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      <Badge variant="outline" className="rounded-lg text-[0.6875rem]">
                        {statusLabelFr(a.status)}
                      </Badge>
                      <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => setSelected(a)}>
                        Détail
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => {
                          setAnchor(parseISO(a.startTime));
                          setView("day");
                        }}
                      >
                        Jour
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {view !== "month" ? (
        loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-20 text-sm text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-700" aria-hidden />
            Chargement de l’agenda…
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            <div
              className="grid min-w-[720px]"
              style={{ gridTemplateColumns: `56px repeat(${range.days.length}, minmax(0,1fr))` }}
            >
              <div className="border-b border-r border-zinc-100 bg-zinc-50/50" />
              {range.days.map((d) => (
                <div
                  key={d.toISOString()}
                  className="border-b border-r border-zinc-100 bg-zinc-50/50 p-2 text-center last:border-r-0"
                >
                  <div className="text-[0.625rem] font-semibold uppercase tracking-wider text-zinc-400">{format(d, "EEE", { locale: fr })}</div>
                  <div className="text-sm font-semibold text-zinc-900">{format(d, "d MMM", { locale: fr })}</div>
                </div>
              ))}

              <div className="relative border-r border-zinc-100 bg-white">
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{ height: PX_PER_HOUR }}
                    className="border-b border-zinc-100 pr-2 text-right text-[0.625rem] font-medium tabular-nums text-zinc-400"
                  >
                    {h}:00
                  </div>
                ))}
              </div>

              {range.days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const list = apptsByDay.get(key) ?? [];
                const dayBlocks = blocks.filter((b) => isSameDay(parseISO(b.startTime), day));
                return (
                  <div key={key} className="relative border-r border-zinc-100 bg-white last:border-r-0">
                    {hours.map((h) => (
                      <div key={h} style={{ height: PX_PER_HOUR }} className="border-b border-zinc-100/90" />
                    ))}
                    {dayBlocks.map((b) => {
                      const s = parseISO(b.startTime);
                      const e = parseISO(b.endTime);
                      const st = eventStyle(s, e);
                      return (
                        <div
                          key={b.id}
                          className="pointer-events-none absolute left-0 right-0 z-[5] rounded-lg border border-dashed border-rose-300/90 bg-rose-50/85 px-1 py-0.5 text-[10px] font-medium text-rose-900"
                          style={{ top: st.top, height: st.height }}
                          title={b.note ?? b.kind}
                        >
                          {b.kind}
                          {b.note ? ` · ${b.note}` : ""}
                        </div>
                      );
                    })}
                    {list.map((a) => {
                      const s = parseISO(a.startTime);
                      const e = parseISO(a.endTime);
                      const st = eventStyle(s, e);
                      const dy = drag?.id === a.id ? dragDy : 0;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          className={cn(statusColors(a.status, a.type), "z-10 cursor-grab text-left active:cursor-grabbing")}
                          style={{ top: st.top + dy, height: st.height }}
                          onPointerDown={(ev) => onPointerDown(ev, a, day)}
                          onClick={() => {
                            if (dragMovedRef.current) {
                              dragMovedRef.current = false;
                              return;
                            }
                            setCancelStep(false);
                            setCancelReason("");
                            setSelected(a);
                          }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold leading-tight">{patientLabel(a)}</span>
                            {a.type === "video" ? <Video className="h-3 w-3 shrink-0 opacity-70" aria-hidden /> : null}
                          </div>
                          <div className="mt-0.5 opacity-85">
                            {format(s, "HH:mm")}–{format(e, "HH:mm")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-3">
        <Button type="button" variant="outline" size="sm" className="rounded-lg border-zinc-200 bg-white" onClick={() => shiftAnchor(-1)}>
          ← Précédent
        </Button>
        <span className="text-center text-sm font-semibold capitalize text-zinc-800">{navLabel}</span>
        <Button type="button" variant="outline" size="sm" className="rounded-lg border-zinc-200 bg-white" onClick={() => shiftAnchor(1)}>
          Suivant →
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-zinc-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> En attente
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" /> Confirmé
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> En cours
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Terminé
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-dashed border-zinc-400" /> Visio
        </span>
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setCancelStep(false);
            setCancelReason("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-zinc-900">Rendez-vous</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
                <p className="font-semibold text-zinc-900">{patientLabel(selected)}</p>
                <p className="mt-1 text-xs text-zinc-600">
                  {format(parseISO(selected.startTime), "EEEE d MMMM yyyy · HH:mm", { locale: fr })} →{" "}
                  {format(parseISO(selected.endTime), "HH:mm")}
                </p>
                <Button variant="outline" size="sm" className="mt-3 h-8 rounded-lg text-xs" asChild>
                  <Link
                    href={`/dashboard/medecin/patients/${selected.patient.id}?tab=consultation&appointmentId=${selected.id}`}
                  >
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Démarrer consultation
                  </Link>
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={selected.status} onValueChange={(v) => setSelected({ ...selected, status: v ?? selected.status })}>
                  <SelectTrigger className="rounded-lg border-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabelFr(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={selected.type === "video" ? "video" : "in_person"}
                  onValueChange={(v) => setSelected({ ...selected, type: v === "video" ? "video" : "in_person" })}
                >
                  <SelectTrigger className="rounded-lg border-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">Cabinet</SelectItem>
                    <SelectItem value="video">Visio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Motif (patient / agenda)</Label>
                <Input
                  value={selected.reason ?? ""}
                  onChange={(e) => setSelected({ ...selected, reason: e.target.value })}
                  className="rounded-lg border-zinc-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes internes</Label>
                <textarea
                  className="min-h-[88px] w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-600/20"
                  value={selected.notes ?? ""}
                  onChange={(e) => setSelected({ ...selected, notes: e.target.value })}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" className="rounded-lg bg-zinc-900 text-white" onClick={() => void saveDetail()}>
                  Enregistrer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg border-cyan-200 bg-cyan-50 text-cyan-950 hover:bg-cyan-100"
                  onClick={async () => {
                    if (!selected) return;
                    try {
                      await appointmentsApi.confirm(selected.id);
                      setSelected(null);
                      showToast({ variant: "success", text: "Rendez-vous confirmé." });
                      await load();
                    } catch {
                      showToast({ variant: "error", text: "Confirmation impossible." });
                    }
                  }}
                >
                  Confirmer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={async () => {
                    if (!selected) return;
                    try {
                      await appointmentsApi.startConsult(selected.id);
                      setSelected(null);
                      showToast({ variant: "success", text: "Consultation démarrée." });
                      await load();
                    } catch {
                      showToast({ variant: "error", text: "Action refusée (rôle ou statut)." });
                    }
                  }}
                >
                  Démarrer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={async () => {
                    if (!selected) return;
                    try {
                      await appointmentsApi.completeConsult(selected.id);
                      setSelected(null);
                      showToast({ variant: "success", text: "Consultation terminée." });
                      await load();
                    } catch {
                      showToast({ variant: "error", text: "Impossible de clôturer." });
                    }
                  }}
                >
                  Terminer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={async () => {
                    if (!selected) return;
                    try {
                      await appointmentsApi.markNoShow(selected.id);
                      setSelected(null);
                      showToast({ variant: "info", text: "Marqué comme absent." });
                      await load();
                    } catch {
                      showToast({ variant: "error", text: "Action impossible." });
                    }
                  }}
                >
                  Absent
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => setMergeOpen(true)}>
                  Fusionner…
                </Button>
              </div>

              {!cancelStep ? (
                <Button type="button" size="sm" variant="destructive" className="rounded-lg" onClick={() => setCancelStep(true)}>
                  Annuler le rendez-vous…
                </Button>
              ) : (
                <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50/50 p-3">
                  <Label className="text-rose-900">Motif d’annulation (optionnel)</Label>
                  <textarea
                    className="min-h-[64px] w-full resize-y rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-sm"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ex. indisponibilité, demande patient…"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="rounded-lg"
                      onClick={async () => {
                        if (!selected) return;
                        try {
                          await appointmentsApi.cancelWithReason(selected.id, {
                            cancelReason: cancelReason.trim() || undefined,
                          });
                          setSelected(null);
                          setCancelStep(false);
                          setCancelReason("");
                          showToast({ variant: "success", text: "Rendez-vous annulé." });
                          await load();
                        } catch {
                          showToast({ variant: "error", text: "Annulation refusée." });
                        }
                      }}
                    >
                      Confirmer l’annulation
                    </Button>
                    <Button type="button" size="sm" variant="ghost" className="rounded-lg" onClick={() => setCancelStep(false)}>
                      Retour
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/30 p-3">
                <Label className="text-xs font-medium text-zinc-600">Scinder à (heure locale)</Label>
                <Input type="datetime-local" value={splitAt} onChange={(e) => setSplitAt(e.target.value)} className="mt-1 rounded-lg border-zinc-200" />
                <Button
                  type="button"
                  size="sm"
                  className="mt-2 rounded-lg"
                  variant="secondary"
                  disabled={!splitAt || !selected}
                  onClick={async () => {
                    if (!selected || !splitAt) return;
                    try {
                      const iso = new Date(splitAt).toISOString();
                      await appointmentsApi.doctorSplit(selected.id, iso);
                      setSelected(null);
                      setSplitAt("");
                      showToast({ variant: "success", text: "Rendez-vous scindé." });
                      await load();
                    } catch {
                      showToast({ variant: "error", text: "Scission impossible (horaire hors plage ?)." });
                    }
                  }}
                >
                  Scinder
                </Button>
              </div>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="w-full rounded-lg text-zinc-600"
                onClick={async () => {
                  if (!selected) return;
                  try {
                    await appointmentsApi.doctorRemind(selected.id);
                    showToast({ variant: "success", text: "Rappel envoyé (si configuré côté serveur)." });
                  } catch {
                    showToast({ variant: "error", text: "Rappel non envoyé." });
                  }
                }}
              >
                Envoyer un rappel au patient
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="max-w-md rounded-2xl border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Fusionner deux créneaux</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">
            Le rendez-vous courant sera étendu pour absorber l’autre ; ce dernier sera annulé côté serveur (fusion).
          </p>
          {mergeCandidates.length === 0 ? (
            <p className="text-sm text-amber-800">Aucun autre rendez-vous ce jour à fusionner.</p>
          ) : (
            <div className="space-y-2">
              <Label>Absorber ce rendez-vous</Label>
              <Select value={mergeTarget || undefined} onValueChange={(v) => setMergeTarget(v ?? "")}>
                <SelectTrigger className="rounded-lg border-zinc-200">
                  <SelectValue placeholder="Choisir un RDV le même jour" />
                </SelectTrigger>
                <SelectContent>
                  {mergeCandidates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {format(parseISO(c.startTime), "HH:mm")} — {patientLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => setMergeOpen(false)}>
              Fermer
            </Button>
            <Button
              type="button"
              className="rounded-lg bg-zinc-900 text-white"
              disabled={!selected || !mergeTarget}
              onClick={async () => {
                if (!selected || !mergeTarget) return;
                try {
                  await appointmentsApi.doctorMerge(selected.id, mergeTarget);
                  setMergeOpen(false);
                  setMergeTarget("");
                  setSelected(null);
                  showToast({ variant: "success", text: "Fusion effectuée." });
                  await load();
                } catch {
                  showToast({ variant: "error", text: "Fusion refusée (créneaux incompatibles ?)." });
                }
              }}
            >
              Fusionner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewAppointmentCard onCreated={() => void load()} onNotify={showToast} />
    </div>
  );
}

function AbsenceForm({
  blocks,
  onCreated,
  onDeleted,
}: {
  blocks: ScheduleBlock[];
  onCreated: () => void;
  onDeleted: () => void;
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [kind, setKind] = useState("absence");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    if (!start || !end) return;
    setBusy(true);
    setMsg(null);
    try {
      await doctorsApi.createScheduleBlock({
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
        kind,
        note: note || undefined,
      });
      setStart("");
      setEnd("");
      setNote("");
      onCreated();
    } catch {
      setMsg("Création impossible (dates ou droits).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {msg ? <p className="text-sm text-rose-700">{msg}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-600">Début</Label>
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border-zinc-200" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-600">Fin</Label>
          <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border-zinc-200" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-600">Type</Label>
          <Select value={kind} onValueChange={(v) => v && setKind(v)}>
            <SelectTrigger className="rounded-lg border-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="absence">Absence</SelectItem>
              <SelectItem value="closure">Fermeture</SelectItem>
              <SelectItem value="vacation">Congés</SelectItem>
              <SelectItem value="break_pause">Pause</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-600">Note</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} className="rounded-lg border-zinc-200" />
        </div>
      </div>
      <Button type="button" size="sm" className="rounded-lg bg-zinc-900 text-white" disabled={busy} onClick={() => void submit()}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Ajouter le blocage
      </Button>
      <ul className="max-h-40 space-y-2 overflow-y-auto text-xs">
        {blocks.length === 0 ? (
          <li className="text-zinc-500">Aucun blocage sur la période affichée.</li>
        ) : (
          blocks.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2">
              <span className="text-zinc-700">
                {format(parseISO(b.startTime), "dd/MM HH:mm")} – {format(parseISO(b.endTime), "HH:mm")}{" "}
                <span className="font-medium text-zinc-900">({b.kind})</span>
                {b.note ? <span className="text-zinc-500"> · {b.note}</span> : null}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 text-rose-600 hover:text-rose-700"
                onClick={async () => {
                  try {
                    await doctorsApi.deleteScheduleBlock(b.id);
                    onDeleted();
                  } catch {
                    /* */
                  }
                }}
              >
                Supprimer
              </Button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function NewAppointmentCard({
  initialPatientId,
  onCreated,
  onNotify,
}: {
  initialPatientId?: string;
  onCreated: () => void;
  onNotify: (t: Toast) => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<{ id: string; firstName?: string | null; lastName?: string | null; email?: string }[]>([]);
  const [patientId, setPatientId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [apptType, setApptType] = useState<"in_person" | "video">("in_person");
  const [busy, setBusy] = useState(false);
  const [searchBusy, setSearchBusy] = useState(false);

  useEffect(() => {
    if (initialPatientId?.trim()) {
      setPatientId(initialPatientId.trim());
    }
  }, [initialPatientId]);

  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) {
      setHits([]);
      return;
    }
    const id = window.setTimeout(async () => {
      setSearchBusy(true);
      try {
        const rows = await patientsApi.lookup(t, 15);
        setHits(rows);
      } catch {
        setHits([]);
      } finally {
        setSearchBusy(false);
      }
    }, 350);
    return () => window.clearTimeout(id);
  }, [q]);

  const create = async () => {
    if (!patientId || !start || !end) return;
    setBusy(true);
    try {
      await appointmentsApi.doctorCreate({
        patientId,
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
        reason: reason || undefined,
        type: apptType,
      });
      setPatientId("");
      setStart("");
      setEnd("");
      setReason("");
      setQ("");
      setHits([]);
      onNotify({ variant: "success", text: "Rendez-vous créé." });
      onCreated();
    } catch {
      onNotify({ variant: "error", text: "Création impossible (créneau, patient ou droits)." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={cardClass}>
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/60 pb-4">
        <CardTitle className="text-base font-semibold text-zinc-900">Nouveau rendez-vous</CardTitle>
        <CardDescription className="text-xs text-zinc-600">
          Recherche patient (nom ou email, min. 2 caractères), puis dates et type de consultation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="relative">
          <Input
            placeholder="Rechercher un patient…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-lg border-zinc-200 pr-10"
          />
          {searchBusy ? <Loader2 className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 animate-spin text-zinc-400" /> : null}
        </div>
        {hits.length > 0 ? (
          <div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-zinc-100 bg-zinc-50/30 p-1">
            {hits.map((h) => (
              <button
                key={h.id}
                type="button"
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left text-xs transition hover:bg-white",
                  patientId === h.id && "bg-white font-semibold text-cyan-900 ring-1 ring-cyan-200",
                )}
                onClick={() => setPatientId(h.id)}
              >
                {[h.firstName, h.lastName].filter(Boolean).join(" ") || h.email}
              </button>
            ))}
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Début</Label>
            <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border-zinc-200" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fin</Label>
            <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border-zinc-200" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={apptType} onValueChange={(v) => setApptType(v === "video" ? "video" : "in_person")}>
            <SelectTrigger className="rounded-lg border-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_person">Cabinet</SelectItem>
              <SelectItem value="video">Visio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input placeholder="Motif (optionnel)" value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-lg border-zinc-200" />
        <Button type="button" className="rounded-lg bg-zinc-900 text-white" disabled={busy} onClick={() => void create()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Créer le rendez-vous
        </Button>
      </CardContent>
    </Card>
  );
}
