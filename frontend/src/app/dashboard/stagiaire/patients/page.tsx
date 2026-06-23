"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, Filter, MoreHorizontal, Eye, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { patientsApi } from "@/lib/api";
import type { Cim10Diagnosis, Patient } from "@/types/patient";
import { useAuth } from "@/hooks/use-auth";

const PAGE_SIZE = 20;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatLastVisit(iso: string | undefined): string {
  if (!iso) return "—";
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

function ageFromDob(dob: string | undefined): number | undefined {
  if (!dob) return undefined;
  const d = new Date(`${dob}T12:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : undefined;
}

function firstDxLabel(p: Patient): string {
  const dx = p.diagnoses as Cim10Diagnosis[] | undefined;
  if (!Array.isArray(dx) || dx.length === 0) return "—";
  const label = dx[0]?.label?.trim();
  return label || dx[0]?.code || "—";
}

export default function StagiairePatientsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [qInput, setQInput] = React.useState("");
  const [q, setQ] = React.useState("");
  const [skip, setSkip] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<Patient[]>([]);
  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== "trainee") {
      router.replace("/unauthorized");
    }
  }, [authLoading, router, user]);

  React.useEffect(() => {
    const t = window.setTimeout(() => setQ(qInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [qInput]);

  React.useEffect(() => {
    setSkip(0);
  }, [q]);

  React.useEffect(() => {
    if (authLoading || user?.role !== "trainee") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await patientsApi.list({
          q: q || undefined,
          skip,
          take: PAGE_SIZE,
        });
        if (!cancelled) {
          setRows(data.items);
          setTotal(data.total);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            e && typeof e === "object" && "response" in e
              ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
              : null;
          setError(typeof msg === "string" ? msg : "Impossible de charger la liste des patients.");
          setRows([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, q, skip, user?.role]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageIndex = Math.floor(skip / PAGE_SIZE) + 1;
  const canPrev = skip > 0;
  const canNext = skip + PAGE_SIZE < total;

  if (authLoading || user?.role !== "trainee") {
    return (
      <DashboardLayout role="stagiaire">
        <div className="max-w-6xl mx-auto p-8 text-center text-slate-500 text-sm">Chargement…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="stagiaire">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dossiers patients</h2>
            <p className="text-[13px] text-slate-500 font-medium">
              Lecture seule — cas du cabinet pour votre apprentissage supervisé
            </p>
          </div>
          <Button
            variant="outline"
            className="h-9 px-4 rounded-lg border-slate-200 text-[12px] font-semibold bg-white"
            type="button"
            disabled
            title="Bientôt"
          >
            <Filter className="mr-2 h-3.5 w-3.5 text-slate-400" />
            Filtrer
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Rechercher par nom ou e-mail..."
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              className="pl-9 h-9 bg-white border-slate-200 rounded-lg text-[12px] focus-visible:ring-1 focus-visible:ring-slate-200 transition-all"
            />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {loading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Chargement…
              </span>
            ) : (
              <>
                Affichage de {rows.length} sur {total} patient{total !== 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>

        {error && (
          <div
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            {loading && rows.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-slate-500 gap-2 text-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
                Chargement des patients…
              </div>
            ) : !loading && rows.length === 0 ? (
              <div className="px-6 py-16 text-center text-[13px] text-slate-600 space-y-2">
                <p className="font-semibold text-slate-800">Aucun patient à afficher</p>
                <p className="text-slate-500 max-w-md mx-auto">
                  Les patients apparaissent lorsqu&apos;un rendez-vous est confirmé dans votre espace cabinet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="w-[300px] px-6 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-widest">
                      Patient
                    </TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">
                      Âge
                    </TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">
                      Dernière visite (espace)
                    </TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">
                      Diagnostic (CIM-10)
                    </TableHead>
                    <TableHead className="text-right px-6 font-bold text-slate-400 uppercase text-[10px] tracking-widest">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((patient) => {
                    const u = patient.user;
                    const displayName =
                      [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.email || "Patient";
                    const age = ageFromDob(patient.dateOfBirth);
                    return (
                      <TableRow
                        key={patient.id}
                        className="group hover:bg-slate-50/30 transition-colors border-slate-50"
                      >
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-7 w-7 border border-slate-100">
                              <AvatarFallback className="bg-slate-50 text-slate-500 font-bold text-[9px]">
                                {initials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-slate-900 text-[13px]">{displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 font-medium text-[12px]">
                          {age != null ? `${age} ans` : "—"}
                        </TableCell>
                        <TableCell className="text-slate-500 font-medium text-[12px]">
                          {formatLastVisit(patient.spaceLastVisit)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-md px-2 py-0.5 border-slate-200 bg-white text-slate-500 font-bold text-[9px] uppercase tracking-tighter max-w-[240px] truncate",
                            )}
                            title={firstDxLabel(patient)}
                          >
                            {firstDxLabel(patient)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900"
                              asChild
                            >
                              <Link href={`/dashboard/stagiaire/patients/${patient.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900"
                              type="button"
                              disabled
                              aria-hidden
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {total > 0 && (
              <div className="p-4 px-6 border-t border-slate-50 flex items-center justify-between">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
