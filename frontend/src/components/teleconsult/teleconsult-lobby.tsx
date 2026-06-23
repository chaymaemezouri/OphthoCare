"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Loader2, Video, Calendar } from "lucide-react";
import { teleconsultApi, type TeleconsultAppointmentRow } from "@/lib/api/teleconsult";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function statusFr(s: string) {
  switch (s) {
    case "confirmed":
      return "Confirmé";
    case "in_progress":
      return "En cours";
    case "pending":
      return "En attente";
    case "completed":
      return "Terminé";
    default:
      return s;
  }
}

export function TeleconsultLobby({
  onJoin,
}: {
  onJoin: (appointmentId: string) => void;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<TeleconsultAppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teleconsultApi.listAppointments(date);
      setRows(data);
    } catch {
      setError("Impossible de charger les téléconsultations du jour.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Salle d&apos;attente visio</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choisissez un rendez-vous de type <strong>visio</strong> pour démarrer la consultation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => void load()}>
            Actualiser
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="border-slate-100">
          <CardContent className="py-12 text-center text-sm text-slate-600">
            Aucun rendez-vous visio ce jour-là. Créez un RDV « Visio » depuis l&apos;{" "}
            <Link href="/dashboard/medecin/agenda" className="font-semibold text-slate-900 underline">
              agenda
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Card className="border-slate-100 shadow-sm transition hover:border-teal-200/80">
                <CardHeader className="flex flex-row items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      {r.patientDisplayName}
                    </CardTitle>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      {format(parseISO(r.startTime), "EEEE d MMMM · HH:mm", { locale: fr })}
                      {r.reason ? ` — ${r.reason}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge
                      className={cn(
                        "text-[10px] uppercase",
                        r.status === "in_progress"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {statusFr(r.status)}
                    </Badge>
                    {r.hasActiveRoom ? (
                      <span className="text-[10px] font-medium text-amber-600">Salle active</span>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                      disabled={r.status === "completed" || r.status === "cancelled"}
                      onClick={() => onJoin(r.id)}
                    >
                      <Video className="mr-1.5 h-3.5 w-3.5" />
                      Rejoindre
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
