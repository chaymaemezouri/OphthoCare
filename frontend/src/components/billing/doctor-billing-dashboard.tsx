"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Clock,
  CreditCard,
  Download,
  Euro,
  Loader2,
  MoreVertical,
  Plus,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { doctorsApi } from "@/lib/api";
import type {
  BillingPeriod,
  DoctorBillingItem,
  DoctorBillingResponse,
  PaymentMethod,
  PaymentStatus,
} from "@/types/doctor-billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  downloadFinancialReportCsv,
  downloadFinancialReportExcel,
  downloadFinancialReportPdf,
} from "@/lib/billing-export";

const PERIODS: { id: BillingPeriod; label: string }[] = [
  { id: "day", label: "Jour" },
  { id: "month", label: "Mois" },
  { id: "year", label: "Année" },
];

const STATUS_FILTERS: { id: PaymentStatus | "all"; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "paid", label: "Payé" },
  { id: "pending", label: "En attente" },
  { id: "partial", label: "Partiel" },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "card", label: "Carte bancaire" },
  { id: "cash", label: "Espèces" },
  { id: "transfer", label: "Virement" },
  { id: "check", label: "Chèque" },
  { id: "other", label: "Autre" },
];

function formatMoney(amount: number, currency: string) {
  const n = Math.round(amount * 100) / 100;
  if (currency === "MAD") return `${n.toLocaleString("fr-FR")} MAD`;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toLocaleString("fr-FR")} ${currency}`;
  }
}

function statusLabel(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "Payé";
    case "pending":
      return "En attente";
    case "partial":
      return "Partiel";
  }
}

function statusBadgeClass(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-600";
    case "pending":
      return "bg-orange-50 text-orange-600";
    case "partial":
      return "bg-blue-50 text-blue-600";
  }
}

export function DoctorBillingDashboard() {
  const [period, setPeriod] = useState<BillingPeriod>("month");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [data, setData] = useState<DoctorBillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newOpen, setNewOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<DoctorBillingItem | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("card");
  const [payStatus, setPayStatus] = useState<PaymentStatus>("paid");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await doctorsApi.getMyBilling(period, statusFilter);
      setData(res);
    } catch {
      setError("Impossible de charger la facturation.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const currency = data?.currency ?? "MAD";

  const periodLabel = useMemo(() => {
    if (!data) return "";
    return `${format(parseISO(data.range.from), "d MMM yyyy", { locale: fr })} — ${format(parseISO(data.range.to), "d MMM yyyy", { locale: fr })}`;
  }, [data]);

  const handleMarkPaid = async (item: DoctorBillingItem, method: PaymentMethod) => {
    setSaving(true);
    try {
      await doctorsApi.updateBillingReceipt(item.receiptId, {
        paymentStatus: "paid",
        paymentMethod: method,
      });
      toast.success("Paiement enregistré");
      await load();
    } catch {
      toast.error("Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateReceipt = async () => {
    if (!selectedConsultation) {
      toast.error("Choisissez une consultation");
      return;
    }
    setSaving(true);
    try {
      await doctorsApi.createBillingReceipt({
        consultationId: selectedConsultation,
        paymentStatus: payStatus,
        paymentMethod: payMethod,
      });
      toast.success("Reçu créé");
      setNewOpen(false);
      setSelectedConsultation("");
      await load();
    } catch {
      toast.error("Impossible de créer le reçu");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!payOpen) return;
    setSaving(true);
    try {
      await doctorsApi.updateBillingReceipt(payOpen.receiptId, {
        paymentStatus: payStatus,
        paymentMethod: payMethod,
      });
      toast.success("Statut mis à jour");
      setPayOpen(null);
      await load();
    } catch {
      toast.error("Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

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
                  "rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight",
                  period === p.id ? "bg-cyan-600 text-white" : "text-slate-500 hover:text-slate-900",
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
            <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} />
            Actualiser
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={!data}
              className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-semibold disabled:opacity-50"
            >
              <Download className="mr-2 h-3.5 w-3.5 text-slate-400" />
              Export comptable
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => data && downloadFinancialReportCsv(data)}>
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => data && downloadFinancialReportExcel(data)}>
                Export Excel (.xls)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => data && downloadFinancialReportPdf(data)}>
                Export PDF (impression)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            className="h-9 rounded-lg bg-cyan-600 px-4 text-[12px] font-semibold text-white shadow-sm hover:bg-cyan-700"
            onClick={() => {
              setPayStatus("pending");
              setNewOpen(true);
            }}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Nouveau reçu
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
            <Card className="border-slate-100 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50">
                    <Euro className="h-4 w-4 text-emerald-600" />
                  </div>
                  {data.summary.todayRevenueChangePercent != null ? (
                    <div className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                      {data.summary.todayRevenueChangePercent > 0 ? "+" : ""}
                      {data.summary.todayRevenueChangePercent} %
                    </div>
                  ) : null}
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Recettes du jour</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatMoney(data.summary.todayRevenue, currency)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-100 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-100 bg-orange-50">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                    {data.summary.unpaidCount} en attente
                  </div>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Impayés / à encaisser</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatMoney(data.summary.unpaidTotal, currency)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-100 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
                    <Receipt className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                    {data.summary.receiptsInPeriod} reçus
                  </div>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Encaissé (période)</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatMoney(data.summary.periodRevenue, currency)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-100 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                    <CreditCard className="h-4 w-4 text-slate-600" />
                  </div>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Mode préféré</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {data.summary.preferredPaymentMethod ?? "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden border-slate-100 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 bg-slate-50/30 px-6 py-4">
              <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-900">
                Reçus &amp; honoraires
              </CardTitle>
              <Select
                value={statusFilter}
                onValueChange={(v) => v && setStatusFilter(v as PaymentStatus | "all")}
              >
                <SelectTrigger className="h-8 w-[140px] rounded-lg text-[11px] font-semibold">
                  <SelectValue placeholder="Filtrer" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              {data.items.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">
                  Aucun reçu sur cette période. Clôturez des consultations ou créez un reçu manuellement.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-50 bg-slate-50/10">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Référence
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Patient
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Date
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Montant
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Statut
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.items.map((inv) => (
                        <tr key={inv.receiptId} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{inv.reference}</td>
                          <td className="px-6 py-4 text-[13px] font-medium text-slate-600">{inv.patientDisplayName}</td>
                          <td className="px-6 py-4 text-[13px] font-medium text-slate-400">
                            {format(parseISO(inv.date), "d MMM yyyy", { locale: fr })}
                          </td>
                          <td className="px-6 py-4 text-[13px] font-bold text-slate-900">
                            {formatMoney(inv.amount, inv.currency)}
                            {inv.paymentStatus === "partial" ? (
                              <span className="ml-1 text-[10px] font-medium text-slate-400">
                                ({formatMoney(inv.paidAmount, inv.currency)} encaissé)
                              </span>
                            ) : null}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={cn(
                                "rounded-md border-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter",
                                statusBadgeClass(inv.paymentStatus),
                              )}
                            >
                              {statusLabel(inv.paymentStatus)}
                            </Badge>
                            {inv.paymentMethodLabel !== "—" ? (
                              <p className="mt-1 text-[10px] text-slate-400">{inv.paymentMethodLabel}</p>
                            ) : null}
                          </td>
                          <td className="px-6 py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                                aria-label="Actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-lg">
                                <DropdownMenuItem
                                  onClick={() => void handleMarkPaid(inv, "card")}
                                  disabled={saving || inv.paymentStatus === "paid"}
                                >
                                  Marquer payé (CB)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => void handleMarkPaid(inv, "cash")}
                                  disabled={saving || inv.paymentStatus === "paid"}
                                >
                                  Marquer payé (espèces)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setPayOpen(inv);
                                    setPayStatus(inv.paymentStatus);
                                    setPayMethod(inv.paymentMethod ?? "card");
                                  }}
                                >
                                  Modifier le paiement…
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau reçu</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Consultations clôturées sans reçu, ou création manuelle d&apos;honoraires.
          </p>
          {data && data.pendingConsultations.length > 0 ? (
            <Select
              value={selectedConsultation}
              onValueChange={(v) => setSelectedConsultation(v ?? "")}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Choisir une consultation" />
              </SelectTrigger>
              <SelectContent>
                {data.pendingConsultations.map((c) => (
                  <SelectItem key={c.consultationId} value={c.consultationId}>
                    {c.patientDisplayName} — {formatMoney(c.suggestedAmount, c.currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-amber-800">
              Aucune consultation en attente de reçu. Clôturez une consultation depuis le dossier patient.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={payStatus} onValueChange={(v) => setPayStatus(v as PaymentStatus)}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="partial">Partiel</SelectItem>
              </SelectContent>
            </Select>
            <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>
              Annuler
            </Button>
            <Button type="button" disabled={saving || !selectedConsultation} onClick={() => void handleCreateReceipt()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer le reçu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payOpen} onOpenChange={(o) => !o && setPayOpen(null)}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le paiement</DialogTitle>
          </DialogHeader>
          {payOpen ? (
            <p className="text-sm text-slate-600">
              {payOpen.reference} — {payOpen.patientDisplayName} ({formatMoney(payOpen.amount, payOpen.currency)})
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={payStatus} onValueChange={(v) => setPayStatus(v as PaymentStatus)}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="partial">Partiel</SelectItem>
              </SelectContent>
            </Select>
            <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPayOpen(null)}>
              Annuler
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleUpdatePayment()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
