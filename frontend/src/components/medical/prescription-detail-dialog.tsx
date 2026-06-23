"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, Loader2, Printer, Send } from "lucide-react";
import { consultationsApi } from "@/lib/api";
import { buildPrescriptionPrintHtml, printPrescriptionHtml } from "@/lib/prescription-print";
import { useDoctorProfile } from "@/hooks/use-doctor-profile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type PrescriptionListItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  plan: string | null;
  prescriptionIds: string[];
  patientId: string;
  patientDisplayName: string;
  patientDateOfBirth: string | null;
  doctorName: string;
};

function statusFr(s: string) {
  switch (s) {
    case "completed":
      return "Clôturée";
    case "in_progress":
      return "En cours";
    case "draft":
      return "Brouillon";
    default:
      return s;
  }
}

export function PrescriptionDetailDialog({
  item,
  open,
  onOpenChange,
  onShared,
}: {
  item: PrescriptionListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShared?: () => void;
}) {
  const { doctor } = useDoctorProfile(open);
  const [plan, setPlan] = useState("");
  const [prescriptionIds, setPrescriptionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ variant: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!open || !item) {
      setPlan("");
      setPrescriptionIds([]);
      setMessage(null);
      return;
    }
    setLoading(true);
    setMessage(null);
    consultationsApi
      .getById(item.id)
      .then((d) => {
        setPlan(d.plan?.trim() || item.plan || "");
        setPrescriptionIds(d.prescriptionIds ?? item.prescriptionIds ?? []);
      })
      .catch(() => {
        setPlan(item.plan || "");
        setPrescriptionIds(item.prescriptionIds);
        setMessage({ variant: "err", text: "Chargement partiel — texte issu de la liste." });
      })
      .finally(() => setLoading(false));
  }, [open, item]);

  if (!item) return null;

  const doctorPrintName = (() => {
    if (doctor?.user) {
      const n = [doctor.user.firstName, doctor.user.lastName].filter(Boolean).join(" ").trim();
      if (n) return `Dr. ${n}`;
    }
    return item.doctorName.startsWith("Dr.") ? item.doctorName : `Dr. ${item.doctorName}`;
  })();

  const handlePrint = () => {
    const html = buildPrescriptionPrintHtml({
      patientName: item.patientDisplayName,
      patientDob: item.patientDateOfBirth ?? undefined,
      doctorName: doctorPrintName,
      doctorCity: doctor?.city,
      plan: plan || "—",
      prescriptionIds,
    });
    const result = printPrescriptionHtml(html);
    if (!result.ok) {
      setMessage({
        variant: "err",
        text: "Fenêtre bloquée : autorisez les pop-ups pour imprimer ou enregistrer en PDF.",
      });
    }
  };

  const handleDownload = () => {
    const html = buildPrescriptionPrintHtml({
      patientName: item.patientDisplayName,
      patientDob: item.patientDateOfBirth ?? undefined,
      doctorName: doctorPrintName,
      doctorCity: doctor?.city,
      plan: plan || "—",
      prescriptionIds,
    });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ordonnance-${item.patientDisplayName.replace(/\s+/g, "-")}-${item.id.slice(0, 8)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ variant: "ok", text: "Fichier téléchargé — ouvrez-le puis imprimez en PDF depuis le navigateur." });
  };

  const handleSend = async () => {
    if (!plan.trim()) {
      setMessage({
        variant: "err",
        text: "Aucun texte d’ordonnance. Modifiez-la dans le dossier patient (onglet Ordonnances).",
      });
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      await consultationsApi.sharePrescriptionWithPatient(item.id);
      setMessage({
        variant: "ok",
        text: "Ordonnance envoyée : le patient reçoit une notification et la voit dans Mes consultations.",
      });
      onShared?.();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setMessage({
        variant: "err",
        text: typeof msg === "string" ? msg : "Envoi impossible.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Ordonnance — {item.patientDisplayName}</DialogTitle>
          <DialogDescription>
            {format(parseISO(item.updatedAt), "d MMMM yyyy à HH:mm", { locale: fr })} ·{" "}
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {statusFr(item.status)}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {message ? (
          <p
            className={
              message.variant === "ok"
                ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
                : "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
            }
          >
            {message.text}
          </p>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement du texte…
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Texte de l&apos;ordonnance
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
              {plan.trim() || "— Aucun texte —"}
            </p>
            {prescriptionIds.length > 0 ? (
              <p className="mt-3 text-[11px] text-slate-500">
                Références : {prescriptionIds.join(", ")}
              </p>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" className="rounded-lg bg-slate-900 text-white" onClick={handlePrint} disabled={loading}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer / PDF
          </Button>
          <Button type="button" variant="outline" className="rounded-lg" onClick={handleDownload} disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-lg"
            onClick={() => void handleSend()}
            disabled={loading || sending || !plan.trim()}
          >
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Envoyer au patient
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
