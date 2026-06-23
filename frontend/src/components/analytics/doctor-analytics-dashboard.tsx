"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  Loader2,
  PieChart,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { doctorsApi } from "@/lib/api";
import { APP_CONFIG } from "@/lib/constants/app-config";
import type { DoctorAnalyticsPeriod, DoctorAnalyticsResponse } from "@/types/doctor-analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PERIODS: { id: DoctorAnalyticsPeriod; label: string }[] = [
  { id: "week", label: "Semaine" },
  { id: "month", label: "Mois" },
  { id: "quarter", label: "Trimestre" },
];

function formatMoney(amount: number, currency: string) {
  const n = Math.round(amount);
  if (currency === "MAD") return `${n.toLocaleString("fr-FR")} MAD`;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${n.toLocaleString("fr-FR")} ${currency}`;
  }
}

function formatChange(p: number | null) {
  if (p === null) return "—";
  const sign = p > 0 ? "+" : "";
  return `${sign}${p} %`;
}

function trendFromChange(p: number | null): "up" | "down" | "flat" {
  if (p === null || p === 0) return "flat";
  return p > 0 ? "up" : "down";
}

function downloadCsvReport(data: DoctorAnalyticsResponse) {
  const rows: string[][] = [
    [`Rapport analytiques ${APP_CONFIG.APP_NAME}`, format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })],
    ["Période", data.period],
    ["Du", format(parseISO(data.range.from), "dd/MM/yyyy", { locale: fr })],
    ["Au", format(parseISO(data.range.to), "dd/MM/yyyy", { locale: fr })],
    [],
    ["Indicateur", "Valeur", "Variation %"],
    ["Consultations", String(data.summary.consultations.value), formatChange(data.summary.consultations.changePercent)],
    ["Nouveaux patients", String(data.summary.newPatients.value), formatChange(data.summary.newPatients.changePercent)],
    [
      "Revenus",
      formatMoney(data.summary.revenue.value, data.summary.revenue.currency),
      formatChange(data.summary.revenue.changePercent),
    ],
    ["Taux de rétention", `${data.summary.retentionRate.value} %`, formatChange(data.summary.retentionRate.changePercent)],
    [],
    ["Date", "RDV", "Terminés"],
    ...data.attendanceSeries.map((s) => [s.label, String(s.appointments), String(s.completed)]),
    [],
    ["Diagnostic", "Nombre", "%"],
    ...data.diagnosisBreakdown.map((d) => [d.label, String(d.count), String(d.percent)]),
    [],
    ["Type d'activité", "Volume", "Revenu", "Taux complétion %"],
    ...data.activityByType.map((a) => [
      a.label,
      String(a.volume),
      String(a.revenue),
      String(a.completionRate),
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-${data.period}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DoctorAnalyticsDashboard() {
  const [period, setPeriod] = useState<DoctorAnalyticsPeriod>("month");
  const [data, setData] = useState<DoctorAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await doctorsApi.getMyAnalytics(period);
      setData(res);
    } catch {
      setError("Impossible de charger les statistiques. Vérifiez que le backend est démarré.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    if (!data) return [];
    const s = data.summary;
    return [
      {
        title: "Consultations",
        value: String(s.consultations.value),
        change: formatChange(s.consultations.changePercent),
        trend: trendFromChange(s.consultations.changePercent),
        icon: Activity,
      },
      {
        title: "Nouveaux patients",
        value: String(s.newPatients.value),
        change: formatChange(s.newPatients.changePercent),
        trend: trendFromChange(s.newPatients.changePercent),
        icon: Users,
      },
      {
        title: "Revenus",
        value: formatMoney(s.revenue.value, s.revenue.currency),
        change: formatChange(s.revenue.changePercent),
        trend: trendFromChange(s.revenue.changePercent),
        icon: TrendingUp,
      },
      {
        title: "Taux de rétention",
        value: `${s.retentionRate.value} %`,
        change: formatChange(s.retentionRate.changePercent),
        trend: trendFromChange(s.retentionRate.changePercent),
        icon: BarChart3,
      },
    ];
  }, [data]);

  const periodLabel = useMemo(() => {
    if (!data) return "";
    const from = format(parseISO(data.range.from), "d MMM yyyy", { locale: fr });
    const to = format(parseISO(data.range.to), "d MMM yyyy", { locale: fr });
    return `${from} — ${to}`;
  }, [data]);

  const chartData = useMemo(
    () =>
      data?.attendanceSeries.map((s) => ({
        name: s.label,
        rdv: s.appointments,
        termines: s.completed,
      })) ?? [],
    [data],
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight transition-colors",
                  period === p.id
                    ? "bg-cyan-600 text-white"
                    : "text-slate-500 hover:text-slate-900",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg border-slate-200 bg-white px-3 text-[12px] font-semibold"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-3.5 w-3.5 text-slate-400", loading && "animate-spin")} />
            Actualiser
          </Button>
          <Button
            type="button"
            className="h-9 rounded-lg bg-cyan-600 px-4 text-[12px] font-semibold text-white shadow-sm hover:bg-cyan-700"
            disabled={!data}
            onClick={() => data && downloadCsvReport(data)}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Exporter CSV
          </Button>
        </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {loading && !data ? (
        <div className="flex justify-center py-20 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="overflow-hidden border-slate-100 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                      <stat.icon className="h-4 w-4 text-slate-600" />
                    </div>
                    <div
                      className={cn(
                        "flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-bold",
                        stat.trend === "up" && "bg-emerald-50 text-emerald-600",
                        stat.trend === "down" && "bg-rose-50 text-rose-600",
                        stat.trend === "flat" && "bg-slate-100 text-slate-500",
                      )}
                    >
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="mr-1 h-3 w-3" />
                      ) : stat.trend === "down" ? (
                        <ArrowDownRight className="mr-1 h-3 w-3" />
                      ) : null}
                      {stat.change}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{stat.title}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="flex flex-col overflow-hidden border-slate-100 shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  Fréquentation du cabinet
                </CardTitle>
                <Badge variant="outline" className="h-6 rounded-md border-none bg-slate-50 px-2 text-[10px] font-bold uppercase tracking-tight text-slate-500">
                  RDV planifiés vs terminés
                </Badge>
              </CardHeader>
              <CardContent className="min-h-[300px] p-4">
                {chartData.length === 0 ? (
                  <p className="flex h-[280px] items-center justify-center text-sm text-slate-500">
                    Aucun rendez-vous sur cette période.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="rdv" name="RDV" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="termines" name="Terminés" fill="#0f172a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col overflow-hidden border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-50 px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <PieChart className="h-4 w-4 text-slate-400" />
                  Diagnostics (consultations)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                {data.diagnosisBreakdown.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aucun diagnostic renseigné sur la période. Complétez le champ diagnostic dans les consultations.
                  </p>
                ) : (
                  data.diagnosisBreakdown.map((item, i) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="text-slate-900">
                          {item.count} · {item.percent} %
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-50">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            i === 0 ? "bg-slate-900" : i === 1 ? "bg-slate-600" : "bg-slate-400",
                          )}
                          style={{ width: `${Math.min(100, item.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden border-slate-100 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-50 px-6 py-4">
              <CardTitle className="text-sm font-bold">Activité par type de rendez-vous</CardTitle>
              <p className="text-[11px] text-slate-500">
                {data.summary.completedAppointments.value} terminés sur {data.summary.completedAppointments.total} RDV
                (hors annulés)
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {data.activityByType.length === 0 ? (
                <p className="px-6 py-8 text-sm text-slate-500">Aucune activité enregistrée.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {data.activityByType.map((item) => (
                    <div
                      key={item.key}
                      className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50"
                    >
                      <p className="min-w-[200px] text-[13px] font-bold text-slate-900">{item.label}</p>
                      <div className="flex flex-wrap gap-10">
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Volume</p>
                          <p className="text-[13px] font-bold text-slate-900">{item.volume}</p>
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Revenu</p>
                          <p className="text-[13px] font-bold text-slate-900">
                            {formatMoney(item.revenue, data.summary.revenue.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Complétion
                          </p>
                          <p className="text-[13px] font-bold text-slate-900">{item.completionRate} %</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {data.consultationDuration?.byAppointmentKind?.length ? (
            <Card className="overflow-hidden border-slate-100 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-50 px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <Activity className="h-4 w-4 text-slate-400" />
                  Durée moyenne de consultation
                </CardTitle>
                <p className="text-[11px] text-slate-500">
                  Temps entre ouverture et clôture (consultations terminées sur la période).
                </p>
              </CardHeader>
              <CardContent className="min-h-[280px] p-4">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={data.consultationDuration.byAppointmentKind.map((r) => ({
                      name: r.label.length > 28 ? `${r.label.slice(0, 26)}…` : r.label,
                      minutes: r.avgMinutes,
                      count: r.count,
                    }))}
                    margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      angle={-25}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      label={{ value: 'min', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value, _name, item) => {
                        const n = typeof value === 'number' ? value : Number(value);
                        const count = (item?.payload as { count?: number })?.count;
                        return [`${n} min (${count ?? 0} actes)`, 'Durée moy.'];
                      }}
                    />
                    <Bar dataKey="minutes" name="Durée moyenne" fill="#0891b2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
