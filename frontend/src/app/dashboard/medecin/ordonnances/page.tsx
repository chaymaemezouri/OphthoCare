"use client";

import * as React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DoctorPageShell } from "@/components/doctor/doctor-page-shell";
import { DoctorPageHeader } from "@/components/doctor/doctor-page-header";
import { DOCTOR_PRIMARY_BTN } from "@/components/doctor/doctor-dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  Download,
  Printer,
  FileCheck,
  FileClock,
  Eye,
  Loader2,
  AlertCircle,
  Send,
  Pencil,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { consultationsApi } from "@/lib/api";
import {
  PrescriptionDetailDialog,
  type PrescriptionListItem,
} from "@/components/medical/prescription-detail-dialog";

const PAGE_SIZE = 15;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function displayRef(id: string): string {
  return `ORD-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function statusLabel(s: string): { label: string; variant: "signed" | "draft" } {
  if (s === "completed") return { label: "Clôturée", variant: "signed" };
  return { label: "En cours", variant: "draft" };
}

export default function OrdonnancesPage() {
  const [qInput, setQInput] = React.useState("");
  const [q, setQ] = React.useState("");
  const [skip, setSkip] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<PrescriptionListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [monthTotal, setMonthTotal] = React.useState(0);
  const [draftCount, setDraftCount] = React.useState(0);
  const [detailItem, setDetailItem] = React.useState<PrescriptionListItem | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const openDetail = (item: PrescriptionListItem) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  React.useEffect(() => {
    const t = window.setTimeout(() => setQ(qInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [qInput]);

  React.useEffect(() => {
    setSkip(0);
  }, [q]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await consultationsApi.listMinePrescriptions({
        q: q || undefined,
        skip,
        take: PAGE_SIZE,
      });
      setRows(data.items);
      setTotal(data.total);
      setMonthTotal(data.stats.monthTotal);
      setDraftCount(data.stats.draftCount);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(typeof msg === "string" ? msg : "Impossible de charger les ordonnances.");
      setRows([]);
      setTotal(0);
      setMonthTotal(0);
      setDraftCount(0);
    } finally {
      setLoading(false);
    }
  }, [q, skip]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageIndex = Math.floor(skip / PAGE_SIZE) + 1;
  const canPrev = skip > 0;
  const canNext = skip + PAGE_SIZE < total;

  return (
    <DashboardLayout role="medecin">
      <DoctorPageShell className="space-y-6">
        <DoctorPageHeader
          title="Ordonnances"
          description="Consultations avec ordonnance — visualisation, impression et envoi au patient."
          actions={
            <Button className={DOCTOR_PRIMARY_BTN} size="sm" asChild>
              <Link href="/dashboard/medecin/patients">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle ordonnance
              </Link>
            </Button>
          }
        />

        {error ? (
          <div
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ce mois</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{loading ? "—" : monthTotal}</p>
              </div>
              <FileCheck className="h-5 w-5 text-slate-200" />
            </CardContent>
          </Card>
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Non clôturées</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{loading ? "—" : draftCount}</p>
              </div>
              <FileClock className="h-5 w-5 text-amber-200" />
            </CardContent>
          </Card>
          <Card className="border-slate-100 bg-slate-50/50 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Source</p>
                <p className="mt-1 text-[13px] font-bold uppercase tracking-tighter text-slate-700">
                  Consultations
                </p>
              </div>
              <div className="h-2 w-2 rounded-full bg-teal-500" />
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-slate-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-slate-50 px-6 py-4">
            <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
              Mes ordonnances ({total})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-300" />
              <Input
                placeholder="Patient, texte…"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                className="h-8 rounded-lg border-none bg-slate-50 pl-8 text-[11px] font-medium"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading && rows.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Chargement…
              </div>
            ) : rows.length === 0 ? (
              <p className="px-6 py-14 text-center text-[13px] text-slate-600">
                Aucune ordonnance enregistrée. Ouvrez un{" "}
                <Link href="/dashboard/medecin/patients" className="font-semibold text-slate-900 underline">
                  patient
                </Link>
                , onglet <strong>Ordonnances</strong>, rédigez le texte puis enregistrez.
              </p>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Réf.
                    </TableHead>
                    <TableHead className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Patient
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Date
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Extrait
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Statut
                    </TableHead>
                    <TableHead className="px-6 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((ord) => {
                    const st = statusLabel(ord.status);
                    const excerpt = ord.plan?.trim()
                      ? ord.plan.trim().slice(0, 60) + (ord.plan.length > 60 ? "…" : "")
                      : `${ord.prescriptionIds.length} réf.`;
                    return (
                      <TableRow key={ord.id} className="group border-slate-50 hover:bg-slate-50/30">
                        <TableCell className="px-6 py-4 font-mono text-[11px] font-bold text-slate-400">
                          {displayRef(ord.id)}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-6 w-6 shrink-0 border border-slate-100">
                              <AvatarFallback className="bg-slate-50 text-[8px] font-bold text-slate-400">
                                {initials(ord.patientDisplayName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-[13px] font-bold text-slate-900">
                              {ord.patientDisplayName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-[12px] font-medium text-slate-500">
                          {formatDate(ord.updatedAt)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-[12px] text-slate-600" title={ord.plan ?? ""}>
                          {excerpt}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "rounded-md border-none px-2 py-0.5 text-[9px] font-bold uppercase",
                              st.variant === "signed"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900"
                              type="button"
                              title="Voir, imprimer, envoyer"
                              onClick={() => openDetail(ord)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900"
                              type="button"
                              title="Imprimer"
                              onClick={() => openDetail(ord)}
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-slate-500 hover:text-teal-700"
                              type="button"
                              title="Envoyer au patient"
                              onClick={() => openDetail(ord)}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900"
                              asChild
                              title="Modifier dans le dossier"
                            >
                              <Link href={`/dashboard/medecin/patients/${ord.patientId}?tab=ordonnances`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {total > 0 ? (
              <div className="flex items-center justify-between border-t border-slate-50 p-4 px-6">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Page {pageIndex} sur {pageCount}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[11px] font-bold text-slate-400 hover:text-slate-900 disabled:opacity-30"
                    disabled={!canPrev || loading}
                    onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[11px] font-bold text-slate-400 hover:text-slate-900 disabled:opacity-30"
                    disabled={!canNext || loading}
                    onClick={() => setSkip((s) => s + PAGE_SIZE)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

      <PrescriptionDetailDialog
        item={detailItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onShared={() => void load()}
      />
      </DoctorPageShell>
    </DashboardLayout>
  );
}
