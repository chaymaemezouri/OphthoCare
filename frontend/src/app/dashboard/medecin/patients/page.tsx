"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarPlus,
  ChevronRight,
  Copy,
  ExternalLink,
  FolderOpen,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DoctorPageShell } from "@/components/doctor/doctor-page-shell";
import { DoctorPageHeader } from "@/components/doctor/doctor-page-header";
import { DOCTOR_CARD, DOCTOR_OUTLINE_BTN, DOCTOR_PRIMARY_BTN } from "@/components/doctor/doctor-dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials } from "@/lib/utils";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { doctorsApi } from "@/lib/api";
import type { DoctorMyPatientRow } from "@/types/doctor";

const PAGE_SIZE = 20;

const cardClass = DOCTOR_CARD;

type SortKey = "lastVisit" | "nameAsc" | "nameDesc";

function formatLastVisit(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
}

function statusBadgeClass(status: string): string {
  if (status === "Absent") return "bg-rose-50 text-rose-800 ring-rose-200/80";
  if (status === "Annulé") return "bg-zinc-100 text-zinc-600 ring-zinc-200/80";
  if (status === "Consulté") return "bg-emerald-50 text-emerald-900 ring-emerald-200/80";
  if (status === "Actif") return "bg-cyan-50 text-cyan-900 ring-cyan-200/80";
  if (status === "En attente") return "bg-amber-50 text-amber-950 ring-amber-200/80";
  if (status === "En cours") return "bg-sky-50 text-sky-950 ring-sky-200/80";
  return "bg-zinc-100 text-zinc-700 ring-zinc-200/80";
}

function splitDisplayName(displayName: string): { first?: string; last?: string } {
  const p = displayName.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return {};
  if (p.length === 1) return { first: p[0] };
  return { first: p[0], last: p.slice(1).join(" ") };
}

