"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
  Filter,
  MoreHorizontal,
  Eye,
  UserPlus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { doctorsApi } from "@/lib/api";
import type { DoctorMyPatientRow } from "@/types/doctor";
import { useAuth } from "@/hooks/use-auth";

const PAGE_SIZE = 20;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatLastVisit(iso: string): string {
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

function statusBadgeClass(status: string): string {
  if (status === "Absent") return "bg-rose-50 text-rose-600";
  if (status === "Annulé") return "bg-slate-100 text-slate-500";
  if (status === "Consulté") return "bg-emerald-50 text-emerald-600";
  if (status === "Actif") return "bg-emerald-50 text-emerald-700";
  if (status === "En attente") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

/** URL guide : /dashboard/doctor/[id]/patients — même liste que l’espace médecin connecté. */
export default function DoctorIdPatientsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const doctorIdParam = params.id as string;

  const [verified, setVerified] = React.useState(false);
  const [qInput, setQInput] = React.useState("");
  const [q, setQ] = React.useState("");
  const [skip, setSkip] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<DoctorMyPatientRow[]>([]);
  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== "doctor") {
      router.replace("/unauthorized");
      return;
    }
    void doctorsApi.getMe().then((me) => {
      if (me.id !== doctorIdParam) {
        router.replace("/dashboard/medecin");
        return;
      }
      setVerified(true);
    });
  }, [authLoading, doctorIdParam, router, user]);

  React.useEffect(() => {
    const t = window.setTimeout(() => setQ(qInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [qInput]);

  React.useEffect(() => {
    setSkip(0);
  }, [q]);

  React.useEffect(() => {
    if (!verified) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await doctorsApi.getMyPatients({
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
          setError(
            typeof msg === "string" ? msg : "Impossible de charger la liste des patients.",
          );
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
  }, [q, skip, verified]);

  const base = `/dashboard/doctor/${doctorIdParam}/patients`;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageIndex = Math.floor(skip / PAGE_SIZE) + 1;
  const canPrev = skip > 0;
  const canNext = skip + PAGE_SIZE < total;

  if (authLoading || !verified) {
    return (
      <DashboardLayout role="medecin">
        <div className="max-w-6xl mx-auto p-8 text-center text-slate-500 text-sm">Chargement…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="medecin">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Base Patients</h2>
            <p className="text-[13px] text-slate-500 font-medium">
              Patients avec au moins un rendez-vous confirmé dans votre espace
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-all shadow-sm"
              type="button"
              asChild
            >
              <Link href="/dashboard/medecin/agenda">
                <UserPlus className="mr-2 h-3.5 w-3.5" />
                Nouveau RDV
              </Link>
            </Button>
          </div>
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
                  Les patients apparaissent après un premier rendez-vous confirmé dans votre espace.
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
                      Dernière visite
                    </TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">
                      Pathologie / motif
                    </TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">
                      Statut RDV
                    </TableHead>
                    <TableHead className="text-right px-6 font-bold text-slate-400 uppercase text-[10px] tracking-widest">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((patient) => (
                    <TableRow
                      key={patient.id}
                      className="group hover:bg-slate-50/30 transition-colors border-slate-50"
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-7 w-7 border border-slate-100">
                            <AvatarFallback className="bg-slate-50 text-slate-500 font-bold text-[9px]">
                              {initials(patient.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-slate-900 text-[13px]">
                            {patient.displayName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 font-medium text-[12px]">
                        {patient.age != null ? `${patient.age} ans` : "—"}
                      </TableCell>
                      <TableCell className="text-slate-500 font-medium text-[12px]">
                        {formatLastVisit(patient.lastVisitAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="rounded-md px-2 py-0.5 border-slate-200 bg-white text-slate-500 font-bold text-[9px] uppercase tracking-tighter max-w-[220px] truncate"
                          title={patient.condition}
                        >
                          {patient.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-md px-2 py-0.5 font-bold text-[9px] uppercase border-none",
                            statusBadgeClass(patient.status),
                          )}
                        >
                          {patient.status}
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
                            <Link href={`${base}/${patient.id}`}>
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
                  ))}
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