export default function MedecinPatientsPage() {
  const router = useRouter();
  useRequireAuth();
  const { user, isLoading: authLoading } = useAuth();
  const isDoctor = user?.role === "doctor";

  const [qInput, setQInput] = React.useState("");
  const [q, setQ] = React.useState("");
  const [skip, setSkip] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<DoctorMyPatientRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [sortKey, setSortKey] = React.useState<SortKey>("lastVisit");
  const [statusFilter, setStatusFilter] = React.useState<string | "all">("all");
  const [banner, setBanner] = React.useState<{ variant: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    if (!isDoctor && user && !authLoading) {
      router.replace("/unauthorized");
    }
  }, [isDoctor, user, authLoading, router]);

  React.useEffect(() => {
    const t = window.setTimeout(() => setQ(qInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [qInput]);

  React.useEffect(() => {
    setSkip(0);
  }, [q]);

  const fetchPatients = React.useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await doctorsApi.getMyPatients({
        q: q || undefined,
        skip,
        take: PAGE_SIZE,
      });
      setRows(data.items);
      setTotal(data.total);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(typeof msg === "string" ? msg : "Impossible de charger la liste des patients.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q, skip]);

  React.useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  React.useEffect(() => {
    if (!banner) return;
    const id = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(id);
  }, [banner]);

  const displayRows = React.useMemo(() => {
    let list = [...rows];
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (sortKey === "nameAsc") {
      list.sort((a, b) => a.displayName.localeCompare(b.displayName, "fr", { sensitivity: "base" }));
    } else if (sortKey === "nameDesc") {
      list.sort((a, b) => b.displayName.localeCompare(a.displayName, "fr", { sensitivity: "base" }));
    } else {
      list.sort((a, b) => parseISO(b.lastVisitAt).getTime() - parseISO(a.lastVisitAt).getTime());
    }
    return list;
  }, [rows, sortKey, statusFilter]);

  const statusOptions = React.useMemo(() => {
    const set = new Set(rows.map((r) => r.status));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b, "fr"))] as const;
  }, [rows]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageIndex = Math.floor(skip / PAGE_SIZE) + 1;
  const canPrev = skip > 0;
  const canNext = skip + PAGE_SIZE < total;

  const copyEmail = async (email?: string) => {
    if (!email?.trim()) {
      setBanner({ variant: "error", text: "Aucun e-mail pour ce patient." });
      return;
    }
    try {
      await navigator.clipboard.writeText(email);
      setBanner({ variant: "success", text: "E-mail copié dans le presse-papiers." });
    } catch {
      setBanner({ variant: "error", text: "Copie impossible (navigateur)." });
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout role="medecin">
        <div className="flex min-h-[40vh] items-center justify-center p-8 text-sm text-zinc-500">Chargement…</div>
      </DashboardLayout>
    );
  }

  if (user && !isDoctor) {
    return (
      <DashboardLayout role="medecin">
        <div className="flex min-h-[40vh] items-center justify-center p-8 text-sm text-zinc-500">Redirection…</div>
      </DashboardLayout>
    );
  }

  if (!user || !isDoctor) return null;

  return (
    <DashboardLayout role="medecin">
      <DoctorPageShell className="space-y-6">
        <DoctorPageHeader
          title="Mes patients"
          description="Dossiers patients liés à votre cabinet — accès après premier rendez-vous confirmé."
          actions={
            <>
              <Button variant="outline" size="sm" className={DOCTOR_OUTLINE_BTN} asChild>
                <Link href="/dashboard/medecin">
                  Tableau de bord
                  <ChevronRight className="ml-1 h-4 w-4 opacity-50" aria-hidden />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className={DOCTOR_OUTLINE_BTN} asChild>
                <Link href="/dashboard/medecin/agenda">
                  <CalendarPlus className="mr-1.5 h-4 w-4" aria-hidden />
                  Agenda
                </Link>
              </Button>
            </>
          }
        />

          {banner ? (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                banner.variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-950",
                banner.variant === "error" && "border-red-200 bg-red-50 text-red-950",
              )}
            >
              {banner.text}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className={cn(DOCTOR_CARD, "p-4")}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total dossiers</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{total}</p>
            </div>
            <div className={cn(DOCTOR_CARD, "p-4")}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sur cette page</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-cyan-700">{rows.length}</p>
            </div>
            <div className={cn(DOCTOR_CARD, "p-4")}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Après filtres</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{displayRows.length}</p>
            </div>
          </div>

          <Card className={cardClass}>
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/60 pb-4">
              <CardTitle className="text-base font-semibold text-zinc-900">Recherche &amp; affichage</CardTitle>
              <CardDescription className="text-xs text-zinc-600">
                Recherche serveur (nom, prénom, e-mail). Tri et filtre par statut de RDV s’appliquent à la page courante.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-end">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Rechercher par nom ou e-mail…"
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  className="h-10 rounded-lg border-zinc-200 pl-10"
                  autoComplete="off"
                />
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-48">
                <span className="text-[0.625rem] font-semibold uppercase tracking-wide text-zinc-500">Trier</span>
                <Select value={sortKey} onValueChange={(v) => setSortKey((v as SortKey) ?? "lastVisit")}>
                  <SelectTrigger className="rounded-lg border-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastVisit">Dernière visite (récent)</SelectItem>
                    <SelectItem value="nameAsc">Nom A → Z</SelectItem>
                    <SelectItem value="nameDesc">Nom Z → A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-48">
                <span className="text-[0.625rem] font-semibold uppercase tracking-wide text-zinc-500">Statut RDV</span>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
                  <SelectTrigger className="rounded-lg border-zinc-200">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {statusOptions
                      .filter((s) => s !== "all")
                      .map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 rounded-lg border-zinc-200 bg-white"
                disabled={refreshing}
                onClick={() => void fetchPatients({ silent: true })}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} aria-hidden />
                Actualiser
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
            <span>
              {loading ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-zinc-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-600" aria-hidden />
                  Chargement…
                </span>
              ) : (
                <>
                  <span className="font-medium text-zinc-700">{total}</span> patient{total !== 1 ? "s" : ""} au total
                  {q ? (
                    <>
                      {" "}
                      · recherche « <span className="text-zinc-800">{q}</span> »
                    </>
                  ) : null}
                </>
              )}
            </span>
            <span className="font-medium text-zinc-400">
              Page {pageIndex} / {pageCount}
            </span>
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          ) : null}

          <Card className={cardClass}>
            <CardContent className="p-0">
              {loading && rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-zinc-500">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-600" aria-hidden />
                  Chargement des patients…
                </div>
              ) : !loading && rows.length === 0 ? (
                <div className="space-y-3 px-6 py-16 text-center">
                  <p className="text-base font-semibold text-zinc-900">Aucun patient pour l’instant</p>
                  <p className="mx-auto max-w-md text-sm text-zinc-600">
                    Les dossiers apparaissent lorsqu’un patient a un accès cabinet (premier rendez-vous confirmé). Créez un
                    rendez-vous depuis l’agenda ou vérifiez les seeds de démonstration côté serveur.
                  </p>
                  <Button className={DOCTOR_PRIMARY_BTN} asChild>
                    <Link href="/dashboard/medecin/agenda">Ouvrir l’agenda</Link>
                  </Button>
                </div>
              ) : displayRows.length === 0 ? (
                <div className="px-6 py-14 text-center text-sm text-zinc-600">
                  Aucune ligne ne correspond au filtre de statut sur cette page. Changez de page ou élargissez le filtre.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-100 hover:bg-transparent">
                        <TableHead className="min-w-[200px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Patient
                        </TableHead>
                        <TableHead className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:table-cell">
                          E-mail
                        </TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Âge
                        </TableHead>
                        <TableHead className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 md:table-cell">
                          Dernière visite
                        </TableHead>
                        <TableHead className="min-w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Motif / suivi
                        </TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Statut RDV
                        </TableHead>
                        <TableHead className="w-[120px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayRows.map((patient) => {
                        const { first, last } = splitDisplayName(patient.displayName);
                        return (
                          <TableRow key={patient.id} className="border-zinc-50 transition hover:bg-zinc-50/60">
                            <TableCell className="px-4 py-3 align-middle">
                              <Link
                                href={`/dashboard/medecin/patients/${patient.id}`}
                                className="flex items-center gap-3 rounded-lg outline-none ring-cyan-600/0 transition hover:ring-2 focus-visible:ring-2"
                              >
                                <Avatar className="h-9 w-9 border border-zinc-200/80">
                                  <AvatarFallback className="bg-cyan-600 text-[10px] font-semibold text-white">
                                    {getInitials(first, last) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-zinc-900">{patient.displayName}</span>
                              </Link>
                            </TableCell>
                            <TableCell className="hidden max-w-[200px] truncate px-4 py-3 align-middle text-sm text-zinc-600 sm:table-cell">
                              {patient.email ?? "—"}
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle text-sm text-zinc-600">
                              {patient.age != null ? `${patient.age} ans` : "—"}
                            </TableCell>
                            <TableCell className="hidden px-4 py-3 align-middle text-sm tabular-nums text-zinc-600 md:table-cell">
                              {formatLastVisit(patient.lastVisitAt)}
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle">
                              <Badge
                                variant="outline"
                                className="max-w-[220px] truncate rounded-lg border-zinc-200 bg-zinc-50/80 text-xs font-normal text-zinc-700"
                                title={patient.condition}
                              >
                                {patient.condition}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold ring-1 ring-inset",
                                  statusBadgeClass(patient.status),
                                )}
                              >
                                {patient.status}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right align-middle">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-zinc-500 hover:text-zinc-900" asChild>
                                  <Link href={`/dashboard/medecin/patients/${patient.id}`} title="Dossier">
                                    <FolderOpen className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-lg text-zinc-500 hover:text-zinc-900"
                                        aria-label="Plus d’actions"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    }
                                  />
                                  <DropdownMenuContent align="end" className="w-52 rounded-xl border-zinc-200 p-1 shadow-lg">
                                    <DropdownMenuItem
                                      className="cursor-pointer rounded-lg gap-2 py-2 text-sm"
                                      onClick={() => router.push(`/dashboard/medecin/patients/${patient.id}`)}
                                    >
                                      <ExternalLink className="h-4 w-4 opacity-60" aria-hidden />
                                      Ouvrir le dossier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="cursor-pointer rounded-lg gap-2 py-2 text-sm"
                                      onClick={() =>
                                        router.push(`/dashboard/medecin/agenda?patientId=${encodeURIComponent(patient.id)}`)
                                      }
                                    >
                                      <CalendarPlus className="h-4 w-4 opacity-60" aria-hidden />
                                      Nouveau RDV (agenda)
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="cursor-pointer rounded-lg gap-2 py-2 text-sm"
                                      onClick={() => void copyEmail(patient.email)}
                                    >
                                      <Copy className="h-4 w-4 opacity-60" aria-hidden />
                                      Copier l’e-mail
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-4 py-4">
                  <p className="text-xs font-medium text-zinc-500">
                    {skip + 1} – {Math.min(skip + PAGE_SIZE, total)} sur {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg border-zinc-200"
                      disabled={!canPrev || loading}
                      onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
                    >
                      Précédent
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg border-zinc-200"
                      disabled={!canNext || loading}
                      onClick={() => setSkip((s) => s + PAGE_SIZE)}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
      </DoctorPageShell>
    </DashboardLayout>
  );
}
